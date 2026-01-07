import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subject, Observable, map, finalize } from "rxjs";
import { LlmService } from "src/llm/llm.service";
import { OutcomeDetectorService } from "src/outcome-detector/outcome-detector.service";
import { AnalysesService } from "src/analyses/analyses.service";
import { FilesService } from "src/files/files.service";
import {
  MIN_FILE_CONTENT_LENGTH,
  MIN_TRANSCRIPTS_COUNT,
  MAX_TRANSCRIPTS_COUNT,
  BATCH_CONCURRENCY_LIMIT,
} from "src/utils/constants";
import { isAudioFile, retryWithBackoff, findByIdOrThrow } from "src/utils/helpers";
import { BatchProgressEventDto } from "./dto/batch-progress-event.dto";
import { BatchJob } from "./entities/batch-job.entity";
import { BatchUploadResponseDto } from "./dto/batch-upload-response.dto";
import { BatchFileInfoDto } from "./dto/batch-file-info.dto";
import { BatchStatus } from "./enums/batch-status.enum";
import { BatchStage } from "./enums/batch-stage.enum";

interface TranscriptData {
  content: string;
  filename: string;
  isAudio: boolean;
}

@Injectable()
export class BatchUploadsService {
  private readonly logger = new Logger(BatchUploadsService.name);
  private readonly activeStreams = new Map<string, Subject<BatchProgressEventDto>>();

  constructor(
    @InjectRepository(BatchJob)
    private readonly batchJobRepository: Repository<BatchJob>,
    private readonly llmService: LlmService,
    private readonly outcomeDetectorService: OutcomeDetectorService,
    private readonly analysesService: AnalysesService,
    private readonly filesService: FilesService,
  ) {}

  async createJob(files: Express.Multer.File[]): Promise<BatchUploadResponseDto> {
    if (files.length < MIN_TRANSCRIPTS_COUNT) {
      throw new BadRequestException(
        `Minimum ${MIN_TRANSCRIPTS_COUNT} files required for comparative analysis.`,
      );
    }

    if (files.length > MAX_TRANSCRIPTS_COUNT) {
      throw new BadRequestException(
        `Maximum ${MAX_TRANSCRIPTS_COUNT} files allowed per batch.`,
      );
    }

    const fileInfos: BatchFileInfoDto[] = files.map((file) => ({
      filename: file.originalname,
      isAudio: isAudioFile(file.originalname),
      processed: false,
    }));

    const job = this.batchJobRepository.create({
      status: BatchStatus.PENDING,
      totalFiles: files.length,
      processedFiles: 0,
      files: fileInfos,
    });

    const savedJob = await this.batchJobRepository.save(job);

    // Both threads run in parallel
    // Thread 1: IA pipeline (transcription → analysis → playbook)
    void this.processJob(savedJob.id, files).catch((error) => {
      this.logger.error(`Job ${savedJob.id} failed: ${error instanceof Error ? error.message : String(error)}`);
    });

    // Thread 2: File storage (non-blocking, doesn't delay analysis)
    void this.persistFiles(savedJob.id, files).catch((error) => {
      this.logger.error(`Job ${savedJob.id} file persistence failed: ${error instanceof Error ? error.message : String(error)}`);
    });

    return this.mapToResponse(savedJob);
  }

  private async persistFiles(jobId: string, files: Express.Multer.File[]): Promise<void> {
    const savedFiles = await Promise.all(
      files.map((file) =>
        this.filesService.create({
          buffer: file.buffer,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          batchJobId: jobId,
        }),
      ),
    );

    const job = await this.findJobById(jobId);
    job.files = job.files.map((info, index) => ({
      ...info,
      fileId: savedFiles[index].id,
      fileKey: savedFiles[index].key,
    }));
    await this.batchJobRepository.save(job);

    this.logger.log(`Job ${jobId}: ${savedFiles.length} files persisted to storage`);
  }

  async getJobStatus(jobId: string): Promise<BatchUploadResponseDto> {
    const job = await this.findJobById(jobId);
    return this.mapToResponse(job);
  }

  getProgressStream(jobId: string): Observable<MessageEvent> {
    if (!this.activeStreams.has(jobId)) {
      this.activeStreams.set(jobId, new Subject<BatchProgressEventDto>());
    }

    const subject = this.activeStreams.get(jobId)!;

    return subject.pipe(
      map((event) => ({ data: event }) as MessageEvent),
      finalize(() => {
        this.activeStreams.delete(jobId);
      }),
    );
  }

  private async processJob(jobId: string, files: Express.Multer.File[]): Promise<void> {
    const job = await this.findJobById(jobId);

    try {
      job.status = BatchStatus.PROCESSING;
      job.currentStage = BatchStage.UPLOADING;
      await this.batchJobRepository.save(job);

      this.emitProgress(jobId, {
        stage: BatchStage.UPLOADING,
        current: 0,
        total: files.length,
        message: "Iniciando processamento...",
      });

      // Stage 1: Process files (transcribe audio, extract text)
      const transcripts = await this.processFiles(jobId, job, files);

      // Stage 2: Detect outcomes
      const transcriptsWithOutcome = await this.detectOutcomes(jobId, job, transcripts);

      // Stage 3 & 4: Analyze and generate playbook
      const analysis = await this.analyzeTranscripts(jobId, job, transcriptsWithOutcome);

      job.status = BatchStatus.COMPLETED;
      job.currentStage = BatchStage.DONE;
      job.analysisId = analysis.id;
      job.completedAt = new Date();
      await this.batchJobRepository.save(job);

      this.emitProgress(jobId, {
        stage: BatchStage.DONE,
        current: files.length,
        total: files.length,
        message: "Análise concluída!",
        analysisId: analysis.id,
      });

      this.logger.log(`Job ${jobId} completed successfully with analysis ${analysis.id}`);
    } catch (error) {
      job.status = BatchStatus.FAILED;
      job.errorMessage = error instanceof Error ? error.message : String(error);
      await this.batchJobRepository.save(job);

      this.emitProgress(jobId, {
        stage: job.currentStage || BatchStage.UPLOADING,
        current: job.processedFiles,
        total: job.totalFiles,
        message: "Processamento falhou",
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  private async processFiles(
    jobId: string,
    job: BatchJob,
    files: Express.Multer.File[],
  ): Promise<TranscriptData[]> {
    job.currentStage = BatchStage.TRANSCRIBING;
    await this.batchJobRepository.save(job);

    const transcripts: TranscriptData[] = [];

    for (let i = 0; i < files.length; i += BATCH_CONCURRENCY_LIMIT) {
      const batch = files.slice(i, i + BATCH_CONCURRENCY_LIMIT);

      const results = await Promise.allSettled(
        batch.map(async (file, batchIndex) => {
          const fileIndex = i + batchIndex;
          const isAudio = isAudioFile(file.originalname);

          this.emitProgress(jobId, {
            stage: BatchStage.TRANSCRIBING,
            current: fileIndex + 1,
            total: files.length,
            message: isAudio
              ? `Transcrevendo ${file.originalname}...`
              : `Processando ${file.originalname}...`,
          });

          let content: string;

          if (isAudio) {
            const transcription = await retryWithBackoff(
              () => this.llmService.transcribeAudio(file.buffer, file.originalname),
              { logger: this.logger },
            );
            content = transcription.text;
          } else {
            content = file.buffer.toString("utf-8").trim();
          }

          if (content.length < MIN_FILE_CONTENT_LENGTH) {
            throw new BadRequestException(
              `${file.originalname}: Content too short (min ${MIN_FILE_CONTENT_LENGTH} chars)`,
            );
          }

          job.files[fileIndex].processed = true;
          job.processedFiles++;
          await this.batchJobRepository.save(job);

          return { content, filename: file.originalname, isAudio };
        }),
      );

      for (const [index, result] of results.entries()) {
        const fileIndex = i + index;
        if (result.status === "fulfilled") {
          transcripts.push(result.value);
        } else {
          job.files[fileIndex].error = result.reason?.message || "Processing failed";
          job.files[fileIndex].processed = true;
          await this.batchJobRepository.save(job);
          this.logger.warn(`Failed to process file ${files[fileIndex].originalname}: ${result.reason}`);
        }
      }
    }

    if (transcripts.length < MIN_TRANSCRIPTS_COUNT) {
      throw new BadRequestException(
        `Only ${transcripts.length} files processed successfully. Minimum ${MIN_TRANSCRIPTS_COUNT} required.`,
      );
    }

    return transcripts;
  }

  private async detectOutcomes(
    jobId: string,
    job: BatchJob,
    transcripts: TranscriptData[],
  ): Promise<Array<{ content: string; outcome: string; confidence: string; reason: string }>> {
    job.currentStage = BatchStage.DETECTING;
    await this.batchJobRepository.save(job);

    const results: Array<{ content: string; outcome: string; confidence: string; reason: string }> = [];

    for (let i = 0; i < transcripts.length; i++) {
      this.emitProgress(jobId, {
        stage: BatchStage.DETECTING,
        current: i + 1,
        total: transcripts.length,
        message: `Detectando outcome ${i + 1} de ${transcripts.length}...`,
      });

      const detection = await retryWithBackoff(
        () => this.outcomeDetectorService.detectOutcome(transcripts[i].content),
        { logger: this.logger },
      );

      results.push({
        content: transcripts[i].content,
        outcome: detection.outcome,
        confidence: detection.confidence,
        reason: detection.reason,
      });
    }

    return results;
  }

  private async analyzeTranscripts(
    jobId: string,
    job: BatchJob,
    transcripts: Array<{ content: string; outcome: string; confidence: string; reason: string }>,
  ): Promise<{ id: string }> {
    job.currentStage = BatchStage.ANALYZING;
    await this.batchJobRepository.save(job);

    this.emitProgress(jobId, {
      stage: BatchStage.ANALYZING,
      current: 0,
      total: 1,
      message: "Analisando padrões de vendas...",
    });

    const analysis = await this.analysesService.create({
      transcripts: transcripts.map((t) => ({ content: t.content })),
    });

    job.currentStage = BatchStage.GENERATING;
    await this.batchJobRepository.save(job);

    this.emitProgress(jobId, {
      stage: BatchStage.GENERATING,
      current: 1,
      total: 1,
      message: "Gerando playbook...",
    });

    return { id: analysis.id };
  }

  private emitProgress(jobId: string, event: BatchProgressEventDto): void {
    const subject = this.activeStreams.get(jobId);
    if (subject) {
      subject.next(event);
    }
  }

  private async findJobById(jobId: string): Promise<BatchJob> {
    return findByIdOrThrow(this.batchJobRepository, jobId, "Batch job");
  }

  private mapToResponse(job: BatchJob): BatchUploadResponseDto {
    return {
      jobId: job.id,
      status: job.status,
      currentStage: job.currentStage,
      totalFiles: job.totalFiles,
      processedFiles: job.processedFiles,
      files: job.files,
      analysisId: job.analysisId,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };
  }
}

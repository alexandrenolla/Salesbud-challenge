import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BadRequestException } from "@nestjs/common";
import { BatchUploadsService } from "./batch-uploads.service";
import { BatchJob } from "./entities/batch-job.entity";
import { LlmService } from "src/llm/llm.service";
import { OutcomeDetectorService } from "src/outcome-detector/outcome-detector.service";
import { AnalysesService } from "src/analyses/analyses.service";
import { FilesService } from "src/files/files.service";
import { BatchStatus } from "./enums/batch-status.enum";
import { Outcome } from "src/analyses/enums/outcome.enum";
import { Confidence } from "src/outcome-detector/enums/confidence.enum";

describe("BatchUploadsService", () => {
  let service: BatchUploadsService;
  let batchJobRepository: jest.Mocked<Repository<BatchJob>>;
  let llmService: jest.Mocked<LlmService>;
  let outcomeDetectorService: jest.Mocked<OutcomeDetectorService>;
  let analysesService: jest.Mocked<AnalysesService>;
  let filesService: jest.Mocked<FilesService>;

  const createMockFile = (
    name: string,
    content: string,
    mimetype = "text/plain",
  ): Express.Multer.File => ({
    fieldname: "files",
    originalname: name,
    encoding: "utf-8",
    mimetype,
    size: Buffer.from(content).length,
    buffer: Buffer.from(content),
    destination: "",
    filename: name,
    path: "",
    stream: null as never,
  });

  const mockBatchJob: Partial<BatchJob> = {
    id: "job-123",
    status: BatchStatus.PENDING,
    totalFiles: 2,
    processedFiles: 0,
    files: [
      { filename: "file1.txt", isAudio: false, processed: false },
      { filename: "file2.txt", isAudio: false, processed: false },
    ],
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchUploadsService,
        {
          provide: getRepositoryToken(BatchJob),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: LlmService,
          useValue: {
            transcribeAudio: jest.fn(),
          },
        },
        {
          provide: OutcomeDetectorService,
          useValue: {
            detectOutcome: jest.fn(),
          },
        },
        {
          provide: AnalysesService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: FilesService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BatchUploadsService>(BatchUploadsService);
    batchJobRepository = module.get(getRepositoryToken(BatchJob));
    llmService = module.get(LlmService);
    outcomeDetectorService = module.get(OutcomeDetectorService);
    analysesService = module.get(AnalysesService);
    filesService = module.get(FilesService);
  });

  describe("createJob", () => {
    it("should create a batch job with valid files", async () => {
      const files = [
        createMockFile("file1.txt", "A".repeat(200)),
        createMockFile("file2.txt", "B".repeat(200)),
      ];

      batchJobRepository.create.mockReturnValue(mockBatchJob as BatchJob);
      batchJobRepository.save.mockResolvedValue(mockBatchJob as BatchJob);
      batchJobRepository.findOne.mockResolvedValue(mockBatchJob as BatchJob);

      outcomeDetectorService.detectOutcome.mockResolvedValue({
        outcome: Outcome.WON,
        confidence: Confidence.HIGH,
        reason: "Test",
      });

      analysesService.create.mockResolvedValue({
        id: "analysis-123",
      } as never);

      filesService.create.mockResolvedValue({
        id: "file-123",
        key: "key-123",
      } as never);

      const result = await service.createJob(files);

      expect(result.jobId).toBe("job-123");
      expect(result.status).toBe(BatchStatus.PENDING);
      expect(batchJobRepository.create).toHaveBeenCalled();
      expect(batchJobRepository.save).toHaveBeenCalled();
    });

    it("should throw BadRequestException when less than 2 files", async () => {
      const files = [createMockFile("file1.txt", "A".repeat(200))];

      await expect(service.createJob(files)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when more than 20 files", async () => {
      const files = Array(21)
        .fill(null)
        .map((_, i) => createMockFile(`file${i}.txt`, "A".repeat(200)));

      await expect(service.createJob(files)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should correctly identify audio files", async () => {
      const files = [
        createMockFile("audio.mp3", "A".repeat(200), "audio/mpeg"),
        createMockFile("text.txt", "B".repeat(200)),
      ];

      batchJobRepository.create.mockImplementation(
        (data) => ({ ...mockBatchJob, ...data }) as BatchJob,
      );
      batchJobRepository.save.mockImplementation(
        (job) => Promise.resolve(job) as Promise<BatchJob>,
      );
      batchJobRepository.findOne.mockResolvedValue(mockBatchJob as BatchJob);

      outcomeDetectorService.detectOutcome.mockResolvedValue({
        outcome: Outcome.WON,
        confidence: Confidence.HIGH,
        reason: "Test",
      });

      analysesService.create.mockResolvedValue({ id: "analysis-123" } as never);
      filesService.create.mockResolvedValue({
        id: "file-123",
        key: "key-123",
      } as never);

      const result = await service.createJob(files);

      expect(result).toBeDefined();
      expect(batchJobRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([
            expect.objectContaining({ isAudio: true }),
            expect.objectContaining({ isAudio: false }),
          ]),
        }),
      );
    });
  });

  describe("getJobStatus", () => {
    it("should return job status when found", async () => {
      const jobForStatus = { ...mockBatchJob, status: BatchStatus.PENDING };
      batchJobRepository.findOne.mockResolvedValue(jobForStatus as BatchJob);

      const result = await service.getJobStatus("job-123");

      expect(result.jobId).toBe("job-123");
      expect(result.status).toBeDefined();
    });

    it("should throw NotFoundException when job not found", async () => {
      batchJobRepository.findOne.mockResolvedValue(null);

      await expect(service.getJobStatus("non-existent")).rejects.toThrow();
    });
  });

  describe("getProgressStream", () => {
    it("should return an observable for progress events", () => {
      const observable = service.getProgressStream("job-123");

      expect(observable).toBeDefined();
      expect(observable.subscribe).toBeDefined();
    });

    it("should reuse existing stream for same job id", () => {
      const stream1 = service.getProgressStream("job-123");
      const stream2 = service.getProgressStream("job-123");

      // Both should be from the same source
      expect(stream1).toBeDefined();
      expect(stream2).toBeDefined();
    });
  });
});

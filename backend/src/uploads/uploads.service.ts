import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import * as path from "path";
import { OutcomeDetectorService } from "src/outcome-detector/outcome-detector.service";
import { LlmService } from "src/llm/llm.service";
import {
  MIN_FILE_CONTENT_LENGTH,
  ALLOWED_AUDIO_EXTENSIONS,
} from "src/utils/constants";
import { UploadResponseDto } from "./dto/upload-response.dto";

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly outcomeDetectorService: OutcomeDetectorService,
    private readonly llmService: LlmService,
  ) {}

  async processUpload(file: Express.Multer.File): Promise<UploadResponseDto> {
    this.logger.log(
      `Processing file: ${file.originalname} (${file.size} bytes)`,
    );

    const ext = path.extname(file.originalname).toLowerCase();
    const isAudio = ALLOWED_AUDIO_EXTENSIONS.includes(ext);

    let content: string;

    if (isAudio) {
      this.logger.log(`Transcribing audio file: ${file.originalname}`);
      // AssemblyAI returns text with speaker diarization (Speaker A, Speaker B)
      const transcription = await this.llmService.transcribeAudio(
        file.buffer,
        file.originalname,
      );
      content = transcription.text;
    } else {
      content = file.buffer.toString("utf-8").trim();
    }

    if (content.length < MIN_FILE_CONTENT_LENGTH) {
      throw new BadRequestException(
        `Content too short. Minimum of ${MIN_FILE_CONTENT_LENGTH} characters required.`,
      );
    }

    const detection = await this.outcomeDetectorService.detectOutcome(content);

    return {
      content,
      filename: file.originalname,
      detectedOutcome: detection.outcome,
      confidence: detection.confidence,
      reason: detection.reason,
      isTranscribed: isAudio,
    };
  }
}

import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { OutcomeDetectorService } from "src/outcome-detector/outcome-detector.service";
import { MIN_FILE_CONTENT_LENGTH } from "src/utils/constants";
import { UploadResponseDto } from "./dto/upload-response.dto";

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly outcomeDetectorService: OutcomeDetectorService) {}

  async processUpload(file: Express.Multer.File): Promise<UploadResponseDto> {
    this.logger.log(`Processing file: ${file.originalname} (${file.size} bytes)`);

    const content = file.buffer.toString("utf-8").trim();

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
    };
  }
}

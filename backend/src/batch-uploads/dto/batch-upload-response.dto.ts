import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BatchStatus, BatchStage } from "../enums";
import { BatchFileInfoDto } from "./batch-file-info.dto";

export class BatchUploadResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: "Job ID" })
  jobId: string;

  @ApiProperty({ enum: BatchStatus, example: BatchStatus.PROCESSING, description: "Current job status" })
  status: BatchStatus;

  @ApiPropertyOptional({ enum: BatchStage, example: BatchStage.TRANSCRIBING, description: "Current processing stage" })
  currentStage?: BatchStage;

  @ApiProperty({ example: 5, description: "Total number of files" })
  totalFiles: number;

  @ApiProperty({ example: 3, description: "Number of files processed" })
  processedFiles: number;

  @ApiPropertyOptional({ type: [BatchFileInfoDto], description: "File processing details" })
  files?: BatchFileInfoDto[];

  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000", description: "Analysis ID when completed" })
  analysisId?: string;

  @ApiPropertyOptional({ example: "Rate limit exceeded", description: "Error message if failed" })
  errorMessage?: string;

  @ApiProperty({ example: "2024-01-15T10:30:00.000Z", description: "Job creation timestamp" })
  createdAt: Date;

  @ApiPropertyOptional({ example: "2024-01-15T10:32:00.000Z", description: "Job completion timestamp" })
  completedAt?: Date;
}

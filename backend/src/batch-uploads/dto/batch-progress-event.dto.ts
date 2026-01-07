import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BatchStage } from "../enums";

export class BatchProgressEventDto {
  @ApiProperty({ enum: BatchStage, example: BatchStage.TRANSCRIBING, description: "Current processing stage" })
  stage: BatchStage;

  @ApiProperty({ example: 3, description: "Current progress count" })
  current: number;

  @ApiProperty({ example: 5, description: "Total items to process" })
  total: number;

  @ApiProperty({ example: "Transcrevendo arquivo 3 de 5...", description: "Human-readable progress message" })
  message: string;

  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000", description: "Analysis ID when stage is DONE" })
  analysisId?: string;

  @ApiPropertyOptional({ example: "Transcription failed", description: "Error message if any" })
  error?: string;
}

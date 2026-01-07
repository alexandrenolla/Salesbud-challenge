import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Outcome } from "src/analyses/enums/outcome.enum";
import { Confidence } from "src/outcome-detector/enums/confidence.enum";

export class UploadResponseDto {
  @ApiProperty({ description: "File content (or transcribed text for audio)" })
  content: string;

  @ApiProperty({ description: "Original filename" })
  filename: string;

  @ApiProperty({ enum: Outcome, description: "Detected outcome" })
  detectedOutcome: Outcome;

  @ApiProperty({ enum: Confidence, description: "Confidence level" })
  confidence: Confidence;

  @ApiProperty({ description: "Detection justification" })
  reason: string;

  @ApiPropertyOptional({
    description: "Whether content was transcribed from audio",
    example: false,
  })
  isTranscribed?: boolean;
}

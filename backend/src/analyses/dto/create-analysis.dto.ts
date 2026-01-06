import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsString,
  IsNotEmpty,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import {
  MIN_TRANSCRIPTS_COUNT,
  MAX_TRANSCRIPTS_COUNT,
  MIN_TRANSCRIPT_LENGTH,
} from "src/utils/constants";

class TranscriptItemDto {
  @IsNotEmpty({ message: "Content is required" })
  @IsString()
  @MinLength(MIN_TRANSCRIPT_LENGTH, {
    message: `Content must have at least ${MIN_TRANSCRIPT_LENGTH} characters`,
  })
  @ApiProperty({
    description: "Meeting transcript content",
    example: "Vendedor: Olá, tudo bem? Como posso ajudar hoje?...",
    minLength: MIN_TRANSCRIPT_LENGTH,
  })
  content: string;
}

export class CreateAnalysisDto {
  @IsArray()
  @ArrayMinSize(MIN_TRANSCRIPTS_COUNT, {
    message: `Minimum of ${MIN_TRANSCRIPTS_COUNT} transcripts required`,
  })
  @ArrayMaxSize(MAX_TRANSCRIPTS_COUNT, {
    message: `Maximum of ${MAX_TRANSCRIPTS_COUNT} transcripts allowed`,
  })
  @ValidateNested({ each: true })
  @Type(() => TranscriptItemDto)
  @ApiProperty({
    description: "List of meeting transcripts for analysis",
    type: [TranscriptItemDto],
    minItems: MIN_TRANSCRIPTS_COUNT,
    maxItems: MAX_TRANSCRIPTS_COUNT,
  })
  transcripts: TranscriptItemDto[];
}

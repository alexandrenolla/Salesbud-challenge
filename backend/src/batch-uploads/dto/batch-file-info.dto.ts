import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class BatchFileInfoDto {
  @ApiProperty({ example: "reuniao-vendas.txt", description: "Original filename" })
  @IsString()
  filename: string;

  @ApiProperty({ example: false, description: "Whether the file is an audio file" })
  @IsBoolean()
  isAudio: boolean;

  @ApiProperty({ example: true, description: "Whether the file has been processed" })
  @IsBoolean()
  processed: boolean;

  @ApiPropertyOptional({ example: "Transcription failed", description: "Error message if processing failed" })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000", description: "ID of the stored file" })
  @IsOptional()
  @IsString()
  fileId?: string;

  @ApiPropertyOptional({ example: "uploads/2024-01-15/abc123-reuniao.txt", description: "Storage key of the file" })
  @IsOptional()
  @IsString()
  fileKey?: string;
}

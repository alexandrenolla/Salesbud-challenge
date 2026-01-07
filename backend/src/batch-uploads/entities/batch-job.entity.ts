import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Analysis } from "src/analyses/entities/analysis.entity";
import { BatchStatus, BatchStage } from "../enums";
import { BatchFileInfoDto } from "../dto";

@Entity({ name: "batch_jobs" })
export class BatchJob {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ enum: BatchStatus, example: BatchStatus.PROCESSING })
  @Column({ name: "status", type: "enum", enum: BatchStatus, default: BatchStatus.PENDING })
  status: BatchStatus;

  @ApiPropertyOptional({ enum: BatchStage, example: BatchStage.TRANSCRIBING })
  @Column({ name: "current_stage", type: "enum", enum: BatchStage, nullable: true })
  currentStage: BatchStage;

  @ApiProperty({ example: 5 })
  @Column({ name: "total_files", type: "int" })
  totalFiles: number;

  @ApiProperty({ example: 3 })
  @Column({ name: "processed_files", type: "int", default: 0 })
  processedFiles: number;

  @ApiProperty({ type: [BatchFileInfoDto], description: "File processing details" })
  @Column({ name: "files", type: "jsonb" })
  @ValidateNested({ each: true })
  @Type(() => BatchFileInfoDto)
  files: BatchFileInfoDto[];

  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @Column({ name: "analysis_id", type: "uuid", nullable: true })
  analysisId: string;

  @ManyToOne(() => Analysis, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "analysis_id" })
  analysis: Analysis;

  @ApiPropertyOptional({ example: "Rate limit exceeded" })
  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage: string;

  @ApiProperty({ example: "2024-01-15T10:30:00.000Z" })
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ApiProperty({ example: "2024-01-15T10:30:00.000Z" })
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ApiPropertyOptional({ example: "2024-01-15T10:32:00.000Z" })
  @Column({ name: "completed_at", type: "timestamp", nullable: true })
  completedAt: Date;
}

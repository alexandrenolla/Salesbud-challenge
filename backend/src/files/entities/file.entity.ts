import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BatchJob } from "src/batch-uploads/entities/batch-job.entity";
import { FileStatus } from "../enums";

@Entity({ name: "files" })
export class File {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ example: "uploads/2024-01-15/abc123-meeting.txt" })
  @Index("idx_file_key")
  @Column({ name: "key", unique: true })
  key: string;

  @ApiProperty({ example: "meeting-transcript.txt" })
  @Column({ name: "original_filename" })
  originalFilename: string;

  @ApiProperty({ example: "text/plain" })
  @Column({ name: "mime_type" })
  mimeType: string;

  @ApiProperty({ example: 15420 })
  @Column({ name: "size", type: "int" })
  size: number;

  @ApiProperty({ example: "/api/v1/files/uploads/2024-01-15/abc123-meeting.txt" })
  @Column({ name: "url" })
  url: string;

  @ApiProperty({ enum: FileStatus, example: FileStatus.UPLOADED })
  @Column({ name: "status", type: "enum", enum: FileStatus, default: FileStatus.PENDING })
  status: FileStatus;

  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @Column({ name: "batch_job_id", type: "uuid", nullable: true })
  batchJobId: string;

  @ManyToOne(() => BatchJob, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "batch_job_id" })
  batchJob: BatchJob;

  @ApiProperty({ example: "2024-01-15T10:30:00.000Z" })
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ApiProperty({ example: "2024-01-15T10:30:00.000Z" })
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ValidateNested, IsString, IsNumber, IsEnum, IsArray, IsOptional, IsIn } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Outcome } from "../enums/outcome.enum";
import { ImpactLevel } from "../enums/impact-level.enum";

export class TranscriptInputDto {
  @IsString()
  @ApiProperty({ description: "Meeting transcript content" })
  content: string;

  @IsEnum(Outcome)
  @ApiProperty({ enum: Outcome, description: "Auto-detected meeting outcome" })
  outcome: Outcome;

  @IsString()
  @ApiProperty({ description: "Confidence level of outcome detection" })
  confidence: string;

  @IsString()
  @ApiProperty({ description: "Reason for outcome detection" })
  reason: string;
}

export class AnalysisSummaryDto {
  @IsNumber()
  @ApiProperty({ description: "Total meetings analyzed" })
  totalMeetings: number;

  @IsNumber()
  @ApiProperty({ description: "Won meetings count" })
  wonMeetings: number;

  @IsNumber()
  @ApiProperty({ description: "Lost meetings count" })
  lostMeetings: number;

  @IsString()
  @ApiProperty({ description: "Analysis date" })
  analysisDate: string;
}

export class EngagementMomentDto {
  @IsString()
  @ApiProperty({ description: "Quote excerpt" })
  quote: string;

  @IsString()
  @ApiProperty({ description: "Context" })
  context: string;

  @IsIn(["seller", "client"])
  @ApiProperty({ enum: ["seller", "client"], description: "Speaker turn" })
  speakerTurn: "seller" | "client";

  @IsEnum(ImpactLevel)
  @ApiProperty({ enum: ImpactLevel, description: "Impact level" })
  impactLevel: ImpactLevel;
}

export class EffectiveQuestionDto {
  @IsString()
  @ApiProperty({ description: "The question" })
  question: string;

  @IsString()
  @ApiProperty({ description: "Average response time" })
  avgResponseTime: string;

  @IsNumber()
  @ApiProperty({ description: "Success rate percentage" })
  successRate: number;

  @IsString()
  @ApiProperty({ description: "Suggested timing" })
  suggestedTiming: string;
}

export class ObjectionAnalysisDto {
  @IsString()
  @ApiProperty({ description: "The objection" })
  objection: string;

  @IsNumber()
  @ApiProperty({ description: "Frequency" })
  frequency: number;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String], description: "Successful responses" })
  successfulResponses: string[];

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String], description: "Unsuccessful responses" })
  unsuccessfulResponses: string[];

  @IsString()
  @ApiProperty({ description: "Recommended response" })
  recommendedResponse: string;
}

export class PlaybookSuggestionDto {
  @IsString()
  @ApiProperty({ description: "Section name" })
  section: string;

  @IsString()
  @ApiProperty({ description: "Content" })
  content: string;

  @IsString()
  @ApiProperty({ description: "Based on evidence" })
  basedOn: string;
}

@Entity({ name: "analyses" })
export class Analysis {
  @ApiProperty({ example: "uuid-here" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ example: "2024-06-01T12:00:00Z" })
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ApiProperty({ example: "2024-06-01T12:00:00Z" })
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ApiProperty({ description: "Analyzed transcripts", type: [TranscriptInputDto] })
  @Column({ type: "jsonb" })
  @ValidateNested({ each: true })
  @Type(() => TranscriptInputDto)
  transcripts: TranscriptInputDto[];

  @ApiProperty({ description: "Analysis summary", type: AnalysisSummaryDto })
  @Column({ type: "jsonb" })
  @ValidateNested()
  @Type(() => AnalysisSummaryDto)
  summary: AnalysisSummaryDto;

  @ApiProperty({ description: "Identified engagement moments", type: [EngagementMomentDto] })
  @Column({ type: "jsonb", name: "engagement_moments" })
  @ValidateNested({ each: true })
  @Type(() => EngagementMomentDto)
  engagementMoments: EngagementMomentDto[];   
  @ApiProperty({ description: "Identified effective questions", type: [EffectiveQuestionDto] })
  @Column({ type: "jsonb", name: "effective_questions" })
  @ValidateNested({ each: true })
  @Type(() => EffectiveQuestionDto)
  effectiveQuestions: EffectiveQuestionDto[];
  @ApiProperty({ description: "Objections and responses", type: [ObjectionAnalysisDto] })
  @Column({ type: "jsonb" })
  @ValidateNested({ each: true })
  @Type(() => ObjectionAnalysisDto)
  objections: ObjectionAnalysisDto[];
  @ApiProperty({ description: "Playbook suggestions", type: [PlaybookSuggestionDto] })
  @Column({ type: "jsonb", name: "playbook_suggestions" })
  @ValidateNested({ each: true })
  @Type(() => PlaybookSuggestionDto)
  playbookSuggestions: PlaybookSuggestionDto[];
}

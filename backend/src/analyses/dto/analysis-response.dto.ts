import { ApiProperty } from "@nestjs/swagger";
import {
  TranscriptInput,
  AnalysisSummary,
  EngagementMoment,
  EffectiveQuestion,
  ObjectionAnalysis,
  PlaybookSuggestion,
} from "../entities/analysis.entity";

export class AnalysisResponseDto {
  @ApiProperty({ example: "uuid-here" })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ description: "Analyzed transcripts" })
  transcripts: TranscriptInput[];

  @ApiProperty({ description: "Analysis summary" })
  summary: AnalysisSummary;

  @ApiProperty({ description: "Identified engagement moments" })
  engagementMoments: EngagementMoment[];

  @ApiProperty({ description: "Identified effective questions" })
  effectiveQuestions: EffectiveQuestion[];

  @ApiProperty({ description: "Objections and responses" })
  objections: ObjectionAnalysis[];

  @ApiProperty({ description: "Playbook suggestions" })
  playbookSuggestions: PlaybookSuggestion[];
}
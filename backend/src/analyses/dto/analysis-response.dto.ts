import { ApiProperty } from "@nestjs/swagger";
import {
  TranscriptInputDto,
  AnalysisSummaryDto,
  EngagementMomentDto,
  EffectiveQuestionDto,
  ObjectionAnalysisDto,
  PlaybookSuggestionDto,
} from "../entities/analysis.entity";

export class AnalysisResponseDto {
  @ApiProperty({ example: "uuid-here" })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ description: "Analyzed transcripts" })
  transcripts: TranscriptInputDto[];

  @ApiProperty({ description: "Analysis summary" })
  summary: AnalysisSummaryDto;

  @ApiProperty({ description: "Identified engagement moments" })
  engagementMoments: EngagementMomentDto[];

  @ApiProperty({ description: "Identified effective questions" })
  effectiveQuestions: EffectiveQuestionDto[];

  @ApiProperty({ description: "Objections and responses" })
  objections: ObjectionAnalysisDto[];

  @ApiProperty({ description: "Playbook suggestions" })
  playbookSuggestions: PlaybookSuggestionDto[];
}
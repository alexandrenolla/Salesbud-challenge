import { Injectable, Logger, UnprocessableEntityException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LlmService } from "src/llm/llm.service";
import { OutcomeDetectorService } from "src/outcome-detector/outcome-detector.service";
import {
  EXTRACTION_PROMPT,
  COMPARATIVE_ANALYSIS_PROMPT,
  PLAYBOOK_GENERATION_PROMPT,
  buildPrompt,
} from "src/prompts/playbook.prompts";
import { DEFAULT_LIMIT } from "src/utils/constants";
import { Outcome } from "./enums/outcome.enum";
import { ImpactLevel } from "./enums/impact-level.enum";
import {
  Analysis,
  TranscriptInput,
  EngagementMoment,
  EffectiveQuestion,
  ObjectionAnalysis,
  PlaybookSuggestion,
} from "./entities/analysis.entity";
import { CreateAnalysisDto } from "./dto/create-analysis.dto";
import { AnalysisResponseDto } from "./dto/analysis-response.dto";

// Result type for the analysis pipeline
type AnalysisResult = Omit<Analysis, "id" | "createdAt" | "updatedAt" | "transcripts">;

// Intermediate types for LLM responses
interface ExtractionResult {
  seller_questions: Array<{
    question: string;
    client_response_length: "curta" | "média" | "longa";
    generated_interest: boolean;
  }>;
  engagement_moments: Array<{
    quote: string;
    indicator: string;
  }>;
  objections: Array<{
    objection: string;
    seller_response: string;
    objection_resolved: boolean;
  }>;
  client_pain_points: string[];
  buying_signals: string[];
}

interface ComparativeResult {
  winning_patterns: Array<{
    pattern: string;
    frequency: number;
    evidence: string[];
  }>;
  losing_patterns: Array<{
    pattern: string;
    frequency: number;
    evidence: string[];
  }>;
  effective_questions: Array<{
    question: string;
    success_rate: number;
    why_it_works: string;
  }>;
  critical_objections: Array<{
    objection: string;
    successful_responses: string[];
    failed_responses: string[];
  }>;
  engagement_triggers: Array<{
    trigger: string;
    how_to_replicate: string;
  }>;
}

interface PlaybookContent {
  opening_script: {
    script: string;
    key_elements: string[];
    avoid: string[];
  };
  discovery_questions: Array<{
    question: string;
    purpose: string;
    expected_response: string;
    follow_up: string;
    timing: string;
  }>;
  objection_handling: Array<{
    objection: string;
    recommended_response: string;
    alternative_response: string;
    what_not_to_say: string;
    success_evidence: string;
  }>;
  engagement_tactics: Array<{
    tactic: string;
    when_to_use: string;
    example: string;
  }>;
  closing_checklist: Array<{
    item: string;
    why: string;
  }>;
  red_flags: Array<{
    flag: string;
    what_it_means: string;
    how_to_recover: string;
  }>;
}

@Injectable()
export class AnalysesService {
  private readonly logger = new Logger(AnalysesService.name);

  constructor(
    @InjectRepository(Analysis)
    private readonly analysisRepository: Repository<Analysis>,
    private readonly llmService: LlmService,
    private readonly outcomeDetectorService: OutcomeDetectorService,
  ) {}

  async create(dto: CreateAnalysisDto): Promise<AnalysisResponseDto> {
    this.logger.log(`Detecting outcomes for ${dto.transcripts.length} transcripts`);

    // Detect outcome for each transcript
    const transcriptPromises = dto.transcripts.map(async (t) => {
      const detection = await this.outcomeDetectorService.detectOutcome(t.content);
      return {
        content: t.content,
        outcome: detection.outcome,
        confidence: detection.confidence,
        reason: detection.reason,
      };
    });

    const transcripts: TranscriptInput[] = await Promise.all(transcriptPromises);

    this.logger.log(
      `Outcomes detected: ${transcripts.filter((t) => t.outcome === Outcome.WON).length} won, ${transcripts.filter((t) => t.outcome === Outcome.LOST).length} lost`,
    );

    const result = await this.analyzeTranscripts(transcripts);

    const analysis = this.analysisRepository.create({
      transcripts,
      summary: result.summary,
      engagementMoments: result.engagementMoments,
      effectiveQuestions: result.effectiveQuestions,
      objections: result.objections,
      playbookSuggestions: result.playbookSuggestions,
    });

    return this.analysisRepository.save(analysis);
  }

  async findAll(): Promise<AnalysisResponseDto[]> {
    return this.analysisRepository.find({
      order: { createdAt: "DESC" },
      take: DEFAULT_LIMIT,
    });
  }

  async findOneById(id: string): Promise<AnalysisResponseDto> {
    const analysis = await this.findEntityById(id);
    return analysis;
  }

  async delete(id: string): Promise<void> {
    const analysis = await this.findEntityById(id);
    await this.analysisRepository.remove(analysis);
  }

  private async findEntityById(id: string): Promise<Analysis> {
    const analysis = await this.analysisRepository.findOne({ where: { id } });
    if (!analysis) {
      throw new NotFoundException(`Analysis with ID ${id} not found`);
    }
    return analysis;
  }

  // 3-stage pipeline
  private async analyzeTranscripts(transcripts: TranscriptInput[]): Promise<AnalysisResult> {
    this.logger.log(`Starting analysis with ${transcripts.length} transcripts`);

    const wonTranscripts = transcripts.filter((t) => t.outcome === Outcome.WON);
    const lostTranscripts = transcripts.filter((t) => t.outcome === Outcome.LOST);

    this.logger.log(`Split: ${wonTranscripts.length} won, ${lostTranscripts.length} lost`);

    // Stage 1: Individual extraction
    this.logger.log("Stage 1: Extracting data from transcripts");
    const wonExtractions = await this.extractFromTranscripts(wonTranscripts);
    const lostExtractions = await this.extractFromTranscripts(lostTranscripts);

    if (wonExtractions.length === 0 && lostExtractions.length === 0) {
      throw new UnprocessableEntityException("Failed to extract data from any transcript");
    }

    // Stage 2: Comparative analysis
    this.logger.log("Stage 2: Comparing extractions");
    const comparativeAnalysis = await this.compareExtractions(wonExtractions, lostExtractions);

    // Stage 3: Playbook generation
    this.logger.log("Stage 3: Generating playbook content");
    const playbookContent = await this.generatePlaybookContent(comparativeAnalysis);

    // Format final result
    this.logger.log("Formatting final result");
    return this.formatResult(transcripts, comparativeAnalysis, playbookContent);
  }

  private async extractFromTranscripts(transcripts: TranscriptInput[]): Promise<ExtractionResult[]> {
    const extractionPromises = transcripts.map(async (transcript) => {
      const prompt = buildPrompt(EXTRACTION_PROMPT, {
        transcript: transcript.content,
        outcome: transcript.outcome,
      });

      return this.llmService.generateJSON<ExtractionResult>(prompt);
    });

    const results = await Promise.allSettled(extractionPromises);

    const extractions: ExtractionResult[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        extractions.push(result.value);
      } else {
        this.logger.warn(
          `Failed to extract from transcript ${index}: ${result.reason instanceof Error ? result.reason.message : "Unknown error"}`,
        );
      }
    });

    this.logger.log(
      `Extraction complete: ${extractions.length}/${transcripts.length} successful`,
    );

    return extractions;
  }

  private async compareExtractions(
    wonExtractions: ExtractionResult[],
    lostExtractions: ExtractionResult[],
  ): Promise<ComparativeResult> {
    const prompt = buildPrompt(COMPARATIVE_ANALYSIS_PROMPT, {
      won_extractions: JSON.stringify(wonExtractions, null, 2),
      lost_extractions: JSON.stringify(lostExtractions, null, 2),
    });

    return this.llmService.generateJSON<ComparativeResult>(prompt);
  }

  private async generatePlaybookContent(
    comparativeAnalysis: ComparativeResult,
  ): Promise<PlaybookContent> {
    const prompt = buildPrompt(PLAYBOOK_GENERATION_PROMPT, {
      comparative_analysis: JSON.stringify(comparativeAnalysis, null, 2),
    });

    return this.llmService.generateJSON<PlaybookContent>(prompt);
  }

  private formatResult(
    transcripts: TranscriptInput[],
    comparativeAnalysis: ComparativeResult,
    playbookContent: PlaybookContent,
  ): AnalysisResult {
    const wonCount = transcripts.filter((t) => t.outcome === Outcome.WON).length;
    const lostCount = transcripts.filter((t) => t.outcome === Outcome.LOST).length;

    // Map engagement moments from comparative analysis
    const engagementMoments: EngagementMoment[] = comparativeAnalysis.engagement_triggers.map(
      (trigger) => ({
        quote: trigger.trigger,
        context: trigger.how_to_replicate,
        speakerTurn: "seller" as const,
        impactLevel: ImpactLevel.HIGH,
      }),
    );

    // Map effective questions
    const effectiveQuestions: EffectiveQuestion[] = comparativeAnalysis.effective_questions.map(
      (eq) => ({
        question: eq.question,
        avgResponseTime: "N/A",
        successRate: eq.success_rate,
        suggestedTiming:
          playbookContent.discovery_questions.find((dq) => dq.question === eq.question)?.timing ||
          "Durante discovery",
      }),
    );

    // Map objections
    const objections: ObjectionAnalysis[] = comparativeAnalysis.critical_objections.map((co) => {
      const handling = playbookContent.objection_handling.find(
        (oh) => oh.objection === co.objection,
      );
      return {
        objection: co.objection,
        frequency: 1,
        successfulResponses: co.successful_responses,
        unsuccessfulResponses: co.failed_responses,
        recommendedResponse: handling?.recommended_response || co.successful_responses[0] || "",
      };
    });

    // Map playbook suggestions from multiple sources
    const playbookSuggestions: PlaybookSuggestion[] = [
      {
        section: "Abertura",
        content: playbookContent.opening_script.script,
        basedOn: `Key elements: ${playbookContent.opening_script.key_elements.join(", ")}`,
      },
      ...playbookContent.discovery_questions.map((dq) => ({
        section: "Discovery",
        content: `${dq.question} - ${dq.purpose}`,
        basedOn: `Timing: ${dq.timing}, Follow-up: ${dq.follow_up}`,
      })),
      ...playbookContent.engagement_tactics.map((et) => ({
        section: "Engajamento",
        content: et.tactic,
        basedOn: `Quando usar: ${et.when_to_use}. Exemplo: ${et.example}`,
      })),
      ...playbookContent.closing_checklist.map((cc) => ({
        section: "Fechamento",
        content: cc.item,
        basedOn: cc.why,
      })),
      ...playbookContent.red_flags.map((rf) => ({
        section: "Alertas",
        content: `${rf.flag}: ${rf.what_it_means}`,
        basedOn: `Como recuperar: ${rf.how_to_recover}`,
      })),
    ];

    return {
      summary: {
        totalMeetings: transcripts.length,
        wonMeetings: wonCount,
        lostMeetings: lostCount,
        analysisDate: new Date().toISOString(),
      },
      engagementMoments,
      effectiveQuestions,
      objections,
      playbookSuggestions,
    };
  }
}

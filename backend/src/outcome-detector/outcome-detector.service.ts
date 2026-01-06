import { Injectable, Logger } from "@nestjs/common";
import { Outcome } from "src/analyses/enums/outcome.enum";
import { Confidence } from "./enums/confidence.enum";
import { OUTCOME_DETECTION_CHAR_LIMIT } from "src/utils/constants";
import { OUTCOME_DETECTION_PROMPT } from "src/prompts/outcome-detection.prompts";
import { LlmService } from "src/llm/llm.service";

export interface OutcomeResult {
  outcome: Outcome;
  confidence: Confidence;
  reason: string;
}

@Injectable()
export class OutcomeDetectorService {
  private readonly logger = new Logger(OutcomeDetectorService.name);

  constructor(private readonly llmService: LlmService) {}

  async detectOutcome(transcript: string): Promise<OutcomeResult> {
    const prompt = OUTCOME_DETECTION_PROMPT.replace(
      "{transcript}",
      transcript.substring(0, OUTCOME_DETECTION_CHAR_LIMIT),
    );
    const result = await this.llmService.generateJSON<OutcomeResult>(prompt);

    this.logger.log(
      `Outcome detected: ${result.outcome} (${result.confidence})`,
    );

    return result;
  }
}

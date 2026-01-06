// ═══════════════════════════════════════════
// ENUMS (Shared across features)
// ═══════════════════════════════════════════

export enum Outcome {
  WON = "won",
  LOST = "lost",
}

export enum Confidence {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum ImpactLevel {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

// ═══════════════════════════════════════════
// CONSTANTS (Consider moving to constants/)
// ═══════════════════════════════════════════

export const MIN_TRANSCRIPT_LENGTH = 100;
export const MIN_TRANSCRIPTS_COUNT = 2;
export const MAX_TRANSCRIPTS_COUNT = 20;
export const OUTCOME_DETECTION_CHAR_LIMIT = 4000;

// ═══════════════════════════════════════════
// API INPUT/OUTPUT (Shared contract with backend)
// ═══════════════════════════════════════════

export interface TranscriptInput {
  content: string;
}

export interface TranscriptWithOutcome {
  content: string;
  outcome: Outcome;
  confidence: string;
  reason: string;
}

export interface UploadResult {
  content: string;
  filename: string;
  detectedOutcome: Outcome;
  confidence: Confidence;
  reason: string;
}

// ═══════════════════════════════════════════
// ANALYSIS DOMAIN (Used by AnalysisResults)
// ═══════════════════════════════════════════

export interface EngagementMoment {
  quote: string;
  context: string;
  speakerTurn: "seller" | "client";
  impactLevel: ImpactLevel;
}

export interface EffectiveQuestion {
  question: string;
  avgResponseTime: string;
  successRate: number;
  suggestedTiming: string;
}

export interface ObjectionAnalysis {
  objection: string;
  frequency: number;
  successfulResponses: string[];
  unsuccessfulResponses: string[];
  recommendedResponse: string;
}

export interface PlaybookSuggestion {
  section: string;
  content: string;
  basedOn: string;
}

export interface AnalysisSummary {
  totalMeetings: number;
  wonMeetings: number;
  lostMeetings: number;
  analysisDate: string;
}

export interface AnalysisResult {
  summary: AnalysisSummary;
  engagementMoments: EngagementMoment[];
  effectiveQuestions: EffectiveQuestion[];
  objections: ObjectionAnalysis[];
  playbookSuggestions: PlaybookSuggestion[];
}

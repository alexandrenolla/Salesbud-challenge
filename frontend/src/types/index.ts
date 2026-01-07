// ═══════════════════════════════════════════
// API INPUT/OUTPUT (Shared contract with backend)
// ═══════════════════════════════════════════

export interface TranscriptInput {
  content: string;
}

// ═══════════════════════════════════════════
// ANALYSIS DOMAIN (Used by AnalysisResults)
// ═══════════════════════════════════════════

export interface EngagementMoment {
  quote: string;
  context: string;
  impactLevel: "high" | "medium" | "low";
}

export interface EffectiveQuestion {
  question: string;
  successRate: number | string;
  suggestedTiming: string;
}

export interface ObjectionAnalysis {
  objection: string;
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

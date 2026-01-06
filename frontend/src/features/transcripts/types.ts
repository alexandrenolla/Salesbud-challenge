// Internal state type (not part of API contract)
export interface TranscriptDraft {
  id: string;
  content: string;
  filename?: string;
}

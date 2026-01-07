// Validation constants
export const MIN_TRANSCRIPT_LENGTH = 100;
export const MIN_TRANSCRIPTS_COUNT = 2;
export const MAX_TRANSCRIPTS_COUNT = 20;
export const OUTCOME_DETECTION_CHAR_LIMIT = 4000;

// File upload constants - Text
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MIN_FILE_CONTENT_LENGTH = 100;
export const ALLOWED_FILE_EXTENSIONS = [".txt"];

// File upload constants - Audio
export const MAX_AUDIO_FILE_SIZE = 25 * 1024 * 1024; // 25MB
export const ALLOWED_AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a"];
export const ALL_ALLOWED_EXTENSIONS = [
  ...ALLOWED_FILE_EXTENSIONS,
  ...ALLOWED_AUDIO_EXTENSIONS,
];

// LLM defaults
export const DEFAULT_LLM_MODEL = "llama-3.3-70b-versatile";
export const DEFAULT_LLM_TEMPERATURE = 0.7;
export const DEFAULT_LLM_MAX_TOKENS = 4096;

// Pagination defaults
export const DEFAULT_PAGE = 0;
export const DEFAULT_LIMIT = 50;

// API Version
export const DEFAULT_VERSION = "1";

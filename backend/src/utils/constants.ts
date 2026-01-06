// Validation constants
export const MIN_TRANSCRIPT_LENGTH = 100;
export const MIN_TRANSCRIPTS_COUNT = 2;
export const MAX_TRANSCRIPTS_COUNT = 20;
export const OUTCOME_DETECTION_CHAR_LIMIT = 4000;

// File upload constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MIN_FILE_CONTENT_LENGTH = 100;
export const ALLOWED_FILE_EXTENSIONS = [".txt"];

// LLM defaults
export const DEFAULT_LLM_MODEL = "llama-3.3-70b-versatile";
export const DEFAULT_LLM_TEMPERATURE = 0.7;
export const DEFAULT_LLM_MAX_TOKENS = 4096;

// Pagination defaults
export const DEFAULT_PAGE = 0;
export const DEFAULT_LIMIT = 50;

// API Version
export const DEFAULT_VERSION = "1";

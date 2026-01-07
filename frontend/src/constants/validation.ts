/**
 * Validation constants for transcript analysis
 */
export const VALIDATION = {
  /** Minimum character count for a valid transcript */
  MIN_TRANSCRIPT_LENGTH: 100,

  /** Minimum number of transcripts required for analysis */
  MIN_TRANSCRIPTS_COUNT: 2,

  /** Maximum number of transcripts allowed per analysis */
  MAX_TRANSCRIPTS_COUNT: 20,

  /** Maximum suggestions shown per playbook section */
  MAX_PLAYBOOK_SUGGESTIONS_PER_SECTION: 3,

  /** Maximum unsuccessful responses to show for objections */
  MAX_UNSUCCESSFUL_RESPONSES: 2,
} as const;

/**
 * Toast message defaults
 */
export const TOAST = {
  /** Default duration for toast messages in milliseconds */
  DEFAULT_DURATION: 5000,
} as const;

/**
 * File upload constraints
 */
export const FILE_UPLOAD = {
  /** Allowed text file extensions */
  TEXT_EXTENSIONS: [".txt"] as const,

  /** Allowed audio file extensions */
  AUDIO_EXTENSIONS: [".mp3", ".wav", ".m4a"] as const,

  /** All allowed file extensions */
  ALLOWED_EXTENSIONS: [".txt", ".mp3", ".wav", ".m4a"] as const,

  /** Maximum text file size in bytes (5MB) */
  MAX_TEXT_SIZE_BYTES: 5 * 1024 * 1024,

  /** Maximum audio file size in bytes (25MB) */
  MAX_AUDIO_SIZE_BYTES: 25 * 1024 * 1024,

  /** @deprecated Use MAX_TEXT_SIZE_BYTES instead */
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
} as const;

/**
 * Validation constants for transcript analysis
 */
export const VALIDATION = {
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
 * File upload constraints
 */
export const FILE_UPLOAD = {
  /** Allowed audio file extensions */
  AUDIO_EXTENSIONS: [".mp3", ".wav", ".m4a"] as const,

  /** All allowed file extensions */
  ALLOWED_EXTENSIONS: [".txt", ".mp3", ".wav", ".m4a"] as const,

  /** Maximum text file size in bytes (5MB) */
  MAX_TEXT_SIZE_BYTES: 5 * 1024 * 1024,

  /** Maximum audio file size in bytes (25MB) */
  MAX_AUDIO_SIZE_BYTES: 25 * 1024 * 1024,
} as const;

/**
 * SSE (Server-Sent Events) constants
 */
export const SSE = {
  /** Maximum number of reconnection attempts before giving up */
  MAX_RECONNECT_ATTEMPTS: 3,

  /** Base delay in ms for exponential backoff reconnection */
  RECONNECT_BASE_DELAY_MS: 1000,
} as const;

/**
 * Toast notification constants
 */
export const TOAST = {
  /** Default duration in ms before auto-dismiss */
  DEFAULT_DURATION_MS: 5000,

  /** Exit animation duration in ms */
  EXIT_ANIMATION_MS: 200,
} as const;

/**
 * Error messages
 */
export const MESSAGES = {
  /** SSE connection lost error */
  CONNECTION_LOST: "Conexão perdida. Por favor, recarregue a página.",

  /** Minimum files required for batch upload */
  MIN_FILES_REQUIRED: "Mínimo de 2 arquivos necessários para análise comparativa",
} as const;

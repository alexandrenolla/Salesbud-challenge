import { FILE_UPLOAD } from "@/constants/validation";

/**
 * Extracts file extension in lowercase
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().slice(filename.lastIndexOf("."));
}

/**
 * Checks if file is an audio file based on extension
 */
export function isAudioFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return FILE_UPLOAD.AUDIO_EXTENSIONS.includes(
    ext as (typeof FILE_UPLOAD.AUDIO_EXTENSIONS)[number],
  );
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Safely extracts error message from unknown error type
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = "An error occurred",
): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return defaultMessage;
}

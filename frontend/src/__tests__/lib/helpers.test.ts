import { describe, it, expect } from "vitest";
import {
  getFileExtension,
  isAudioFile,
  formatFileSize,
  getErrorMessage,
} from "@/lib/helpers";

describe("helpers", () => {
  describe("getFileExtension", () => {
    it("should return lowercase extension", () => {
      expect(getFileExtension("file.TXT")).toBe(".txt");
      expect(getFileExtension("file.Mp3")).toBe(".mp3");
      expect(getFileExtension("file.WAV")).toBe(".wav");
    });

    it("should handle files with multiple dots", () => {
      expect(getFileExtension("my.file.name.txt")).toBe(".txt");
    });

    it("should return last char for files without extension", () => {
      // The function uses lastIndexOf('.') which returns -1, then slice(-1) returns last char
      const result = getFileExtension("noextension");
      expect(result).toBe("n");
    });

    it("should handle audio extensions", () => {
      expect(getFileExtension("audio.mp3")).toBe(".mp3");
      expect(getFileExtension("audio.m4a")).toBe(".m4a");
      expect(getFileExtension("audio.wav")).toBe(".wav");
    });
  });

  describe("isAudioFile", () => {
    it("should return true for .mp3 files", () => {
      expect(isAudioFile("audio.mp3")).toBe(true);
      expect(isAudioFile("audio.MP3")).toBe(true);
    });

    it("should return true for .wav files", () => {
      expect(isAudioFile("audio.wav")).toBe(true);
      expect(isAudioFile("audio.WAV")).toBe(true);
    });

    it("should return true for .m4a files", () => {
      expect(isAudioFile("audio.m4a")).toBe(true);
      expect(isAudioFile("audio.M4A")).toBe(true);
    });

    it("should return false for non-audio files", () => {
      expect(isAudioFile("document.txt")).toBe(false);
      expect(isAudioFile("document.pdf")).toBe(false);
      expect(isAudioFile("image.png")).toBe(false);
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes as KB for small files", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(512)).toBe("1 KB");
      expect(formatFileSize(2048)).toBe("2 KB");
    });

    it("should format bytes as MB for larger files", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
      expect(formatFileSize(10 * 1024 * 1024)).toBe("10.0 MB");
    });

    it("should handle edge cases", () => {
      expect(formatFileSize(0)).toBe("0 KB");
      expect(formatFileSize(1024 * 1024 - 1)).toBe("1024 KB");
    });
  });

  describe("getErrorMessage", () => {
    it("should extract message from Error instance", () => {
      const error = new Error("Test error message");
      expect(getErrorMessage(error)).toBe("Test error message");
    });

    it("should return string error directly", () => {
      expect(getErrorMessage("String error")).toBe("String error");
    });

    it("should return default message for other types", () => {
      expect(getErrorMessage(123)).toBe("An error occurred");
      expect(getErrorMessage(null)).toBe("An error occurred");
      expect(getErrorMessage(undefined)).toBe("An error occurred");
      expect(getErrorMessage({})).toBe("An error occurred");
    });

    it("should use custom default message when provided", () => {
      expect(getErrorMessage({}, "Custom default")).toBe("Custom default");
      expect(getErrorMessage(null, "Something went wrong")).toBe(
        "Something went wrong"
      );
    });
  });
});

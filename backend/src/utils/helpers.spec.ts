import { NotFoundException, Logger } from "@nestjs/common";
import { Repository } from "typeorm";
import {
  extractErrorMessage,
  sleep,
  retryWithBackoff,
  getFileExtension,
  isAudioFile,
  partitionByOutcome,
  findByIdOrThrow,
  buildPrompt,
} from "./helpers";
import { Outcome } from "src/analyses/enums/outcome.enum";

describe("helpers", () => {
  describe("extractErrorMessage", () => {
    it("should extract message from Error instance", () => {
      const error = new Error("Test error message");
      expect(extractErrorMessage(error)).toBe("Test error message");
    });

    it("should return 'Unknown error' for non-Error values", () => {
      expect(extractErrorMessage("string error")).toBe("Unknown error");
      expect(extractErrorMessage(123)).toBe("Unknown error");
      expect(extractErrorMessage(null)).toBe("Unknown error");
      expect(extractErrorMessage(undefined)).toBe("Unknown error");
      expect(extractErrorMessage({})).toBe("Unknown error");
    });
  });

  describe("sleep", () => {
    it("should resolve after specified milliseconds", async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe("retryWithBackoff", () => {
    it("should return result on successful first attempt", async () => {
      const operation = jest.fn().mockResolvedValue("success");

      const result = await retryWithBackoff(operation);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and eventually succeed", async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValue("success");

      const result = await retryWithBackoff(operation, {
        maxAttempts: 3,
        baseDelayMs: 10,
      });

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should throw after max attempts exhausted", async () => {
      const operation = jest.fn().mockRejectedValue(new Error("Always fails"));

      await expect(
        retryWithBackoff(operation, { maxAttempts: 2, baseDelayMs: 10 }),
      ).rejects.toThrow("Always fails");

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should log warnings on retry when logger provided", async () => {
      const mockLogger = { warn: jest.fn() } as unknown as Logger;
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Failure"))
        .mockResolvedValue("success");

      await retryWithBackoff(operation, {
        maxAttempts: 3,
        baseDelayMs: 10,
        logger: mockLogger,
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Attempt 1 failed"),
      );
    });

    it("should use default values when options not provided", async () => {
      const operation = jest.fn().mockResolvedValue("result");

      const result = await retryWithBackoff(operation);

      expect(result).toBe("result");
    });
  });

  describe("getFileExtension", () => {
    it("should return lowercase extension", () => {
      expect(getFileExtension("file.TXT")).toBe(".txt");
      expect(getFileExtension("file.Mp3")).toBe(".mp3");
      expect(getFileExtension("file.WAV")).toBe(".wav");
    });

    it("should handle files with multiple dots", () => {
      expect(getFileExtension("my.file.name.txt")).toBe(".txt");
    });

    it("should return empty string for files without extension", () => {
      expect(getFileExtension("noextension")).toBe("");
    });
  });

  describe("isAudioFile", () => {
    it("should return true for audio extensions", () => {
      expect(isAudioFile("audio.mp3")).toBe(true);
      expect(isAudioFile("audio.wav")).toBe(true);
      expect(isAudioFile("audio.m4a")).toBe(true);
    });

    it("should return false for non-audio extensions", () => {
      expect(isAudioFile("document.txt")).toBe(false);
      expect(isAudioFile("document.pdf")).toBe(false);
    });

    it("should be case insensitive", () => {
      expect(isAudioFile("audio.MP3")).toBe(true);
      expect(isAudioFile("audio.WAV")).toBe(true);
    });
  });

  describe("partitionByOutcome", () => {
    it("should partition items by won and lost outcomes", () => {
      const items = [
        { outcome: Outcome.WON, id: 1 },
        { outcome: Outcome.LOST, id: 2 },
        { outcome: Outcome.WON, id: 3 },
        { outcome: Outcome.LOST, id: 4 },
      ];

      const result = partitionByOutcome(items);

      expect(result.won).toHaveLength(2);
      expect(result.lost).toHaveLength(2);
      expect(result.won.map((i) => i.id)).toEqual([1, 3]);
      expect(result.lost.map((i) => i.id)).toEqual([2, 4]);
    });

    it("should handle empty array", () => {
      const result = partitionByOutcome([]);

      expect(result.won).toEqual([]);
      expect(result.lost).toEqual([]);
    });

    it("should handle array with only won items", () => {
      const items = [
        { outcome: Outcome.WON, id: 1 },
        { outcome: Outcome.WON, id: 2 },
      ];

      const result = partitionByOutcome(items);

      expect(result.won).toHaveLength(2);
      expect(result.lost).toHaveLength(0);
    });
  });

  describe("findByIdOrThrow", () => {
    it("should return entity when found", async () => {
      const mockEntity = { id: "123", name: "Test" };
      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(mockEntity),
      } as unknown as Repository<typeof mockEntity>;

      const result = await findByIdOrThrow(mockRepository, "123", "Entity");

      expect(result).toEqual(mockEntity);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "123" },
      });
    });

    it("should throw NotFoundException when entity not found", async () => {
      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      } as unknown as Repository<{ id: string }>;

      await expect(
        findByIdOrThrow(mockRepository, "123", "Analysis"),
      ).rejects.toThrow(NotFoundException);
      await expect(
        findByIdOrThrow(mockRepository, "123", "Analysis"),
      ).rejects.toThrow("Analysis with ID 123 not found");
    });
  });

  describe("buildPrompt", () => {
    it("should replace single variable", () => {
      const template = "Hello {name}!";
      const result = buildPrompt(template, { name: "World" });

      expect(result).toBe("Hello World!");
    });

    it("should replace multiple variables", () => {
      const template = "{greeting} {name}, today is {day}";
      const result = buildPrompt(template, {
        greeting: "Hello",
        name: "John",
        day: "Monday",
      });

      expect(result).toBe("Hello John, today is Monday");
    });

    it("should replace multiple occurrences of same variable", () => {
      const template = "{name} likes {name}";
      const result = buildPrompt(template, { name: "Alice" });

      expect(result).toBe("Alice likes Alice");
    });

    it("should leave unmatched placeholders", () => {
      const template = "Hello {name}, your {missing} is ready";
      const result = buildPrompt(template, { name: "John" });

      expect(result).toBe("Hello John, your {missing} is ready");
    });
  });
});

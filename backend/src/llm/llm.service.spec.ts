import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import {
  ServiceUnavailableException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { LlmService } from "./llm.service";

// Mock external dependencies
jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  })),
}));

jest.mock("assemblyai", () => ({
  AssemblyAI: jest.fn().mockImplementation(() => ({
    transcripts: {
      transcribe: jest.fn(),
    },
  })),
}));

jest.mock("fs", () => ({
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  unlinkSync: jest.fn(),
}));

describe("LlmService", () => {
  let service: LlmService;
  let mockAnthropicCreate: jest.Mock;
  let mockAssemblyTranscribe: jest.Mock;

  beforeEach(async () => {
    // Set required environment variables
    process.env.ANTHROPIC_API_KEY = "test-api-key";
    process.env.ASSEMBLYAI_API_KEY = "test-assemblyai-key";

    // Reset mocks
    const Anthropic = jest.requireMock("@anthropic-ai/sdk").default;
    mockAnthropicCreate = jest.fn();
    Anthropic.mockImplementation(() => ({
      messages: {
        create: mockAnthropicCreate,
      },
    }));

    const { AssemblyAI } = jest.requireMock("assemblyai");
    mockAssemblyTranscribe = jest.fn();
    AssemblyAI.mockImplementation(() => ({
      transcripts: {
        transcribe: mockAssemblyTranscribe,
      },
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ASSEMBLYAI_API_KEY;
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should throw ServiceUnavailableException when ANTHROPIC_API_KEY is not set", async () => {
      delete process.env.ANTHROPIC_API_KEY;

      await expect(
        Test.createTestingModule({
          providers: [
            LlmService,
            { provide: ConfigService, useValue: { get: jest.fn() } },
          ],
        }).compile(),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe("generateContent", () => {
    it("should return text content from LLM response", async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: "text", text: "Generated content" }],
      });

      const result = await service.generateContent("Test prompt");

      expect(result).toBe("Generated content");
      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: "user", content: "Test prompt" }],
        }),
      );
    });

    it("should return empty string when no text block in response", async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: "image", data: "..." }],
      });

      const result = await service.generateContent("Test prompt");

      expect(result).toBe("");
    });

    it("should throw HttpException with 429 status on rate limit", async () => {
      mockAnthropicCreate.mockRejectedValue({ status: 429 });

      await expect(service.generateContent("Test prompt")).rejects.toThrow(
        HttpException,
      );

      try {
        await service.generateContent("Test prompt");
      } catch (error) {
        expect((error as HttpException).getStatus()).toBe(
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    });

    it("should throw UnauthorizedException on 401 status", async () => {
      mockAnthropicCreate.mockRejectedValue({ status: 401 });

      await expect(service.generateContent("Test prompt")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw ServiceUnavailableException on other errors", async () => {
      mockAnthropicCreate.mockRejectedValue(new Error("Unknown error"));

      await expect(service.generateContent("Test prompt")).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe("generateJSON", () => {
    it("should parse JSON from LLM response", async () => {
      const jsonData = { key: "value", number: 42 };
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(jsonData) }],
      });

      const result = await service.generateJSON<typeof jsonData>("Test prompt");

      expect(result).toEqual(jsonData);
    });

    it("should extract JSON from markdown code blocks", async () => {
      const jsonData = { key: "value" };
      mockAnthropicCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: `Here is the response:\n\`\`\`json\n${JSON.stringify(jsonData)}\n\`\`\``,
          },
        ],
      });

      const result = await service.generateJSON<typeof jsonData>("Test prompt");

      expect(result).toEqual(jsonData);
    });

    it("should throw HttpException on invalid JSON", async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: "text", text: "not valid json" }],
      });

      await expect(service.generateJSON("Test prompt")).rejects.toThrow(
        HttpException,
      );

      try {
        await service.generateJSON("Test prompt");
      } catch (error) {
        expect((error as HttpException).getStatus()).toBe(
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    });
  });

  describe("transcribeAudio", () => {
    it("should transcribe audio successfully", async () => {
      mockAssemblyTranscribe.mockResolvedValue({
        status: "completed",
        text: "Transcribed text",
        utterances: [
          { speaker: "A", text: "Hello" },
          { speaker: "B", text: "Hi there" },
        ],
      });

      const buffer = Buffer.from("audio data");
      const result = await service.transcribeAudio(buffer, "test.mp3");

      expect(result.text).toContain("Speaker A: Hello");
      expect(result.text).toContain("Speaker B: Hi there");
    });

    it("should throw ServiceUnavailableException on transcription error", async () => {
      mockAssemblyTranscribe.mockResolvedValue({
        status: "error",
        error: "Transcription failed",
      });

      const buffer = Buffer.from("audio data");

      await expect(
        service.transcribeAudio(buffer, "test.mp3"),
      ).rejects.toThrow();
    });

    it("should handle empty utterances", async () => {
      mockAssemblyTranscribe.mockResolvedValue({
        status: "completed",
        utterances: [],
      });

      const buffer = Buffer.from("audio data");
      const result = await service.transcribeAudio(buffer, "test.mp3");

      expect(result.text).toBe("");
    });

    it("should handle null utterances", async () => {
      mockAssemblyTranscribe.mockResolvedValue({
        status: "completed",
        utterances: null,
      });

      const buffer = Buffer.from("audio data");
      const result = await service.transcribeAudio(buffer, "test.mp3");

      expect(result.text).toBe("");
    });
  });
});

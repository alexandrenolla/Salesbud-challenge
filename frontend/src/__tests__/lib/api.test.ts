import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { Outcome, Confidence } from "@/types";

// Mock axios
vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      interceptors: {
        response: {
          use: vi.fn(),
        },
      },
    })),
  },
}));

describe("API Service", () => {
  let mockAxiosInstance: {
    post: ReturnType<typeof vi.fn>;
    interceptors: { response: { use: ReturnType<typeof vi.fn> } };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAxiosInstance = {
      post: vi.fn(),
      interceptors: {
        response: {
          use: vi.fn(),
        },
      },
    };
    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as never);
  });

  describe("createAnalysis", () => {
    const mockTranscripts = [
      { content: "a".repeat(100), outcome: Outcome.WON },
      { content: "b".repeat(100), outcome: Outcome.LOST },
    ];

    const mockResponse = {
      data: {
        summary: { totalMeetings: 2, wonMeetings: 1, lostMeetings: 1, analysisDate: "2024-01-15" },
        engagementMoments: [],
        effectiveQuestions: [],
        objections: [],
        playbookSuggestions: [],
      },
    };

    it("sends POST request to /analyses", async () => {
      vi.resetModules();
      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      vi.mocked(axios.create).mockReturnValue({
        post: mockPost,
        interceptors: { response: { use: vi.fn() } },
      } as never);

      const { createAnalysis } = await import("@/lib/api");
      await createAnalysis(mockTranscripts);

      expect(mockPost).toHaveBeenCalledWith("/analyses", { transcripts: mockTranscripts });
    });

    it("returns data directly from response", async () => {
      vi.resetModules();
      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      vi.mocked(axios.create).mockReturnValue({
        post: mockPost,
        interceptors: { response: { use: vi.fn() } },
      } as never);

      const { createAnalysis } = await import("@/lib/api");
      const result = await createAnalysis(mockTranscripts);

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("uploadTranscript", () => {
    const mockFile = new File(["test content"], "test.txt", { type: "text/plain" });

    const mockUploadResponse = {
      data: {
        content: "test content",
        filename: "test.txt",
        detectedOutcome: Outcome.WON,
        confidence: Confidence.HIGH,
        reason: "Client showed interest",
      },
    };

    it("sends POST request with FormData to /uploads", async () => {
      vi.resetModules();
      const mockPost = vi.fn().mockResolvedValue(mockUploadResponse);
      vi.mocked(axios.create).mockReturnValue({
        post: mockPost,
        interceptors: { response: { use: vi.fn() } },
      } as never);

      const { uploadTranscript } = await import("@/lib/api");
      await uploadTranscript(mockFile);

      expect(mockPost).toHaveBeenCalledWith("/uploads", expect.any(FormData), {
        headers: { "Content-Type": "multipart/form-data" },
      });
    });

    it("returns data directly from response", async () => {
      vi.resetModules();
      const mockPost = vi.fn().mockResolvedValue(mockUploadResponse);
      vi.mocked(axios.create).mockReturnValue({
        post: mockPost,
        interceptors: { response: { use: vi.fn() } },
      } as never);

      const { uploadTranscript } = await import("@/lib/api");
      const result = await uploadTranscript(mockFile);

      expect(result).toEqual(mockUploadResponse.data);
    });
  });
});

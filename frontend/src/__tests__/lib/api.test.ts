import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

// Mock axios
vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
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
    get: ReturnType<typeof vi.fn>;
    interceptors: { response: { use: ReturnType<typeof vi.fn> } };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAxiosInstance = {
      post: vi.fn(),
      get: vi.fn(),
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
      { content: "a".repeat(100) },
      { content: "b".repeat(100) },
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
        get: vi.fn(),
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
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } },
      } as never);

      const { createAnalysis } = await import("@/lib/api");
      const result = await createAnalysis(mockTranscripts);

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("createBatchUpload", () => {
    const mockFiles = [
      new File(["content 1"], "file1.txt", { type: "text/plain" }),
      new File(["content 2"], "file2.txt", { type: "text/plain" }),
    ];

    const mockResponse = {
      data: {
        jobId: "test-job-id",
        status: "pending",
        totalFiles: 2,
      },
    };

    it("sends POST request with FormData to /batch-upload", async () => {
      vi.resetModules();
      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      vi.mocked(axios.create).mockReturnValue({
        post: mockPost,
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } },
      } as never);

      const { createBatchUpload } = await import("@/lib/api");
      await createBatchUpload(mockFiles);

      expect(mockPost).toHaveBeenCalledWith("/batch-uploads", expect.any(FormData), {
        headers: { "Content-Type": "multipart/form-data" },
      });
    });

    it("returns data directly from response", async () => {
      vi.resetModules();
      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      vi.mocked(axios.create).mockReturnValue({
        post: mockPost,
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } },
      } as never);

      const { createBatchUpload } = await import("@/lib/api");
      const result = await createBatchUpload(mockFiles);

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getBatchUploadEventsUrl", () => {
    it("returns correct SSE URL", async () => {
      vi.resetModules();
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn(),
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } },
      } as never);

      const { getBatchUploadEventsUrl } = await import("@/lib/api");
      const url = getBatchUploadEventsUrl("test-job-id");

      expect(url).toContain("/batch-uploads/test-job-id/events");
    });
  });
});

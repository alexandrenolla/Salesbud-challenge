import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnalysis } from "@/features/analysis";
import * as api from "@/lib/api";

// Mock the API module
vi.mock("@/lib/api", () => ({
  createAnalysis: vi.fn(),
}));

const mockAnalysisResult = {
  summary: {
    totalMeetings: 2,
    wonMeetings: 1,
    lostMeetings: 1,
    analysisDate: "2024-01-15",
  },
  engagementMoments: [],
  effectiveQuestions: [],
  objections: [],
  playbookSuggestions: [],
};

const mockTranscripts = [
  { content: "a".repeat(100) },
  { content: "b".repeat(100) },
];

describe("useAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has correct initial state", () => {
    const { result } = renderHook(() => useAnalysis());

    expect(result.current.result).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.analyze).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });

  it("sets loading to true when analyze is called", async () => {
    vi.mocked(api.createAnalysis).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockAnalysisResult), 100))
    );

    const { result } = renderHook(() => useAnalysis());

    act(() => {
      result.current.analyze(mockTranscripts);
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("sets result when analyze succeeds", async () => {
    vi.mocked(api.createAnalysis).mockResolvedValue(mockAnalysisResult);

    const { result } = renderHook(() => useAnalysis());

    await act(async () => {
      await result.current.analyze(mockTranscripts);
    });

    expect(result.current.result).toEqual(mockAnalysisResult);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error when analyze fails", async () => {
    vi.mocked(api.createAnalysis).mockRejectedValue(new Error("API Error"));

    const { result } = renderHook(() => useAnalysis());

    await act(async () => {
      await result.current.analyze(mockTranscripts);
    });

    expect(result.current.result).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("API Error");
  });

  it("calls createAnalysis with correct data", async () => {
    vi.mocked(api.createAnalysis).mockResolvedValue(mockAnalysisResult);

    const { result } = renderHook(() => useAnalysis());

    await act(async () => {
      await result.current.analyze(mockTranscripts);
    });

    expect(api.createAnalysis).toHaveBeenCalledWith(mockTranscripts);
  });

  it("resets state correctly", async () => {
    vi.mocked(api.createAnalysis).mockResolvedValue(mockAnalysisResult);

    const { result } = renderHook(() => useAnalysis());

    // First, get a result
    await act(async () => {
      await result.current.analyze(mockTranscripts);
    });

    expect(result.current.result).not.toBeNull();

    // Then reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("handles string error type", async () => {
    vi.mocked(api.createAnalysis).mockRejectedValue("String error message");

    const { result } = renderHook(() => useAnalysis());

    await act(async () => {
      await result.current.analyze(mockTranscripts);
    });

    expect(result.current.error).toBe("String error message");
  });

  it("handles unknown error type with default message", async () => {
    vi.mocked(api.createAnalysis).mockRejectedValue({ code: 500 });

    const { result } = renderHook(() => useAnalysis());

    await act(async () => {
      await result.current.analyze(mockTranscripts);
    });

    expect(result.current.error).toBe("An error occurred");
  });
});

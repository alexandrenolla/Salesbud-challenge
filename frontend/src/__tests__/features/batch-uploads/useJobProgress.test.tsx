import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useJobProgress } from "@/features/batch-uploads/hooks/useJobProgress";
import { BatchStage } from "@/features/batch-uploads/types";

// Mock the API module
vi.mock("@/lib/api", () => ({
  getBatchUploadEventsUrl: vi.fn((jobId: string) => `/api/batch-uploads/${jobId}/events`),
}));

// Mock EventSource class
class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  url: string;
  static instances: MockEventSource[] = [];

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close = vi.fn();

  static clear() {
    MockEventSource.instances = [];
  }

  static getLastInstance() {
    return MockEventSource.instances[MockEventSource.instances.length - 1];
  }
}

describe("useJobProgress", () => {
  beforeEach(() => {
    MockEventSource.clear();
    vi.stubGlobal("EventSource", MockEventSource);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const defaultOptions = {
    jobId: null as string | null,
    onProgress: vi.fn(),
    onComplete: vi.fn(),
    onError: vi.fn(),
  };

  describe("connection behavior", () => {
    it("should not connect when jobId is null", () => {
      renderHook(() => useJobProgress(defaultOptions));

      expect(MockEventSource.instances.length).toBe(0);
    });

    it("should connect when jobId is provided", () => {
      renderHook(() =>
        useJobProgress({
          ...defaultOptions,
          jobId: "job-123",
        })
      );

      expect(MockEventSource.instances.length).toBe(1);
      expect(MockEventSource.getLastInstance().url).toBe("/api/batch-uploads/job-123/events");
    });

    it("should close connection when jobId becomes null", () => {
      const { rerender } = renderHook(
        ({ jobId }) =>
          useJobProgress({
            ...defaultOptions,
            jobId,
          }),
        { initialProps: { jobId: "job-123" as string | null } }
      );

      const instance = MockEventSource.getLastInstance();

      rerender({ jobId: null });

      expect(instance.close).toHaveBeenCalled();
    });

    it("should close connection on unmount", () => {
      const { unmount } = renderHook(() =>
        useJobProgress({
          ...defaultOptions,
          jobId: "job-123",
        })
      );

      const instance = MockEventSource.getLastInstance();

      unmount();

      expect(instance.close).toHaveBeenCalled();
    });
  });

  describe("message handling", () => {
    it("should call onProgress when receiving progress event", () => {
      const onProgress = vi.fn();

      renderHook(() =>
        useJobProgress({
          ...defaultOptions,
          jobId: "job-123",
          onProgress,
        })
      );

      const instance = MockEventSource.getLastInstance();

      const progressData = {
        stage: BatchStage.TRANSCRIBING,
        current: 1,
        total: 5,
        message: "Transcribing...",
      };

      act(() => {
        instance.onmessage?.({
          data: JSON.stringify(progressData),
        } as MessageEvent);
      });

      expect(onProgress).toHaveBeenCalledWith(progressData);
    });

    it("should call onComplete when stage is DONE with analysisId", () => {
      const onComplete = vi.fn();

      renderHook(() =>
        useJobProgress({
          ...defaultOptions,
          jobId: "job-123",
          onComplete,
        })
      );

      const instance = MockEventSource.getLastInstance();

      const doneData = {
        stage: BatchStage.DONE,
        current: 5,
        total: 5,
        message: "Done",
        analysisId: "analysis-456",
      };

      act(() => {
        instance.onmessage?.({
          data: JSON.stringify(doneData),
        } as MessageEvent);
      });

      expect(onComplete).toHaveBeenCalledWith("analysis-456");
    });

    it("should call onError when event contains error without analysisId", () => {
      const onError = vi.fn();

      renderHook(() =>
        useJobProgress({
          ...defaultOptions,
          jobId: "job-123",
          onError,
        })
      );

      const instance = MockEventSource.getLastInstance();

      const errorData = {
        stage: BatchStage.TRANSCRIBING,
        current: 2,
        total: 5,
        message: "Failed",
        error: "Transcription failed",
      };

      act(() => {
        instance.onmessage?.({
          data: JSON.stringify(errorData),
        } as MessageEvent);
      });

      expect(onError).toHaveBeenCalledWith("Transcription failed");
    });

    it("should not call onError if error has analysisId (partial success)", () => {
      const onError = vi.fn();

      renderHook(() =>
        useJobProgress({
          ...defaultOptions,
          jobId: "job-123",
          onError,
        })
      );

      const instance = MockEventSource.getLastInstance();

      const errorData = {
        stage: BatchStage.DONE,
        current: 5,
        total: 5,
        message: "Partial success",
        error: "Some files failed",
        analysisId: "analysis-456",
      };

      act(() => {
        instance.onmessage?.({
          data: JSON.stringify(errorData),
        } as MessageEvent);
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("reconnection behavior", () => {
    it("should attempt reconnection on error", () => {
      renderHook(() =>
        useJobProgress({
          ...defaultOptions,
          jobId: "job-123",
        })
      );

      const initialCount = MockEventSource.instances.length;
      const instance = MockEventSource.getLastInstance();

      // Trigger error
      act(() => {
        instance.onerror?.();
      });

      // Fast-forward timer for reconnect delay
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should have attempted to reconnect
      expect(MockEventSource.instances.length).toBeGreaterThan(initialCount);
    });

    it("should use exponential backoff for reconnection", () => {
      renderHook(() =>
        useJobProgress({
          ...defaultOptions,
          jobId: "job-123",
        })
      );

      // First error
      act(() => {
        MockEventSource.getLastInstance().onerror?.();
      });

      // First reconnect after 2s (2^1 * 1000)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const countAfterFirst = MockEventSource.instances.length;

      // Second error
      act(() => {
        MockEventSource.getLastInstance().onerror?.();
      });

      // Second reconnect after 4s (2^2 * 1000)
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(MockEventSource.instances.length).toBeGreaterThan(countAfterFirst);
    });

    it("should call onError after max reconnect attempts", () => {
      const onError = vi.fn();

      renderHook(() =>
        useJobProgress({
          ...defaultOptions,
          jobId: "job-123",
          onError,
        })
      );

      // Exhaust all reconnection attempts
      for (let i = 0; i <= 3; i++) {
        act(() => {
          MockEventSource.getLastInstance().onerror?.();
        });
        act(() => {
          vi.advanceTimersByTime(10000);
        });
      }

      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining("Conexão perdida")
      );
    });
  });

  describe("disconnect on completion", () => {
    it("should close connection when stage is DONE", () => {
      renderHook(() =>
        useJobProgress({
          ...defaultOptions,
          jobId: "job-123",
        })
      );

      const instance = MockEventSource.getLastInstance();

      const doneData = {
        stage: BatchStage.DONE,
        current: 5,
        total: 5,
        message: "Done",
        analysisId: "analysis-456",
      };

      act(() => {
        instance.onmessage?.({
          data: JSON.stringify(doneData),
        } as MessageEvent);
      });

      expect(instance.close).toHaveBeenCalled();
    });
  });
});

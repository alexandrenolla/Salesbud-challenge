import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useBatchUpload } from "@/features/batch-uploads/hooks/useBatchUpload";

// Mock the API module
vi.mock("@/lib/api", () => ({
  createBatchUpload: vi.fn(),
  getAnalysis: vi.fn(),
  getBatchUploadEventsUrl: vi.fn(),
}));

// Mock useJobProgress hook
vi.mock("@/features/batch-uploads/hooks/useJobProgress", () => ({
  useJobProgress: vi.fn(),
}));

import { createBatchUpload, getAnalysis } from "@/lib/api";
import { useJobProgress } from "@/features/batch-uploads/hooks/useJobProgress";

const mockCreateBatchUpload = createBatchUpload as ReturnType<typeof vi.fn>;
const mockGetAnalysis = getAnalysis as ReturnType<typeof vi.fn>;
const mockUseJobProgress = useJobProgress as ReturnType<typeof vi.fn>;

describe("useBatchUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseJobProgress.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createMockFile = (name: string, size = 1000): File => {
    const file = new File(["content"], name, { type: "text/plain" });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  describe("initial state", () => {
    it("should have empty files array", () => {
      const { result } = renderHook(() => useBatchUpload());
      expect(result.current.files).toEqual([]);
    });

    it("should have idle state", () => {
      const { result } = renderHook(() => useBatchUpload());
      expect(result.current.state).toBe("idle");
    });

    it("should have null progress", () => {
      const { result } = renderHook(() => useBatchUpload());
      expect(result.current.progress).toBeNull();
    });

    it("should have null error", () => {
      const { result } = renderHook(() => useBatchUpload());
      expect(result.current.error).toBeNull();
    });

    it("should have null result", () => {
      const { result } = renderHook(() => useBatchUpload());
      expect(result.current.result).toBeNull();
    });
  });

  describe("addFiles", () => {
    it("should add files to the list", () => {
      const { result } = renderHook(() => useBatchUpload());

      act(() => {
        result.current.addFiles([
          createMockFile("file1.txt"),
          createMockFile("file2.txt"),
        ]);
      });

      expect(result.current.files).toHaveLength(2);
      expect(result.current.files[0].name).toBe("file1.txt");
      expect(result.current.files[1].name).toBe("file2.txt");
    });

    it("should generate unique IDs for files", () => {
      const { result } = renderHook(() => useBatchUpload());

      act(() => {
        result.current.addFiles([createMockFile("file1.txt")]);
      });

      act(() => {
        result.current.addFiles([createMockFile("file2.txt")]);
      });

      expect(result.current.files[0].id).not.toBe(result.current.files[1].id);
    });

    it("should detect audio files", () => {
      const { result } = renderHook(() => useBatchUpload());

      act(() => {
        result.current.addFiles([
          createMockFile("audio.mp3"),
          createMockFile("text.txt"),
        ]);
      });

      expect(result.current.files[0].isAudio).toBe(true);
      expect(result.current.files[1].isAudio).toBe(false);
    });

    it("should set pending status for new files", () => {
      const { result } = renderHook(() => useBatchUpload());

      act(() => {
        result.current.addFiles([createMockFile("file.txt")]);
      });

      expect(result.current.files[0].status).toBe("pending");
    });
  });

  describe("removeFile", () => {
    it("should remove file by id", () => {
      const { result } = renderHook(() => useBatchUpload());

      act(() => {
        result.current.addFiles([
          createMockFile("file1.txt"),
          createMockFile("file2.txt"),
        ]);
      });

      const fileToRemove = result.current.files[0].id;

      act(() => {
        result.current.removeFile(fileToRemove);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].name).toBe("file2.txt");
    });

    it("should not throw when removing non-existent file", () => {
      const { result } = renderHook(() => useBatchUpload());

      expect(() => {
        act(() => {
          result.current.removeFile("non-existent-id");
        });
      }).not.toThrow();
    });
  });

  describe("startUpload", () => {
    it("should set error when less than 2 files", async () => {
      const { result } = renderHook(() => useBatchUpload());

      act(() => {
        result.current.addFiles([createMockFile("file1.txt")]);
      });

      await act(async () => {
        await result.current.startUpload();
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.state).toBe("idle");
    });

    it("should call createBatchUpload with files", async () => {
      mockCreateBatchUpload.mockResolvedValue({ jobId: "job-123" });

      const { result } = renderHook(() => useBatchUpload());

      act(() => {
        result.current.addFiles([
          createMockFile("file1.txt"),
          createMockFile("file2.txt"),
        ]);
      });

      await act(async () => {
        await result.current.startUpload();
      });

      expect(mockCreateBatchUpload).toHaveBeenCalled();
      expect(result.current.state).toBe("uploading");
    });

    it("should set error state on API failure", async () => {
      mockCreateBatchUpload.mockRejectedValue(new Error("API Error"));

      const { result } = renderHook(() => useBatchUpload());

      act(() => {
        result.current.addFiles([
          createMockFile("file1.txt"),
          createMockFile("file2.txt"),
        ]);
      });

      await act(async () => {
        await result.current.startUpload();
      });

      expect(result.current.state).toBe("error");
      expect(result.current.error).toBeTruthy();
    });
  });

  describe("reset", () => {
    it("should reset all state to initial values", async () => {
      const { result } = renderHook(() => useBatchUpload());

      act(() => {
        result.current.addFiles([
          createMockFile("file1.txt"),
          createMockFile("file2.txt"),
        ]);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.files).toEqual([]);
      expect(result.current.state).toBe("idle");
      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
    });
  });

  describe("progress handling", () => {
    it("should pass handlers to useJobProgress", () => {
      renderHook(() => useBatchUpload());

      expect(mockUseJobProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: null,
          onProgress: expect.any(Function),
          onComplete: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });
  });
});

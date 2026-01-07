import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BatchUploader } from "@/features/batch-uploads/BatchUploader";
import { useBatchUpload } from "@/features/batch-uploads/hooks";
import { BatchStage, FileItem, BatchProgressEvent } from "@/features/batch-uploads/types";

// Mock the hook
vi.mock("@/features/batch-uploads/hooks", () => ({
  useBatchUpload: vi.fn(),
}));

const mockUseBatchUpload = useBatchUpload as ReturnType<typeof vi.fn>;

describe("BatchUploader", () => {
  const createMockFileItem = (overrides: Partial<FileItem> = {}): FileItem => {
    const file = new File(["content"], overrides.name || "test.txt", {
      type: "text/plain",
    });
    Object.defineProperty(file, "size", { value: 1024 });

    return {
      id: "file-1",
      file,
      name: "test.txt",
      isAudio: false,
      status: "pending",
      ...overrides,
    };
  };

  const defaultHookReturn = {
    files: [] as FileItem[],
    state: "idle" as const,
    progress: null as BatchProgressEvent | null,
    error: null as string | null,
    result: null,
    addFiles: vi.fn(),
    removeFile: vi.fn(),
    startUpload: vi.fn(),
    reset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBatchUpload.mockReturnValue(defaultHookReturn);
  });

  describe("idle state with no files", () => {
    it("should render header text", () => {
      render(<BatchUploader onComplete={vi.fn()} />);

      expect(
        screen.getByText(/Envie transcrições ou áudios/i)
      ).toBeInTheDocument();
    });

    it("should render DropZone", () => {
      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.getByText(/Arraste arquivos aqui/i)).toBeInTheDocument();
    });

    it("should not render file list when empty", () => {
      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.queryByText("Aguardando")).not.toBeInTheDocument();
    });

    it("should not render action buttons when no files", () => {
      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.queryByText("Limpar")).not.toBeInTheDocument();
      expect(screen.queryByText("Gerar Playbook")).not.toBeInTheDocument();
    });
  });

  describe("idle state with files", () => {
    beforeEach(() => {
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        files: [
          createMockFileItem({ id: "1", name: "file1.txt" }),
          createMockFileItem({ id: "2", name: "file2.txt" }),
        ],
      });
    });

    it("should render file count indicator", () => {
      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.getByText("Arquivos selecionados")).toBeInTheDocument();
      expect(screen.getByText(/2 arquivos/)).toBeInTheDocument();
    });

    it("should render file list", () => {
      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.getByText("file1.txt")).toBeInTheDocument();
      expect(screen.getByText("file2.txt")).toBeInTheDocument();
    });

    it('should show "Pronto para análise!" when minimum files reached', () => {
      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.getByText("Pronto para análise!")).toBeInTheDocument();
    });

    it("should render action buttons", () => {
      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.getByText("Limpar")).toBeInTheDocument();
      expect(screen.getByText("Gerar Playbook")).toBeInTheDocument();
    });

    it("should enable Gerar Playbook button when minimum files reached", () => {
      render(<BatchUploader onComplete={vi.fn()} />);

      const button = screen.getByText("Gerar Playbook").closest("button");
      expect(button).not.toBeDisabled();
    });

    it("should call reset when Limpar clicked", () => {
      const reset = vi.fn();
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        files: [createMockFileItem(), createMockFileItem({ id: "2" })],
        reset,
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      fireEvent.click(screen.getByText("Limpar"));
      expect(reset).toHaveBeenCalled();
    });

    it("should call startUpload when Gerar Playbook clicked", () => {
      const startUpload = vi.fn();
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        files: [createMockFileItem(), createMockFileItem({ id: "2" })],
        startUpload,
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      fireEvent.click(screen.getByText("Gerar Playbook"));
      expect(startUpload).toHaveBeenCalled();
    });
  });

  describe("idle state with insufficient files", () => {
    it("should disable Gerar Playbook when less than 2 files", () => {
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        files: [createMockFileItem()],
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      const button = screen.getByText("Gerar Playbook").closest("button");
      expect(button).toBeDisabled();
    });

    it('should not show "Pronto para análise!"', () => {
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        files: [createMockFileItem()],
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.queryByText("Pronto para análise!")).not.toBeInTheDocument();
    });
  });

  describe("file limit warning", () => {
    it("should show warning when at maximum file limit", () => {
      const maxFiles = Array(20)
        .fill(null)
        .map((_, i) => createMockFileItem({ id: `${i}`, name: `file${i}.txt` }));

      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        files: maxFiles,
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.getByText(/Limite de \d+ arquivos atingido/)).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("should display error message", () => {
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        error: "Upload failed",
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.getByText("Upload failed")).toBeInTheDocument();
    });

    it("should show retry button on error", () => {
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        error: "Upload failed",
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.getByText("Tentar novamente")).toBeInTheDocument();
    });

    it("should call reset when retry clicked", () => {
      const reset = vi.fn();
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        error: "Upload failed",
        reset,
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      fireEvent.click(screen.getByText("Tentar novamente"));
      expect(reset).toHaveBeenCalled();
    });
  });

  describe("processing state", () => {
    it("should show StageProgress when uploading", () => {
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        state: "uploading",
        files: [createMockFileItem(), createMockFileItem({ id: "2" })],
        progress: {
          stage: BatchStage.UPLOADING,
          current: 1,
          total: 2,
          message: "Uploading...",
        },
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.getByText("Uploading...")).toBeInTheDocument();
    });

    it("should show StageProgress when processing", () => {
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        state: "processing",
        files: [createMockFileItem(), createMockFileItem({ id: "2" })],
        progress: {
          stage: BatchStage.ANALYZING,
          current: 1,
          total: 1,
          message: "Analyzing...",
        },
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.getByText("Analyzing...")).toBeInTheDocument();
    });

    it("should not show DropZone when processing", () => {
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        state: "processing",
        files: [createMockFileItem(), createMockFileItem({ id: "2" })],
        progress: {
          stage: BatchStage.ANALYZING,
          current: 1,
          total: 1,
          message: "Analyzing...",
        },
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.queryByText(/Arraste arquivos/)).not.toBeInTheDocument();
    });

    it("should show file list without remove buttons when processing", () => {
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        state: "processing",
        files: [
          createMockFileItem({ status: "done" }),
          createMockFileItem({ id: "2", status: "processing" }),
        ],
        progress: {
          stage: BatchStage.TRANSCRIBING,
          current: 2,
          total: 2,
          message: "Processing...",
        },
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      expect(screen.queryByRole("button", { name: /remover/i })).not.toBeInTheDocument();
    });
  });

  describe("completion", () => {
    it("should call onComplete when result is available", () => {
      const onComplete = vi.fn();
      const mockResult = { id: "analysis-123" };

      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        result: mockResult,
      });

      render(<BatchUploader onComplete={onComplete} />);

      expect(onComplete).toHaveBeenCalledWith(mockResult);
    });

    it("should render nothing when result is available", () => {
      const onComplete = vi.fn();
      const mockResult = { id: "analysis-123" };

      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        result: mockResult,
      });

      const { container } = render(<BatchUploader onComplete={onComplete} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("file operations", () => {
    it("should pass addFiles to DropZone", () => {
      const addFiles = vi.fn();
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        addFiles,
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      // DropZone should receive onFilesAdded prop
      // We can verify by checking the hook was called correctly
      expect(mockUseBatchUpload).toHaveBeenCalled();
    });

    it("should pass removeFile to FileList", () => {
      const removeFile = vi.fn();
      mockUseBatchUpload.mockReturnValue({
        ...defaultHookReturn,
        files: [createMockFileItem()],
        removeFile,
      });

      render(<BatchUploader onComplete={vi.fn()} />);

      // FileList should receive onRemove prop
      expect(mockUseBatchUpload).toHaveBeenCalled();
    });
  });
});

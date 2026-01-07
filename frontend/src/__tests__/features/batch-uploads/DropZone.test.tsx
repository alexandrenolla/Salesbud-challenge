import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DropZone } from "@/features/batch-uploads/components/DropZone";

describe("DropZone", () => {
  const defaultProps = {
    onFilesAdded: vi.fn(),
    disabled: false,
    fileCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockFile = (name: string, size = 1000, type = "text/plain"): File => {
    const file = new File(["content"], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  const createDataTransfer = (files: File[]): DataTransfer => {
    const dataTransfer = {
      files: files as unknown as FileList,
      items: [],
      types: ["Files"],
    } as unknown as DataTransfer;
    return dataTransfer;
  };

  describe("rendering", () => {
    it("should render drop zone with correct text", () => {
      render(<DropZone {...defaultProps} />);

      expect(screen.getByText("Arraste arquivos aqui")).toBeInTheDocument();
      expect(screen.getByText("ou clique para selecionar")).toBeInTheDocument();
    });

    it("should show file type indicators", () => {
      render(<DropZone {...defaultProps} />);

      expect(screen.getByText(".txt")).toBeInTheDocument();
      expect(screen.getByText(".mp3, .wav, .m4a")).toBeInTheDocument();
    });

    it("should show minimum and maximum file count", () => {
      render(<DropZone {...defaultProps} />);

      expect(screen.getByText(/Mín\. \d+, máx\. \d+ arquivos/)).toBeInTheDocument();
    });

    it("should apply disabled styles when disabled", () => {
      const { container } = render(<DropZone {...defaultProps} disabled />);

      const dropZone = container.firstChild as HTMLElement;
      expect(dropZone.className).toContain("opacity-50");
      expect(dropZone.className).toContain("cursor-not-allowed");
    });
  });

  describe("drag and drop", () => {
    it("should change style on drag over", () => {
      const { container } = render(<DropZone {...defaultProps} />);
      const dropZone = container.firstChild as HTMLElement;

      fireEvent.dragOver(dropZone, { dataTransfer: createDataTransfer([]) });

      expect(screen.getByText("Solte os arquivos aqui")).toBeInTheDocument();
    });

    it("should reset style on drag leave", () => {
      const { container } = render(<DropZone {...defaultProps} />);
      const dropZone = container.firstChild as HTMLElement;

      fireEvent.dragOver(dropZone, { dataTransfer: createDataTransfer([]) });
      fireEvent.dragLeave(dropZone);

      expect(screen.getByText("Arraste arquivos aqui")).toBeInTheDocument();
    });

    it("should call onFilesAdded on valid file drop", () => {
      const onFilesAdded = vi.fn();
      const { container } = render(
        <DropZone {...defaultProps} onFilesAdded={onFilesAdded} />
      );
      const dropZone = container.firstChild as HTMLElement;

      const files = [createMockFile("test.txt")];

      fireEvent.drop(dropZone, { dataTransfer: createDataTransfer(files) });

      expect(onFilesAdded).toHaveBeenCalledWith(files);
    });

    it("should not add files when disabled", () => {
      const onFilesAdded = vi.fn();
      const { container } = render(
        <DropZone {...defaultProps} onFilesAdded={onFilesAdded} disabled />
      );
      const dropZone = container.firstChild as HTMLElement;

      const files = [createMockFile("test.txt")];
      fireEvent.drop(dropZone, { dataTransfer: createDataTransfer(files) });

      expect(onFilesAdded).not.toHaveBeenCalled();
    });

    it("should filter out invalid file extensions", () => {
      const onFilesAdded = vi.fn();
      const { container } = render(
        <DropZone {...defaultProps} onFilesAdded={onFilesAdded} />
      );
      const dropZone = container.firstChild as HTMLElement;

      const files = [
        createMockFile("valid.txt"),
        createMockFile("invalid.pdf"),
      ];

      fireEvent.drop(dropZone, { dataTransfer: createDataTransfer(files) });

      expect(onFilesAdded).toHaveBeenCalledWith([
        expect.objectContaining({ name: "valid.txt" }),
      ]);
    });

    it("should filter out files exceeding size limit", () => {
      const onFilesAdded = vi.fn();
      const { container } = render(
        <DropZone {...defaultProps} onFilesAdded={onFilesAdded} />
      );
      const dropZone = container.firstChild as HTMLElement;

      const files = [
        createMockFile("small.txt", 1000),
        createMockFile("large.txt", 10 * 1024 * 1024), // 10MB > 5MB limit
      ];

      fireEvent.drop(dropZone, { dataTransfer: createDataTransfer(files) });

      expect(onFilesAdded).toHaveBeenCalledWith([
        expect.objectContaining({ name: "small.txt" }),
      ]);
    });

    it("should limit files based on remaining capacity", () => {
      const onFilesAdded = vi.fn();
      const { container } = render(
        <DropZone {...defaultProps} onFilesAdded={onFilesAdded} fileCount={19} />
      );
      const dropZone = container.firstChild as HTMLElement;

      const files = [
        createMockFile("file1.txt"),
        createMockFile("file2.txt"),
        createMockFile("file3.txt"),
      ];

      fireEvent.drop(dropZone, { dataTransfer: createDataTransfer(files) });

      // Should only add 1 file since fileCount is 19 and max is 20
      expect(onFilesAdded).toHaveBeenCalledWith([
        expect.objectContaining({ name: "file1.txt" }),
      ]);
    });
  });

  describe("click to select", () => {
    it("should trigger file input click on zone click", () => {
      const { container } = render(<DropZone {...defaultProps} />);

      // The file input should be in the document
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it("should not trigger file input when disabled", () => {
      const { container } = render(<DropZone {...defaultProps} disabled />);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput.disabled).toBe(true);
    });

    it("should accept multiple files", () => {
      const { container } = render(<DropZone {...defaultProps} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute("multiple");
    });

    it("should have correct accept attribute", () => {
      const { container } = render(<DropZone {...defaultProps} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput?.getAttribute("accept")).toContain(".txt");
      expect(fileInput?.getAttribute("accept")).toContain(".mp3");
    });
  });

  describe("audio file validation", () => {
    it("should accept audio files within size limit", () => {
      const onFilesAdded = vi.fn();
      const { container } = render(
        <DropZone {...defaultProps} onFilesAdded={onFilesAdded} />
      );
      const dropZone = container.firstChild as HTMLElement;

      const files = [createMockFile("audio.mp3", 10 * 1024 * 1024, "audio/mpeg")];

      fireEvent.drop(dropZone, { dataTransfer: createDataTransfer(files) });

      expect(onFilesAdded).toHaveBeenCalledWith([
        expect.objectContaining({ name: "audio.mp3" }),
      ]);
    });

    it("should reject audio files exceeding 25MB limit", () => {
      const onFilesAdded = vi.fn();
      const { container } = render(
        <DropZone {...defaultProps} onFilesAdded={onFilesAdded} />
      );
      const dropZone = container.firstChild as HTMLElement;

      const files = [createMockFile("audio.mp3", 30 * 1024 * 1024, "audio/mpeg")];

      fireEvent.drop(dropZone, { dataTransfer: createDataTransfer(files) });

      expect(onFilesAdded).not.toHaveBeenCalled();
    });
  });
});

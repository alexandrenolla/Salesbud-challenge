import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileList } from "@/features/batch-uploads/components/FileList";
import { FileItem } from "@/features/batch-uploads/types";

describe("FileList", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render nothing when files array is empty", () => {
      const { container } = render(<FileList files={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render file list with file names", () => {
      const files = [
        createMockFileItem({ id: "1", name: "file1.txt" }),
        createMockFileItem({ id: "2", name: "file2.txt" }),
      ];

      render(<FileList files={files} />);

      expect(screen.getByText("file1.txt")).toBeInTheDocument();
      expect(screen.getByText("file2.txt")).toBeInTheDocument();
    });

    it("should display file size", () => {
      const files = [createMockFileItem()];

      render(<FileList files={files} />);

      expect(screen.getByText("1 KB")).toBeInTheDocument();
    });
  });

  describe("file type icons", () => {
    it("should show text icon for non-audio files", () => {
      const files = [createMockFileItem({ isAudio: false })];

      const { container } = render(<FileList files={files} />);

      // Text files should have blue background
      const iconContainer = container.querySelector(".bg-blue-100");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should show audio icon for audio files", () => {
      const files = [createMockFileItem({ isAudio: true, name: "audio.mp3" })];

      const { container } = render(<FileList files={files} />);

      // Audio files should have purple background
      const iconContainer = container.querySelector(".bg-purple-100");
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe("status indicators", () => {
    it("should show pending status text", () => {
      const files = [createMockFileItem({ status: "pending" })];

      render(<FileList files={files} />);

      expect(screen.getByText("Aguardando")).toBeInTheDocument();
    });

    it("should show processing spinner", () => {
      const files = [createMockFileItem({ status: "processing" })];

      const { container } = render(<FileList files={files} />);

      // Should have animate-spin class
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should show success check for done status", () => {
      const files = [createMockFileItem({ status: "done" })];

      const { container } = render(<FileList files={files} />);

      // Done status has green background
      const fileRow = container.querySelector(".bg-green-50");
      expect(fileRow).toBeInTheDocument();
    });

    it("should show error indicator with error message", () => {
      const files = [
        createMockFileItem({
          status: "error",
          error: "File processing failed",
        }),
      ];

      const { container } = render(<FileList files={files} />);

      // Error status has red background
      const fileRow = container.querySelector(".bg-red-50");
      expect(fileRow).toBeInTheDocument();
    });
  });

  describe("remove button", () => {
    it("should show remove button for pending files when canRemove is true", () => {
      const files = [createMockFileItem({ status: "pending", name: "test.txt" })];
      const onRemove = vi.fn();

      render(<FileList files={files} onRemove={onRemove} canRemove={true} />);

      const removeButton = screen.getByRole("button", { name: /remover/i });
      expect(removeButton).toBeInTheDocument();
    });

    it("should not show remove button when canRemove is false", () => {
      const files = [createMockFileItem({ status: "pending" })];
      const onRemove = vi.fn();

      render(<FileList files={files} onRemove={onRemove} canRemove={false} />);

      expect(screen.queryByRole("button", { name: /remover/i })).not.toBeInTheDocument();
    });

    it("should not show remove button for processing files", () => {
      const files = [createMockFileItem({ status: "processing" })];
      const onRemove = vi.fn();

      render(<FileList files={files} onRemove={onRemove} canRemove={true} />);

      expect(screen.queryByRole("button", { name: /remover/i })).not.toBeInTheDocument();
    });

    it("should not show remove button for done files", () => {
      const files = [createMockFileItem({ status: "done" })];
      const onRemove = vi.fn();

      render(<FileList files={files} onRemove={onRemove} canRemove={true} />);

      expect(screen.queryByRole("button", { name: /remover/i })).not.toBeInTheDocument();
    });

    it("should call onRemove with file id when clicked", () => {
      const files = [createMockFileItem({ id: "file-123", status: "pending", name: "test.txt" })];
      const onRemove = vi.fn();

      render(<FileList files={files} onRemove={onRemove} canRemove={true} />);

      const removeButton = screen.getByRole("button", { name: /remover/i });
      fireEvent.click(removeButton);

      expect(onRemove).toHaveBeenCalledWith("file-123");
    });

    it("should not show remove button when onRemove is not provided", () => {
      const files = [createMockFileItem({ status: "pending" })];

      render(<FileList files={files} canRemove={true} />);

      expect(screen.queryByRole("button", { name: /remover/i })).not.toBeInTheDocument();
    });
  });

  describe("status styling", () => {
    it("should apply green styling for done status", () => {
      const files = [createMockFileItem({ status: "done" })];

      const { container } = render(<FileList files={files} />);

      expect(container.querySelector(".bg-green-50")).toBeInTheDocument();
      expect(container.querySelector(".border-green-200")).toBeInTheDocument();
    });

    it("should apply blue styling for processing status", () => {
      const files = [createMockFileItem({ status: "processing" })];

      const { container } = render(<FileList files={files} />);

      expect(container.querySelector(".bg-blue-50")).toBeInTheDocument();
      expect(container.querySelector(".border-blue-200")).toBeInTheDocument();
    });

    it("should apply red styling for error status", () => {
      const files = [createMockFileItem({ status: "error" })];

      const { container } = render(<FileList files={files} />);

      expect(container.querySelector(".bg-red-50")).toBeInTheDocument();
      expect(container.querySelector(".border-red-200")).toBeInTheDocument();
    });

    it("should apply gray styling for pending status", () => {
      const files = [createMockFileItem({ status: "pending" })];

      const { container } = render(<FileList files={files} />);

      expect(container.querySelector(".bg-gray-50")).toBeInTheDocument();
      expect(container.querySelector(".border-gray-200")).toBeInTheDocument();
    });
  });
});

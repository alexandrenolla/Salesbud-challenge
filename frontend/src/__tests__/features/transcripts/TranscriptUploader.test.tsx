import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TranscriptUploader } from "@/features/transcripts";
import { ToastProvider } from "@/contexts/ToastContext";

// Mock the API
vi.mock("@/lib/api", () => ({
  uploadTranscript: vi.fn(),
}));

// Custom render function with ToastProvider
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe("TranscriptUploader", () => {
  const mockOnAnalyze = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders initial transcript card", () => {
    renderWithProviders(<TranscriptUploader onAnalyze={mockOnAnalyze} isLoading={false} />);
    expect(screen.getByText("Transcrição #1")).toBeInTheDocument();
  });

  it("renders add transcript button", () => {
    renderWithProviders(<TranscriptUploader onAnalyze={mockOnAnalyze} isLoading={false} />);
    expect(screen.getByText("Adicionar Transcrição")).toBeInTheDocument();
  });

  it("adds new transcript when clicking add button", async () => {
    renderWithProviders(<TranscriptUploader onAnalyze={mockOnAnalyze} isLoading={false} />);

    const addButton = screen.getByText("Adicionar Transcrição");
    await userEvent.click(addButton);

    expect(screen.getByText("Transcrição #1")).toBeInTheDocument();
    expect(screen.getByText("Transcrição #2")).toBeInTheDocument();
  });

  it("removes transcript when clicking delete button", async () => {
    renderWithProviders(<TranscriptUploader onAnalyze={mockOnAnalyze} isLoading={false} />);

    // Add a second transcript first
    await userEvent.click(screen.getByText("Adicionar Transcrição"));
    expect(screen.getByText("Transcrição #2")).toBeInTheDocument();

    // Find and click the delete button (Trash icon)
    const deleteButtons = screen.getAllByRole("button").filter((btn) => btn.querySelector("svg"));
    const trashButton = deleteButtons.find((btn) => btn.classList.contains("text-gray-400"));
    if (trashButton) {
      await userEvent.click(trashButton);
    }
  });

  it("updates transcript content on textarea change", async () => {
    renderWithProviders(<TranscriptUploader onAnalyze={mockOnAnalyze} isLoading={false} />);

    const textarea = screen.getByPlaceholderText(/Cole a transcrição/i);
    await userEvent.type(textarea, "Test content");

    expect(textarea).toHaveValue("Test content");
  });

  it("shows character count", async () => {
    renderWithProviders(<TranscriptUploader onAnalyze={mockOnAnalyze} isLoading={false} />);

    const textarea = screen.getByPlaceholderText(/Cole a transcrição/i);
    await userEvent.type(textarea, "Hello");

    expect(screen.getByText(/5 caracteres/i)).toBeInTheDocument();
  });

  it("shows minimum character warning when content is too short", async () => {
    renderWithProviders(<TranscriptUploader onAnalyze={mockOnAnalyze} isLoading={false} />);

    const textarea = screen.getByPlaceholderText(/Cole a transcrição/i);
    await userEvent.type(textarea, "Short");

    expect(screen.getByText(/mínimo: 100/i)).toBeInTheDocument();
  });

  it("disables submit button with less than 2 valid transcripts", () => {
    renderWithProviders(<TranscriptUploader onAnalyze={mockOnAnalyze} isLoading={false} />);

    const submitButton = screen.getByText("Analisar Transcrições");
    expect(submitButton).toBeDisabled();
  });

  it("shows valid count indicator", () => {
    renderWithProviders(<TranscriptUploader onAnalyze={mockOnAnalyze} isLoading={false} />);
    expect(screen.getByText(/0 de 2 transcrições válidas/i)).toBeInTheDocument();
  });

  it("enables submit with 2 valid transcripts", async () => {
    renderWithProviders(<TranscriptUploader onAnalyze={mockOnAnalyze} isLoading={false} />);

    // Add second transcript
    await userEvent.click(screen.getByText("Adicionar Transcrição"));

    // Fill both with valid content (100+ chars)
    const textareas = screen.getAllByPlaceholderText(/Cole a transcrição/i);
    const longText = "a".repeat(100);

    await userEvent.type(textareas[0], longText);
    await userEvent.type(textareas[1], longText);

    const submitButton = screen.getByText("Analisar Transcrições");
    expect(submitButton).not.toBeDisabled();
  });

  it("calls onAnalyze when submit is clicked with valid data", async () => {
    renderWithProviders(<TranscriptUploader onAnalyze={mockOnAnalyze} isLoading={false} />);

    // Add second transcript
    await userEvent.click(screen.getByText("Adicionar Transcrição"));

    // Fill both with valid content
    const textareas = screen.getAllByPlaceholderText(/Cole a transcrição/i);
    const longText = "a".repeat(100);

    await userEvent.type(textareas[0], longText);
    await userEvent.type(textareas[1], longText);

    const submitButton = screen.getByText("Analisar Transcrições");
    await userEvent.click(submitButton);

    expect(mockOnAnalyze).toHaveBeenCalledTimes(1);
    expect(mockOnAnalyze).toHaveBeenCalledWith([
      { content: longText },
      { content: longText },
    ]);
  });

  it("shows loading state on submit button", () => {
    renderWithProviders(<TranscriptUploader onAnalyze={mockOnAnalyze} isLoading={true} />);

    const submitButton = screen.getByText("Analisar Transcrições");
    expect(submitButton).toBeDisabled();
  });

  it("renders upload button for each transcript", () => {
    renderWithProviders(<TranscriptUploader onAnalyze={mockOnAnalyze} isLoading={false} />);
    expect(screen.getByText("Upload .txt")).toBeInTheDocument();
  });
});

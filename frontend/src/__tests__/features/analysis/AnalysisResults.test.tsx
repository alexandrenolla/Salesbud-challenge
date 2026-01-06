import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalysisResults } from "@/features/analysis";
import { AnalysisResult, ImpactLevel } from "@/types";

const mockResult: AnalysisResult = {
  summary: {
    totalMeetings: 5,
    wonMeetings: 3,
    lostMeetings: 2,
    analysisDate: "2024-01-15",
  },
  engagementMoments: [
    {
      quote: "Isso é exatamente o que precisamos!",
      context: "Cliente demonstrou entusiasmo com a solução",
      speakerTurn: "client",
      impactLevel: ImpactLevel.HIGH,
    },
    {
      quote: "Interessante...",
      context: "Cliente mostrou interesse moderado",
      speakerTurn: "client",
      impactLevel: ImpactLevel.MEDIUM,
    },
  ],
  effectiveQuestions: [
    {
      question: "Qual é o maior desafio que você enfrenta hoje?",
      avgResponseTime: "15s",
      successRate: 85,
      suggestedTiming: "Início da reunião",
    },
  ],
  objections: [
    {
      objection: "O preço está muito alto",
      frequency: 3,
      successfulResponses: ["Oferecemos parcelamento", "ROI em 6 meses"],
      unsuccessfulResponses: ["Desconto de 5%"],
      recommendedResponse: "Destaque o ROI e ofereça parcelamento",
    },
  ],
  playbookSuggestions: [
    {
      section: "Abertura",
      content: "Inicie com uma pergunta sobre os desafios atuais",
      basedOn: "Análise de 5 reuniões",
    },
    {
      section: "Fechamento",
      content: "Proponha próximos passos claros",
      basedOn: "Reuniões ganhas",
    },
  ],
};

describe("AnalysisResults", () => {
  const mockOnReset = vi.fn();

  it("renders summary statistics correctly", () => {
    render(<AnalysisResults result={mockResult} onReset={mockOnReset} />);

    expect(screen.getByText("5")).toBeInTheDocument(); // Total
    expect(screen.getByText("3")).toBeInTheDocument(); // Won
    expect(screen.getByText("2")).toBeInTheDocument(); // Lost
    expect(screen.getByText("60%")).toBeInTheDocument(); // Win rate
  });

  it("renders engagement moments", () => {
    render(<AnalysisResults result={mockResult} onReset={mockOnReset} />);

    expect(screen.getByText("Momentos de Engajamento")).toBeInTheDocument();
    expect(screen.getByText(/Isso é exatamente o que precisamos!/i)).toBeInTheDocument();
    expect(screen.getByText(/Cliente demonstrou entusiasmo/i)).toBeInTheDocument();
  });

  it("renders effective questions with success rate", () => {
    render(<AnalysisResults result={mockResult} onReset={mockOnReset} />);

    expect(screen.getByText("Perguntas Eficazes")).toBeInTheDocument();
    expect(screen.getByText(/Qual é o maior desafio/i)).toBeInTheDocument();
    expect(screen.getByText(/85% sucesso/i)).toBeInTheDocument();
  });

  it("renders objections with recommended response", () => {
    render(<AnalysisResults result={mockResult} onReset={mockOnReset} />);

    expect(screen.getByText("Objeções Identificadas")).toBeInTheDocument();
    expect(screen.getByText(/O preço está muito alto/i)).toBeInTheDocument();
    expect(screen.getByText(/Destaque o ROI/i)).toBeInTheDocument();
  });

  it("renders playbook suggestions grouped by section", () => {
    render(<AnalysisResults result={mockResult} onReset={mockOnReset} />);

    expect(screen.getByText(/Sugestões para Playbook/i)).toBeInTheDocument();
    expect(screen.getByText("Abertura")).toBeInTheDocument();
    expect(screen.getByText("Fechamento")).toBeInTheDocument();
  });

  it("renders reset button", () => {
    render(<AnalysisResults result={mockResult} onReset={mockOnReset} />);

    expect(screen.getByText("Nova Análise")).toBeInTheDocument();
  });

  it("calls onReset when reset button is clicked", async () => {
    render(<AnalysisResults result={mockResult} onReset={mockOnReset} />);

    const resetButton = screen.getByText("Nova Análise");
    await userEvent.click(resetButton);

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it("shows impact level badges for engagement moments", () => {
    render(<AnalysisResults result={mockResult} onReset={mockOnReset} />);

    expect(screen.getByText("Impacto Alto")).toBeInTheDocument();
    expect(screen.getByText("Impacto Médio")).toBeInTheDocument();
  });

  it("renders objection recommended response label", () => {
    render(<AnalysisResults result={mockResult} onReset={mockOnReset} />);

    expect(screen.getByText("Resposta Recomendada")).toBeInTheDocument();
  });

  it("renders title correctly", () => {
    render(<AnalysisResults result={mockResult} onReset={mockOnReset} />);

    expect(screen.getByText("Resultados da Análise")).toBeInTheDocument();
  });
});

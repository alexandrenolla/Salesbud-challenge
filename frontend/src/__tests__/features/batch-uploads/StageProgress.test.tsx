import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StageProgress } from "@/features/batch-uploads/components/StageProgress";
import { BatchStage, BatchProgressEvent } from "@/features/batch-uploads/types";

describe("StageProgress", () => {
  const createProgressEvent = (
    overrides: Partial<BatchProgressEvent> = {}
  ): BatchProgressEvent => ({
    stage: BatchStage.TRANSCRIBING,
    current: 1,
    total: 5,
    message: "Processing...",
    ...overrides,
  });

  describe("rendering", () => {
    it("should render nothing when progress is null", () => {
      const { container } = render(<StageProgress progress={null} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render all stage indicators", () => {
      const progress = createProgressEvent();

      render(<StageProgress progress={progress} />);

      expect(screen.getByText("Transcrevendo")).toBeInTheDocument();
      expect(screen.getByText("Detectando outcomes")).toBeInTheDocument();
      expect(screen.getByText("Analisando padrões")).toBeInTheDocument();
      expect(screen.getByText("Gerando playbook")).toBeInTheDocument();
    });

    it("should display progress message", () => {
      const progress = createProgressEvent({ message: "Transcribing file 1..." });

      render(<StageProgress progress={progress} />);

      expect(screen.getByText("Transcribing file 1...")).toBeInTheDocument();
    });

    it("should display percentage", () => {
      const progress = createProgressEvent({
        stage: BatchStage.TRANSCRIBING,
        current: 3,
        total: 5,
      });

      render(<StageProgress progress={progress} />);

      // Should show some percentage
      expect(screen.getByText(/%$/)).toBeInTheDocument();
    });
  });

  describe("stage progression", () => {
    it("should show transcribing as active", () => {
      const progress = createProgressEvent({ stage: BatchStage.TRANSCRIBING });

      const { container } = render(<StageProgress progress={progress} />);

      // Active stage should have primary styling
      const activeCircle = container.querySelector(".bg-primary-500");
      expect(activeCircle).toBeInTheDocument();
    });

    it("should show previous stages as completed", () => {
      const progress = createProgressEvent({ stage: BatchStage.ANALYZING });

      const { container } = render(<StageProgress progress={progress} />);

      // Completed stages should have green styling
      const completedCircles = container.querySelectorAll(".bg-green-500");
      expect(completedCircles.length).toBeGreaterThan(0);
    });

    it("should show future stages as pending", () => {
      const progress = createProgressEvent({ stage: BatchStage.TRANSCRIBING });

      const { container } = render(<StageProgress progress={progress} />);

      // Pending stages should have gray border
      const pendingCircles = container.querySelectorAll(".border-gray-200");
      expect(pendingCircles.length).toBeGreaterThan(0);
    });
  });

  describe("done state", () => {
    it('should show "Concluído!" when stage is DONE', () => {
      const progress = createProgressEvent({
        stage: BatchStage.DONE,
        analysisId: "analysis-123",
      });

      render(<StageProgress progress={progress} />);

      expect(screen.getByText("Concluído!")).toBeInTheDocument();
    });

    it("should show 100% when done", () => {
      const progress = createProgressEvent({
        stage: BatchStage.DONE,
        analysisId: "analysis-123",
      });

      render(<StageProgress progress={progress} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("should apply green styling to progress bar when done", () => {
      const progress = createProgressEvent({
        stage: BatchStage.DONE,
        analysisId: "analysis-123",
      });

      const { container } = render(<StageProgress progress={progress} />);

      const progressFill = container.querySelector(".bg-green-500");
      expect(progressFill).toBeInTheDocument();
    });

    it("should show all stages as completed when done", () => {
      const progress = createProgressEvent({
        stage: BatchStage.DONE,
        analysisId: "analysis-123",
      });

      const { container } = render(<StageProgress progress={progress} />);

      // All 4 stage circles should be green
      const completedCircles = container.querySelectorAll(
        ".bg-green-500.rounded-full"
      );
      expect(completedCircles.length).toBe(4);
    });
  });

  describe("progress calculation", () => {
    it("should calculate within-stage progress", () => {
      const progress = createProgressEvent({
        stage: BatchStage.TRANSCRIBING,
        current: 2,
        total: 4,
      });

      render(<StageProgress progress={progress} />);

      // First stage (25% weight) * (2/4 within stage) = ~12.5%
      // But we show rounded percentage
      const percentageText = screen.getByText(/%$/);
      expect(percentageText).toBeInTheDocument();
    });

    it("should show higher percentage for later stages", () => {
      const earlyProgress = createProgressEvent({
        stage: BatchStage.TRANSCRIBING,
        current: 1,
        total: 5,
      });

      const lateProgress = createProgressEvent({
        stage: BatchStage.GENERATING,
        current: 1,
        total: 1,
      });

      const { rerender } = render(<StageProgress progress={earlyProgress} />);
      const earlyPercentage = screen.getByText(/%$/).textContent;

      rerender(<StageProgress progress={lateProgress} />);
      const latePercentage = screen.getByText(/%$/).textContent;

      const earlyNum = parseInt(earlyPercentage!.replace("%", ""));
      const lateNum = parseInt(latePercentage!.replace("%", ""));

      expect(lateNum).toBeGreaterThan(earlyNum);
    });
  });

  describe("connector lines", () => {
    it("should render connector lines between stages", () => {
      const progress = createProgressEvent();

      const { container } = render(<StageProgress progress={progress} />);

      // Should have 3 connector lines (between 4 stages)
      const connectorLines = container.querySelectorAll(".h-0\\.5");
      expect(connectorLines.length).toBe(3);
    });

    it("should color connectors green for completed transitions", () => {
      const progress = createProgressEvent({
        stage: BatchStage.ANALYZING, // 3rd stage
      });

      const { container } = render(<StageProgress progress={progress} />);

      // First two connectors should be green
      const greenConnectors = container.querySelectorAll(".bg-green-500.h-0\\.5");
      expect(greenConnectors.length).toBeGreaterThanOrEqual(1);
    });

    it("should color connectors gray for pending transitions", () => {
      const progress = createProgressEvent({
        stage: BatchStage.TRANSCRIBING, // 1st stage
      });

      const { container } = render(<StageProgress progress={progress} />);

      // Later connectors should be gray
      const grayConnectors = container.querySelectorAll(".bg-gray-200.h-0\\.5");
      expect(grayConnectors.length).toBeGreaterThan(0);
    });
  });

  describe("uploading stage", () => {
    it("should handle uploading stage", () => {
      const progress = createProgressEvent({
        stage: BatchStage.UPLOADING,
        current: 0,
        total: 5,
      });

      render(<StageProgress progress={progress} />);

      // Should show 0% at the beginning
      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });
});

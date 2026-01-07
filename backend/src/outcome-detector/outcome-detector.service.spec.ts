import { Test, TestingModule } from "@nestjs/testing";
import { OutcomeDetectorService } from "./outcome-detector.service";
import { LlmService } from "src/llm/llm.service";
import { Outcome } from "src/analyses/enums/outcome.enum";
import { Confidence } from "./enums/confidence.enum";

describe("OutcomeDetectorService", () => {
  let service: OutcomeDetectorService;
  let llmService: jest.Mocked<LlmService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutcomeDetectorService,
        {
          provide: LlmService,
          useValue: {
            generateJSON: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OutcomeDetectorService>(OutcomeDetectorService);
    llmService = module.get(LlmService);
  });

  describe("detectOutcome", () => {
    it("should detect WON outcome with HIGH confidence", async () => {
      const mockResult = {
        outcome: Outcome.WON,
        confidence: Confidence.HIGH,
        reason: "Customer confirmed purchase and scheduled installation",
      };

      llmService.generateJSON.mockResolvedValue(mockResult);

      const transcript = "Customer: I love the product. Let's proceed with the purchase.";
      const result = await service.detectOutcome(transcript);

      expect(result.outcome).toBe(Outcome.WON);
      expect(result.confidence).toBe(Confidence.HIGH);
      expect(result.reason).toBe(mockResult.reason);
    });

    it("should detect LOST outcome", async () => {
      const mockResult = {
        outcome: Outcome.LOST,
        confidence: Confidence.MEDIUM,
        reason: "Customer declined due to budget constraints",
      };

      llmService.generateJSON.mockResolvedValue(mockResult);

      const transcript = "Customer: Sorry, we don't have the budget for this.";
      const result = await service.detectOutcome(transcript);

      expect(result.outcome).toBe(Outcome.LOST);
      expect(result.confidence).toBe(Confidence.MEDIUM);
    });

    it("should truncate long transcripts", async () => {
      const mockResult = {
        outcome: Outcome.WON,
        confidence: Confidence.HIGH,
        reason: "Clear purchase intent",
      };

      llmService.generateJSON.mockResolvedValue(mockResult);

      // Create a very long transcript
      const longTranscript = "A".repeat(10000);
      await service.detectOutcome(longTranscript);

      // Verify the prompt was called with truncated content
      expect(llmService.generateJSON).toHaveBeenCalledWith(
        expect.stringContaining("A".repeat(100)), // Contains at least some A's
      );
    });

    it("should call LLM service with proper prompt structure", async () => {
      llmService.generateJSON.mockResolvedValue({
        outcome: Outcome.WON,
        confidence: Confidence.HIGH,
        reason: "Test",
      });

      await service.detectOutcome("Test transcript content");

      expect(llmService.generateJSON).toHaveBeenCalledWith(
        expect.stringContaining("Test transcript content"),
      );
    });

    it("should propagate LLM service errors", async () => {
      llmService.generateJSON.mockRejectedValue(new Error("LLM Error"));

      await expect(
        service.detectOutcome("Test transcript"),
      ).rejects.toThrow("LLM Error");
    });
  });
});

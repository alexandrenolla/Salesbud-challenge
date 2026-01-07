import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UnprocessableEntityException, NotFoundException } from "@nestjs/common";
import { AnalysesService } from "./analyses.service";
import { Analysis } from "./entities/analysis.entity";
import { LlmService } from "src/llm/llm.service";
import { OutcomeDetectorService } from "src/outcome-detector/outcome-detector.service";
import { Outcome } from "./enums/outcome.enum";
import { Confidence } from "src/outcome-detector/enums/confidence.enum";

describe("AnalysesService", () => {
  let service: AnalysesService;
  let analysisRepository: jest.Mocked<Repository<Analysis>>;
  let llmService: jest.Mocked<LlmService>;
  let outcomeDetectorService: jest.Mocked<OutcomeDetectorService>;

  const mockExtractionResult = {
    seller_questions: [
      {
        question: "What are your main challenges?",
        client_response_length: "longa" as const,
        generated_interest: true,
      },
    ],
    engagement_moments: [{ quote: "That's interesting", indicator: "verbal" }],
    objections: [
      {
        objection: "Price is too high",
        seller_response: "Let me explain the value",
        objection_resolved: true,
      },
    ],
    client_pain_points: ["Time management"],
    buying_signals: ["Interested in demo"],
  };

  const mockComparativeResult = {
    winning_patterns: [
      { pattern: "Pattern 1", frequency: 3, evidence: ["Evidence 1"] },
    ],
    losing_patterns: [
      { pattern: "Pattern 2", frequency: 2, evidence: ["Evidence 2"] },
    ],
    effective_questions: [
      {
        question: "Test question?",
        success_rate: 80,
        why_it_works: "Builds rapport",
      },
    ],
    critical_objections: [
      {
        objection: "Price concern",
        successful_responses: ["Value explanation"],
        failed_responses: ["Discount offer"],
      },
    ],
    engagement_triggers: [
      { trigger: "Demo", how_to_replicate: "Offer early" },
    ],
  };

  const mockPlaybookContent = {
    opening_script: {
      script: "Hello, thank you for meeting with me",
      key_elements: ["Greeting", "Thank you"],
      avoid: ["Being pushy"],
    },
    discovery_questions: [
      {
        question: "What are your goals?",
        purpose: "Understand needs",
        expected_response: "Business goals",
        follow_up: "Tell me more",
        timing: "Early in call",
      },
    ],
    objection_handling: [
      {
        objection: "Price",
        recommended_response: "Value explanation",
        alternative_response: "Payment plans",
        what_not_to_say: "Immediate discount",
        success_evidence: "80% success",
      },
    ],
    engagement_tactics: [
      { tactic: "Active listening", when_to_use: "Always", example: "I hear you" },
    ],
    closing_checklist: [{ item: "Confirm next steps", why: "Clear path forward" }],
    red_flags: [
      {
        flag: "Lack of engagement",
        what_it_means: "Low interest",
        how_to_recover: "Ask probing questions",
      },
    ],
  };

  const mockAnalysis: Partial<Analysis> = {
    id: "test-analysis-id",
    transcripts: [],
    summary: {
      totalMeetings: 2,
      wonMeetings: 1,
      lostMeetings: 1,
      analysisDate: new Date().toISOString(),
    },
    engagementMoments: [],
    effectiveQuestions: [],
    objections: [],
    playbookSuggestions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysesService,
        {
          provide: getRepositoryToken(Analysis),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: LlmService,
          useValue: {
            generateJSON: jest.fn(),
          },
        },
        {
          provide: OutcomeDetectorService,
          useValue: {
            detectOutcome: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnalysesService>(AnalysesService);
    analysisRepository = module.get(getRepositoryToken(Analysis));
    llmService = module.get(LlmService);
    outcomeDetectorService = module.get(OutcomeDetectorService);
  });

  describe("create", () => {
    it("should create an analysis from transcripts", async () => {
      const dto = {
        transcripts: [
          { content: "Won meeting transcript" },
          { content: "Lost meeting transcript" },
        ],
      };

      outcomeDetectorService.detectOutcome
        .mockResolvedValueOnce({
          outcome: Outcome.WON,
          confidence: Confidence.HIGH,
          reason: "Clear purchase decision",
        })
        .mockResolvedValueOnce({
          outcome: Outcome.LOST,
          confidence: Confidence.MEDIUM,
          reason: "No follow-up scheduled",
        });

      llmService.generateJSON
        .mockResolvedValueOnce(mockExtractionResult)
        .mockResolvedValueOnce(mockExtractionResult)
        .mockResolvedValueOnce(mockComparativeResult)
        .mockResolvedValueOnce(mockPlaybookContent);

      analysisRepository.create.mockReturnValue(mockAnalysis as Analysis);
      analysisRepository.save.mockResolvedValue(mockAnalysis as Analysis);

      const result = await service.create(dto);

      expect(outcomeDetectorService.detectOutcome).toHaveBeenCalledTimes(2);
      expect(llmService.generateJSON).toHaveBeenCalled();
      expect(analysisRepository.create).toHaveBeenCalled();
      expect(analysisRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should throw UnprocessableEntityException when no transcripts processed", async () => {
      const dto = {
        transcripts: [
          { content: "Transcript 1" },
          { content: "Transcript 2" },
        ],
      };

      outcomeDetectorService.detectOutcome.mockResolvedValue({
        outcome: Outcome.WON,
        confidence: Confidence.HIGH,
        reason: "Test",
      });

      llmService.generateJSON.mockRejectedValue(new Error("LLM Error"));

      await expect(service.create(dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe("findAll", () => {
    it("should return array of analyses", async () => {
      const mockAnalyses = [mockAnalysis, mockAnalysis];
      analysisRepository.find.mockResolvedValue(mockAnalyses as Analysis[]);

      const result = await service.findAll();

      expect(result).toEqual(mockAnalyses);
      expect(analysisRepository.find).toHaveBeenCalledWith({
        order: { createdAt: "DESC" },
        take: expect.any(Number),
      });
    });
  });

  describe("findOneById", () => {
    it("should return analysis when found", async () => {
      analysisRepository.findOne.mockResolvedValue(mockAnalysis as Analysis);

      const result = await service.findOneById("test-id");

      expect(result).toEqual(mockAnalysis);
    });

    it("should throw NotFoundException when analysis not found", async () => {
      analysisRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneById("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("delete", () => {
    it("should delete analysis when found", async () => {
      analysisRepository.findOne.mockResolvedValue(mockAnalysis as Analysis);
      analysisRepository.remove.mockResolvedValue(mockAnalysis as Analysis);

      await service.delete("test-id");

      expect(analysisRepository.remove).toHaveBeenCalledWith(mockAnalysis);
    });

    it("should throw NotFoundException when analysis not found", async () => {
      analysisRepository.findOne.mockResolvedValue(null);

      await expect(service.delete("non-existent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

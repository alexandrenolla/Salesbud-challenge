import { Test, TestingModule } from "@nestjs/testing";
import { AnalysesController } from "./analyses.controller";
import { AnalysesService } from "./analyses.service";
import { AnalysisResponseDto } from "./dto/analysis-response.dto";

describe("AnalysesController", () => {
  let controller: AnalysesController;
  let service: jest.Mocked<AnalysesService>;

  const mockAnalysisResponse: AnalysisResponseDto = {
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysesController],
      providers: [
        {
          provide: AnalysesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOneById: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AnalysesController>(AnalysesController);
    service = module.get(AnalysesService);
  });

  describe("create", () => {
    it("should create an analysis", async () => {
      const dto = {
        transcripts: [
          { content: "Transcript 1" },
          { content: "Transcript 2" },
        ],
      };

      service.create.mockResolvedValue(mockAnalysisResponse);

      const result = await controller.create(dto);

      expect(result).toEqual(mockAnalysisResponse);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe("findAll", () => {
    it("should return array of analyses", async () => {
      const mockAnalyses = [mockAnalysisResponse, mockAnalysisResponse];
      service.findAll.mockResolvedValue(mockAnalyses);

      const result = await controller.findAll();

      expect(result).toEqual(mockAnalyses);
      expect(service.findAll).toHaveBeenCalled();
    });

    it("should return empty array when no analyses exist", async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should return analysis by id", async () => {
      service.findOneById.mockResolvedValue(mockAnalysisResponse);

      const result = await controller.findOne("test-id");

      expect(result).toEqual(mockAnalysisResponse);
      expect(service.findOneById).toHaveBeenCalledWith("test-id");
    });
  });

  describe("delete", () => {
    it("should delete analysis by id", async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete("test-id");

      expect(service.delete).toHaveBeenCalledWith("test-id");
    });
  });
});

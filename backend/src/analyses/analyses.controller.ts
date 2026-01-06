import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Version,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { AnalysesService } from "./analyses.service";
import { CreateAnalysisDto } from "./dto/create-analysis.dto";
import { AnalysisResponseDto } from "./dto/analysis-response.dto";
import { DeleteResult } from "typeorm";

@Controller({ path: "analyses", version: "1" })
@ApiTags("analyses")
export class AnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Post()
  @Version("1")
  @ApiOperation({ summary: "Analyze transcripts and generate playbook insights" })
  @ApiBody({ type: CreateAnalysisDto })
  @ApiResponse({
    status: 201,
    description: "Analysis created successfully",
    type: AnalysisResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data",
  })
  @ApiResponse({
    status: 422,
    description: "Failed to process transcripts",
  })
  async create(@Body() dto: CreateAnalysisDto): Promise<AnalysisResponseDto> {
    return this.analysesService.create(dto);
  }

  @Get()
  @Version("1")
  @ApiOperation({ summary: "List all analyses" })
  @ApiResponse({
    status: 200,
    description: "List of analyses",
    type: [AnalysisResponseDto],
  })
  async findAll(): Promise<AnalysisResponseDto[]> {
    return this.analysesService.findAll();
  }

  @Get("/:id")
  @Version("1")
  @ApiOperation({ summary: "Get analysis by ID" })
  @ApiParam({ name: "id", description: "Analysis UUID" })
  @ApiResponse({
    status: 200,
    description: "Analysis found",
    type: AnalysisResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Analysis not found",
  })
  async findOne(@Param("id") id: string): Promise<AnalysisResponseDto> {
    return this.analysesService.findOneById(id);
  }

  @Delete("/:id")
  @Version("1")
  @ApiOperation({ summary: "Delete analysis by ID" })
  @ApiParam({ name: "id", description: "Analysis UUID" })
  @ApiResponse({
    status: 200,
    description: "Analysis deleted successfully",
    type: DeleteResult
  })
  async delete(@Param("id") id: string): Promise<void> {
    return this.analysesService.delete(id);
  }
}

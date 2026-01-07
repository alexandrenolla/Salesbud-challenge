import {
  Controller,
  Post,
  Get,
  Param,
  Sse,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  BadRequestException,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { Observable } from "rxjs";
import { MAX_TRANSCRIPTS_COUNT } from "src/utils/constants";
import { ValidateBatchUploadsPipe } from "./pipes/validate-batch-uploads.pipe";
import { BatchUploadsService } from "./batch-uploads.service";
import { BatchUploadResponseDto } from "./dto/batch-upload-response.dto";

@Controller({ path: "batch-uploads", version: "1" })
@ApiTags("batch-uploads")
export class BatchUploadsController {
  constructor(private readonly batchUploadsService: BatchUploadsService) {}

  @Post()
  @ApiOperation({
    summary: "Upload multiple files for batch analysis",
    description: "Upload 2-20 transcript files (txt or audio) for batch processing. Returns a job ID for tracking progress via SSE.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Files to upload (2-20 files, txt or audio)",
    schema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
          minItems: 2,
          maxItems: 20,
        },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: "Batch job created, processing started",
    type: BatchUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid files or file count" })
  @UseInterceptors(
    FilesInterceptor("files", MAX_TRANSCRIPTS_COUNT, {
      storage: undefined, // Use memory storage
    }),
  )
  async createBatchUpload(
    @UploadedFiles(ValidateBatchUploadsPipe) files: Express.Multer.File[],
  ): Promise<BatchUploadResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided");
    }

    return this.batchUploadsService.createJob(files);
  }

  @Get("/:id")
  @ApiOperation({
    summary: "Get batch job status",
    description: "Retrieve current status of a batch processing job. Use SSE endpoint for real-time updates.",
  })
  @ApiParam({ name: "id", description: "Batch job UUID" })
  @ApiResponse({ status: 200, type: BatchUploadResponseDto })
  @ApiResponse({ status: 404, description: "Job not found" })
  async getJobStatus(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<BatchUploadResponseDto> {
    return this.batchUploadsService.getJobStatus(id);
  }

  @Get("/:id/events")
  @Sse()
  @ApiOperation({
    summary: "Subscribe to batch job progress events (SSE)",
    description: "Server-Sent Events stream for real-time progress updates. Events include stage changes and completion/error notifications.",
  })
  @ApiParam({ name: "id", description: "Batch job UUID" })
  @ApiResponse({
    status: 200,
    description: "SSE stream of BatchProgressEventDto",
  })
  @ApiResponse({ status: 404, description: "Job not found" })
  getJobEvents(@Param("id", ParseUUIDPipe) id: string): Observable<MessageEvent> {
    return this.batchUploadsService.getProgressStream(id);
  }
}

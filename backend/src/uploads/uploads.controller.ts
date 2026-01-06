import { Controller, Post, UseInterceptors, UploadedFile, Version } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBadRequestResponse,
} from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { UploadsService } from "./uploads.service";
import { UploadResponseDto } from "./dto/upload-response.dto";
import { ValidateUploadFilePipe } from "./pipes/validate-upload-file.pipe";
import { ErrorBadRequestDto } from "src/utils/errors-dto";

@Controller({ path: "uploads", version: "1" })
@ApiTags("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @Version("1")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  @ApiOperation({ summary: "Upload transcript file and detect outcome" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: ".txt file with transcript",
        },
      },
      required: ["file"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "File processed successfully",
    type: UploadResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid file or content",
    type: ErrorBadRequestDto,
  })
  async upload(
    @UploadedFile(ValidateUploadFilePipe) file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    return this.uploadsService.processUpload(file);
  }
}

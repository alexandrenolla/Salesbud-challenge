import { Controller, Get, Param, Res, StreamableFile, Version } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";
import { Response } from "express";
import { FilesService } from "./files.service";

@Controller({ path: "files", version: "1" })
@ApiTags("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @Version("1")
  @ApiOperation({ summary: "List all uploaded files" })
  @ApiResponse({ status: 200, description: "List of files" })
  async findAll() {
    return this.filesService.findAll();
  }

  @Get("/download/:id")
  @Version("1")
  @ApiOperation({ summary: "Download file by ID" })
  @ApiParam({ name: "id", description: "File UUID" })
  @ApiResponse({ status: 200, description: "File content" })
  @ApiResponse({ status: 404, description: "File not found" })
  async download(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { file, buffer } = await this.filesService.getFileContentById(id);

    res.set({
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${file.originalFilename}"`,
      "Content-Length": file.size,
    });

    return new StreamableFile(buffer);
  }
}

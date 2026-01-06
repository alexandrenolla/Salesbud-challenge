import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import * as path from "path";
import { MAX_FILE_SIZE, ALLOWED_FILE_EXTENSIONS } from "src/utils/constants";

@Injectable()
export class ValidateUploadFilePipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Only ${ALLOWED_FILE_EXTENSIONS.join(", ")} files are allowed`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    return file;
  }
}

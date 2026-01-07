import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import * as path from "path";
import {
  MAX_FILE_SIZE,
  MAX_AUDIO_FILE_SIZE,
  ALLOWED_AUDIO_EXTENSIONS,
  ALL_ALLOWED_EXTENSIONS,
} from "src/utils/constants";

@Injectable()
export class ValidateUploadFilePipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALL_ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Only ${ALL_ALLOWED_EXTENSIONS.join(", ")} files are allowed`,
      );
    }

    const isAudio = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
    const maxSize = isAudio ? MAX_AUDIO_FILE_SIZE : MAX_FILE_SIZE;

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size for ${isAudio ? "audio" : "text"} files: ${maxSize / 1024 / 1024}MB`,
      );
    }

    return file;
  }
}

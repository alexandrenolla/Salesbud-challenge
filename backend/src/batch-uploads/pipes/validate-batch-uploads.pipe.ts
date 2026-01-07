import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import {
  MAX_FILE_SIZE,
  MAX_AUDIO_FILE_SIZE,
  ALL_ALLOWED_EXTENSIONS,
  MIN_TRANSCRIPTS_COUNT,
  MAX_TRANSCRIPTS_COUNT,
} from "src/utils/constants";
import { getFileExtension, isAudioFile } from "src/utils/helpers";

@Injectable()
export class ValidateBatchUploadsPipe implements PipeTransform {
  transform(files: Express.Multer.File[]): Express.Multer.File[] {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files uploaded");
    }

    if (files.length < MIN_TRANSCRIPTS_COUNT) {
      throw new BadRequestException(
        `Minimum ${MIN_TRANSCRIPTS_COUNT} files required for comparative analysis`,
      );
    }

    if (files.length > MAX_TRANSCRIPTS_COUNT) {
      throw new BadRequestException(
        `Maximum ${MAX_TRANSCRIPTS_COUNT} files allowed per batch`,
      );
    }

    for (const file of files) {
      const ext = getFileExtension(file.originalname);

      if (!ALL_ALLOWED_EXTENSIONS.includes(ext)) {
        throw new BadRequestException(
          `File "${file.originalname}": Only ${ALL_ALLOWED_EXTENSIONS.join(", ")} files are allowed`,
        );
      }

      const isAudio = isAudioFile(file.originalname);
      const maxSize = isAudio ? MAX_AUDIO_FILE_SIZE : MAX_FILE_SIZE;

      if (file.size > maxSize) {
        throw new BadRequestException(
          `File "${file.originalname}" too large. Maximum size for ${isAudio ? "audio" : "text"} files: ${maxSize / 1024 / 1024}MB`,
        );
      }
    }

    return files;
  }
}

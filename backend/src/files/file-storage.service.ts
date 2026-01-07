import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

interface SaveFileResult {
  key: string;
  url: string;
  size: number;
}

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly storagePath: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.storagePath = this.configService.get<string>("STORAGE_PATH") || "/app/storage";
    this.baseUrl = this.configService.get<string>("STORAGE_BASE_URL") || "/api/v1/files";
  }

  async saveFile(
    buffer: Buffer,
    originalFilename: string,
  ): Promise<SaveFileResult> {
    const dateFolder = this.getDateFolder();
    const uniqueFilename = this.generateUniqueFilename(originalFilename);
    const key = `uploads/${dateFolder}/${uniqueFilename}`;
    const absolutePath = path.join(this.storagePath, key);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);

    this.logger.log(`File saved: ${key} (${buffer.length} bytes)`);

    return {
      key,
      url: `${this.baseUrl}/${key}`,
      size: buffer.length,
    };
  }

  async getFile(key: string): Promise<Buffer> {
    const absolutePath = path.join(this.storagePath, key);

    try {
      return await fs.readFile(absolutePath);
    } catch {
      throw new NotFoundException(`File not found: ${key}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    const absolutePath = path.join(this.storagePath, key);

    try {
      await fs.unlink(absolutePath);
      this.logger.log(`File deleted: ${key}`);
    } catch {
      this.logger.warn(`Failed to delete file: ${key}`);
    }
  }

  private getDateFolder(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private generateUniqueFilename(originalFilename: string): string {
    const ext = path.extname(originalFilename);
    const baseName = path
      .basename(originalFilename, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .substring(0, 50);
    return `${uuidv4().substring(0, 8)}-${baseName}${ext}`;
  }
}

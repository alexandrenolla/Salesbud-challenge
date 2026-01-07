import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FileStorageService } from "./file-storage.service";
import { FileStatus } from "./enums";
import { File } from "./entities/file.entity";

interface CreateFileOptions {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  batchJobId?: string;
}

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async create(options: CreateFileOptions): Promise<File> {
    const { key, url, size } = await this.fileStorageService.saveFile(
      options.buffer,
      options.originalFilename,
    );

    const file = this.fileRepository.create({
      key,
      originalFilename: options.originalFilename,
      mimeType: options.mimeType,
      size,
      url,
      status: FileStatus.UPLOADED,
      batchJobId: options.batchJobId,
    });

    return this.fileRepository.save(file);
  }

  async findAll(): Promise<File[]> {
    return this.fileRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async findByKey(key: string): Promise<File> {
    const file = await this.fileRepository.findOne({ where: { key } });
    if (!file) {
      throw new NotFoundException(`File with key ${key} not found`);
    }
    return file;
  }

  async findByBatchJobId(batchJobId: string): Promise<File[]> {
    return this.fileRepository.find({ where: { batchJobId } });
  }

  async getFileContent(key: string): Promise<{ file: File; buffer: Buffer }> {
    const file = await this.findByKey(key);
    const buffer = await this.fileStorageService.getFile(key);
    return { file, buffer };
  }

  async getFileContentById(id: string): Promise<{ file: File; buffer: Buffer }> {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    const buffer = await this.fileStorageService.getFile(file.key);
    return { file, buffer };
  }

  async delete(id: string): Promise<void> {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    await this.fileStorageService.deleteFile(file.key);
    file.status = FileStatus.DELETED;
    await this.fileRepository.save(file);
  }
}

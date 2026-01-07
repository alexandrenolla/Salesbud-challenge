import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { FilesService } from "./files.service";
import { File } from "./entities/file.entity";
import { FileStorageService } from "./file-storage.service";
import { FileStatus } from "./enums";

describe("FilesService", () => {
  let service: FilesService;
  let fileRepository: jest.Mocked<Repository<File>>;
  let fileStorageService: jest.Mocked<FileStorageService>;

  const mockFile: Partial<File> = {
    id: "file-123",
    key: "uploads/file-123.txt",
    originalFilename: "test.txt",
    mimeType: "text/plain",
    size: 1024,
    url: "https://storage.example.com/uploads/file-123.txt",
    status: FileStatus.UPLOADED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: getRepositoryToken(File),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: FileStorageService,
          useValue: {
            saveFile: jest.fn(),
            getFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    fileRepository = module.get(getRepositoryToken(File));
    fileStorageService = module.get(FileStorageService);
  });

  describe("create", () => {
    it("should create and save a file", async () => {
      const options = {
        buffer: Buffer.from("file content"),
        originalFilename: "test.txt",
        mimeType: "text/plain",
        batchJobId: "job-123",
      };

      fileStorageService.saveFile.mockResolvedValue({
        key: "uploads/file-123.txt",
        url: "https://storage.example.com/uploads/file-123.txt",
        size: 1024,
      });

      fileRepository.create.mockReturnValue(mockFile as File);
      fileRepository.save.mockResolvedValue(mockFile as File);

      const result = await service.create(options);

      expect(result).toEqual(mockFile);
      expect(fileStorageService.saveFile).toHaveBeenCalledWith(
        options.buffer,
        options.originalFilename,
      );
      expect(fileRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: "uploads/file-123.txt",
          originalFilename: "test.txt",
          mimeType: "text/plain",
          status: FileStatus.UPLOADED,
        }),
      );
    });
  });

  describe("findAll", () => {
    it("should return all files ordered by createdAt DESC", async () => {
      const files = [mockFile, { ...mockFile, id: "file-456" }];
      fileRepository.find.mockResolvedValue(files as File[]);

      const result = await service.findAll();

      expect(result).toEqual(files);
      expect(fileRepository.find).toHaveBeenCalledWith({
        order: { createdAt: "DESC" },
      });
    });
  });

  describe("findByKey", () => {
    it("should return file when found", async () => {
      fileRepository.findOne.mockResolvedValue(mockFile as File);

      const result = await service.findByKey("uploads/file-123.txt");

      expect(result).toEqual(mockFile);
      expect(fileRepository.findOne).toHaveBeenCalledWith({
        where: { key: "uploads/file-123.txt" },
      });
    });

    it("should throw NotFoundException when file not found", async () => {
      fileRepository.findOne.mockResolvedValue(null);

      await expect(service.findByKey("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findByBatchJobId", () => {
    it("should return files by batch job id", async () => {
      const files = [mockFile, { ...mockFile, id: "file-456" }];
      fileRepository.find.mockResolvedValue(files as File[]);

      const result = await service.findByBatchJobId("job-123");

      expect(result).toEqual(files);
      expect(fileRepository.find).toHaveBeenCalledWith({
        where: { batchJobId: "job-123" },
      });
    });
  });

  describe("getFileContent", () => {
    it("should return file and its content", async () => {
      const buffer = Buffer.from("file content");
      fileRepository.findOne.mockResolvedValue(mockFile as File);
      fileStorageService.getFile.mockResolvedValue(buffer);

      const result = await service.getFileContent("uploads/file-123.txt");

      expect(result.file).toEqual(mockFile);
      expect(result.buffer).toEqual(buffer);
      expect(fileStorageService.getFile).toHaveBeenCalledWith(
        "uploads/file-123.txt",
      );
    });

    it("should throw NotFoundException when file not found", async () => {
      fileRepository.findOne.mockResolvedValue(null);

      await expect(service.getFileContent("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getFileContentById", () => {
    it("should return file content by id", async () => {
      const buffer = Buffer.from("file content");
      fileRepository.findOne.mockResolvedValue(mockFile as File);
      fileStorageService.getFile.mockResolvedValue(buffer);

      const result = await service.getFileContentById("file-123");

      expect(result.file).toEqual(mockFile);
      expect(result.buffer).toEqual(buffer);
    });

    it("should throw NotFoundException when file not found", async () => {
      fileRepository.findOne.mockResolvedValue(null);

      await expect(service.getFileContentById("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("delete", () => {
    it("should delete file from storage and mark as deleted", async () => {
      fileRepository.findOne.mockResolvedValue(mockFile as File);
      fileStorageService.deleteFile.mockResolvedValue(undefined);
      fileRepository.save.mockResolvedValue({
        ...mockFile,
        status: FileStatus.DELETED,
      } as File);

      await service.delete("file-123");

      expect(fileStorageService.deleteFile).toHaveBeenCalledWith(mockFile.key);
      expect(fileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: FileStatus.DELETED,
        }),
      );
    });

    it("should throw NotFoundException when file not found", async () => {
      fileRepository.findOne.mockResolvedValue(null);

      await expect(service.delete("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

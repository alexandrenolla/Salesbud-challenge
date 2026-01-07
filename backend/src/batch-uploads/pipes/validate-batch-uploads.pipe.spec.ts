import { BadRequestException } from "@nestjs/common";
import { ValidateBatchUploadsPipe } from "./validate-batch-uploads.pipe";

describe("ValidateBatchUploadsPipe", () => {
  let pipe: ValidateBatchUploadsPipe;

  const createMockFile = (
    name: string,
    size: number,
  ): Express.Multer.File => ({
    fieldname: "files",
    originalname: name,
    encoding: "utf-8",
    mimetype: "text/plain",
    size,
    buffer: Buffer.alloc(size),
    destination: "",
    filename: name,
    path: "",
    stream: null as never,
  });

  beforeEach(() => {
    pipe = new ValidateBatchUploadsPipe();
  });

  describe("transform", () => {
    it("should pass valid files through", () => {
      const files = [
        createMockFile("file1.txt", 1000),
        createMockFile("file2.txt", 1000),
      ];

      const result = pipe.transform(files);

      expect(result).toEqual(files);
    });

    it("should throw BadRequestException when no files uploaded", () => {
      expect(() => pipe.transform([])).toThrow(BadRequestException);
      expect(() => pipe.transform([])).toThrow("No files uploaded");
    });

    it("should throw BadRequestException when files is null/undefined", () => {
      expect(() => pipe.transform(null as never)).toThrow(BadRequestException);
      expect(() => pipe.transform(undefined as never)).toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when less than minimum files", () => {
      const files = [createMockFile("file1.txt", 1000)];

      expect(() => pipe.transform(files)).toThrow(BadRequestException);
      expect(() => pipe.transform(files)).toThrow(
        /Minimum \d+ files required/,
      );
    });

    it("should throw BadRequestException when more than maximum files", () => {
      const files = Array(21)
        .fill(null)
        .map((_, i) => createMockFile(`file${i}.txt`, 1000));

      expect(() => pipe.transform(files)).toThrow(BadRequestException);
      expect(() => pipe.transform(files)).toThrow(
        /Maximum \d+ files allowed/,
      );
    });

    it("should throw BadRequestException for invalid file extension", () => {
      const files = [
        createMockFile("file1.txt", 1000),
        createMockFile("file2.pdf", 1000),
      ];

      expect(() => pipe.transform(files)).toThrow(BadRequestException);
      expect(() => pipe.transform(files)).toThrow(
        /Only .+? files are allowed/,
      );
    });

    it("should throw BadRequestException when text file exceeds size limit", () => {
      const files = [
        createMockFile("file1.txt", 1000),
        createMockFile("file2.txt", 6 * 1024 * 1024), // 6MB > 5MB limit
      ];

      expect(() => pipe.transform(files)).toThrow(BadRequestException);
      expect(() => pipe.transform(files)).toThrow(/too large/);
    });

    it("should throw BadRequestException when audio file exceeds size limit", () => {
      const files = [
        createMockFile("file1.txt", 1000),
        createMockFile("audio.mp3", 30 * 1024 * 1024), // 30MB > 25MB limit
      ];

      expect(() => pipe.transform(files)).toThrow(BadRequestException);
      expect(() => pipe.transform(files)).toThrow(/too large/);
    });

    it("should accept valid audio files", () => {
      const files = [
        createMockFile("file1.txt", 1000),
        createMockFile("audio.mp3", 1000),
      ];

      const result = pipe.transform(files);

      expect(result).toEqual(files);
    });

    it("should accept all valid audio extensions", () => {
      const validExtensions = [".mp3", ".wav", ".m4a"];

      for (const ext of validExtensions) {
        const files = [
          createMockFile("file1.txt", 1000),
          createMockFile(`audio${ext}`, 1000),
        ];

        expect(() => pipe.transform(files)).not.toThrow();
      }
    });

    it("should handle case-insensitive extensions", () => {
      const files = [
        createMockFile("file1.TXT", 1000),
        createMockFile("audio.MP3", 1000),
      ];

      const result = pipe.transform(files);

      expect(result).toEqual(files);
    });
  });
});

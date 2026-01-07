import { useRef, DragEvent, useState } from "react";
import { Upload, FileText, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFileExtension, isAudioFile } from "@/lib/helpers";
import { FILE_UPLOAD, VALIDATION } from "@/constants/validation";

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
  fileCount?: number;
}

export function DropZone({ onFilesAdded, disabled = false, fileCount = 0 }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = [];
    const allowedExtensions: readonly string[] = FILE_UPLOAD.ALLOWED_EXTENSIONS;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = getFileExtension(file.name);
      const isAllowed = allowedExtensions.includes(ext);

      if (!isAllowed) continue;

      const maxSize = isAudioFile(file.name)
        ? FILE_UPLOAD.MAX_AUDIO_SIZE_BYTES
        : FILE_UPLOAD.MAX_TEXT_SIZE_BYTES;

      if (file.size > maxSize) continue;

      validFiles.push(file);
    }

    return validFiles.slice(0, VALIDATION.MAX_TRANSCRIPTS_COUNT - fileCount);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesAdded(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = validateFiles(e.target.files);
      if (files.length > 0) {
        onFilesAdded(files);
      }
    }
    e.target.value = "";
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200",
        isDragOver && !disabled && "border-primary-400 bg-primary-50 scale-[1.02]",
        !isDragOver && !disabled && "border-gray-300 hover:border-primary-300 hover:bg-gray-50",
        disabled && "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50",
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={FILE_UPLOAD.ALLOWED_EXTENSIONS.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "flex items-center justify-center w-16 h-16 rounded-full transition-colors",
            isDragOver ? "bg-primary-100" : "bg-gray-100",
          )}
        >
          <Upload
            className={cn(
              "w-8 h-8 transition-all",
              isDragOver ? "text-primary-600 animate-bounce" : "text-gray-400",
            )}
          />
        </div>

        <div>
          <p className={cn(
            "text-xl font-semibold transition-colors",
            isDragOver ? "text-primary-700" : "text-gray-700",
          )}>
            {isDragOver ? "Solte os arquivos aqui" : "Arraste arquivos aqui"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            ou clique para selecionar
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            .txt
          </span>
          <span className="flex items-center gap-1">
            <Music className="w-3.5 h-3.5" />
            .mp3, .wav, .m4a
          </span>
        </div>

        <p className="text-xs text-gray-400">
          Mín. {VALIDATION.MIN_TRANSCRIPTS_COUNT}, máx. {VALIDATION.MAX_TRANSCRIPTS_COUNT} arquivos
        </p>
        <p className="text-sm text-gray-500 mt-3">
          Compare reuniões ganhas e perdidas para descobrir padrões
        </p>
      </div>
    </div>
  );
}

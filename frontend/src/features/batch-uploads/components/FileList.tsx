import { FileText, Music, CheckCircle, Loader2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/helpers";
import { FileItem } from "../types";

interface FileListProps {
  files: FileItem[];
  onRemove?: (fileId: string) => void;
  canRemove?: boolean;
}

export function FileList({ files, onRemove, canRemove = true }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className={cn(
            "flex items-center justify-between p-3 rounded-lg border transition-all",
            file.status === "done" && "bg-green-50 border-green-200",
            file.status === "processing" && "bg-blue-50 border-blue-200",
            file.status === "error" && "bg-red-50 border-red-200",
            file.status === "pending" && "bg-gray-50 border-gray-200",
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* File type icon */}
            <div
              className={cn(
                "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full",
                file.isAudio ? "bg-purple-100" : "bg-blue-100",
              )}
            >
              {file.isAudio ? (
                <Music className="w-4 h-4 text-purple-600" />
              ) : (
                <FileText className="w-4 h-4 text-blue-600" />
              )}
            </div>

            {/* File name and size */}
            <span className="text-sm font-medium text-gray-700 truncate">
              {file.name}
            </span>
            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
              {formatFileSize(file.file.size)}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status indicator */}
            {file.status === "done" && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {file.status === "processing" && (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            )}
            {file.status === "error" && (
              <div className="flex items-center gap-1">
                <XCircle className="w-5 h-5 text-red-500" />
                {file.error && (
                  <span className="text-xs text-red-600 max-w-[150px] truncate" title={file.error}>
                    {file.error}
                  </span>
                )}
              </div>
            )}
            {file.status === "pending" && (
              <span className="text-xs text-gray-400">Aguardando</span>
            )}

            {/* Remove button */}
            {canRemove && onRemove && file.status === "pending" && (
              <button
                onClick={() => onRemove(file.id)}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                aria-label={`Remover ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

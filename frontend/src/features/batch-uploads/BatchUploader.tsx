import { useEffect } from "react";
import { Sparkles, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components";
import { AnalysisResult } from "@/types";
import { VALIDATION } from "@/constants/validation";
import { useBatchUpload } from "./hooks";
import { DropZone, FileList, StageProgress } from "./components";

interface BatchUploaderProps {
  onComplete: (result: AnalysisResult) => void;
}

export function BatchUploader({ onComplete }: BatchUploaderProps) {
  const {
    files,
    state,
    progress,
    error,
    result,
    addFiles,
    removeFile,
    startUpload,
    reset,
  } = useBatchUpload();

  // Handle completion via useEffect to avoid side effects during render
  useEffect(() => {
    if (result) {
      onComplete(result);
    }
  }, [result, onComplete]);

  // Don't render anything once we have a result (parent will handle navigation)
  if (result) {
    return null;
  }

  const canSubmit = files.length >= VALIDATION.MIN_TRANSCRIPTS_COUNT;
  const isAtLimit = files.length >= VALIDATION.MAX_TRANSCRIPTS_COUNT;
  const isProcessing = state === "uploading" || state === "processing";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-2xl font-medium text-gray-700">
          Envie transcrições ou áudios das suas reuniões de vendas
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="ghost" size="sm" onClick={reset} className="mt-2">
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Main content based on state */}
      {state === "idle" && (
        <>
          <DropZone
            onFilesAdded={addFiles}
            disabled={isAtLimit}
            fileCount={files.length}
          />

          {isAtLimit && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                Limite de {VALIDATION.MAX_TRANSCRIPTS_COUNT} arquivos atingido
              </p>
            </div>
          )}

          {files.length > 0 && (
            <>
              {/* File count indicator */}
              <div className="bg-white rounded-xl p-4 shadow-card border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Arquivos selecionados
                  </span>
                  <span className="text-sm text-gray-500">
                    {files.length} {files.length === 1 ? "arquivo" : "arquivos"} • mín. {VALIDATION.MIN_TRANSCRIPTS_COUNT}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min((files.length / VALIDATION.MIN_TRANSCRIPTS_COUNT) * 100, 100)}%`,
                    }}
                  />
                </div>
                {canSubmit && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Pronto para análise!
                  </p>
                )}
              </div>

              <FileList files={files} onRemove={removeFile} canRemove={true} />

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="secondary" onClick={reset}>
                  <RotateCcw className="w-4 h-4" />
                  Limpar
                </Button>

                <Button onClick={startUpload} disabled={!canSubmit} size="lg">
                  <Sparkles className="w-4 h-4" />
                  Gerar Playbook
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {isProcessing && (
        <>
          <StageProgress progress={progress} />
          <FileList files={files} canRemove={false} />
        </>
      )}
    </div>
  );
}

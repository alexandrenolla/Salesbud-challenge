import { useState, useRef, DragEvent } from "react";
import { Plus, Trash2, Send, Upload, FileText, CheckCircle, Music, Loader2 } from "lucide-react";
import { Button, Card } from "@/components";
import { TranscriptInput } from "@/types";
import { uploadTranscript } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { VALIDATION, FILE_UPLOAD } from "@/constants/validation";
import type { TranscriptDraft } from "./types";

interface TranscriptUploaderProps {
  onAnalyze: (transcripts: TranscriptInput[]) => void;
  isLoading: boolean;
}

export function TranscriptUploader({ onAnalyze, isLoading }: TranscriptUploaderProps) {
  const toast = useToast();
  const [transcripts, setTranscripts] = useState<TranscriptDraft[]>([
    { id: "1", content: "" },
  ]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const isAudioFile = (filename: string): boolean => {
    return FILE_UPLOAD.AUDIO_EXTENSIONS.some((ext) =>
      filename.toLowerCase().endsWith(ext)
    );
  };

  const getMaxFileSize = (filename: string): number => {
    return isAudioFile(filename)
      ? FILE_UPLOAD.MAX_AUDIO_SIZE_BYTES
      : FILE_UPLOAD.MAX_TEXT_SIZE_BYTES;
  };

  const addTranscript = () => {
    setTranscripts([
      ...transcripts,
      { id: Date.now().toString(), content: "" },
    ]);
  };

  const removeTranscript = (id: string) => {
    if (transcripts.length > 1) {
      setTranscripts(transcripts.filter((t) => t.id !== id));
    }
  };

  const updateContent = (id: string, content: string) => {
    setTranscripts(
      transcripts.map((t) =>
        t.id === id
          ? { ...t, content, filename: content.trim() ? t.filename : undefined }
          : t
      )
    );
  };

  const handleFileUpload = async (id: string, file: File) => {
    const isAllowedExtension = FILE_UPLOAD.ALLOWED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    if (!isAllowedExtension) {
      toast.error(
        `Formatos permitidos: ${FILE_UPLOAD.ALLOWED_EXTENSIONS.join(", ")}`
      );
      return;
    }

    const maxSize = getMaxFileSize(file.name);
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`);
      return;
    }

    const isAudio = isAudioFile(file.name);
    setUploadingId(id);
    if (isAudio) {
      setTranscribingId(id);
    }

    try {
      const result = await uploadTranscript(file);
      setTranscripts(
        transcripts.map((t) =>
          t.id === id
            ? {
                ...t,
                content: result.content,
                filename: result.filename,
                isAudio,
                isTranscribed: result.isTranscribed,
              }
            : t
        )
      );
      if (isAudio) {
        toast.success("Áudio transcrito com sucesso!");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao fazer upload");
    } finally {
      setUploadingId(null);
      setTranscribingId(null);
    }
  };

  const handleFileInputChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(id, file);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(id);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(id, file);
    }
  };

  const isTranscriptValid = (transcript: TranscriptDraft) =>
    transcript.content.trim().length >= VALIDATION.MIN_TRANSCRIPT_LENGTH;

  const handleSubmit = () => {
    const validTranscripts = transcripts.filter(isTranscriptValid);
    if (validTranscripts.length >= VALIDATION.MIN_TRANSCRIPTS_COUNT) {
      onAnalyze(validTranscripts.map(({ content }) => ({ content })));
    }
  };

  const validCount = transcripts.filter(isTranscriptValid).length;
  const canSubmit = validCount >= VALIDATION.MIN_TRANSCRIPTS_COUNT;
  const progressPercentage = (validCount / Math.max(transcripts.length, VALIDATION.MIN_TRANSCRIPTS_COUNT)) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Adicionar Transcrições</h2>
        <p className="mt-2 text-gray-600">
          Cole as transcrições, faça upload de arquivos .txt ou áudio (.mp3, .wav, .m4a).
          Mínimo de {VALIDATION.MIN_TRANSCRIPTS_COUNT} transcrições ({VALIDATION.MIN_TRANSCRIPT_LENGTH}+
          caracteres cada).
        </p>
      </div>

      {/* Progress indicator */}
      <div className="bg-white rounded-xl p-4 shadow-card border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progresso</span>
          <span className="text-sm text-gray-500">
            {validCount} de {VALIDATION.MIN_TRANSCRIPTS_COUNT} transcrições válidas
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        {canSubmit && (
          <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Pronto para análise!
          </p>
        )}
      </div>

      {/* Transcript cards */}
      <div className="space-y-4">
        {transcripts.map((transcript, index) => {
          const valid = isTranscriptValid(transcript);
          const isDragOver = dragOverId === transcript.id;

          return (
            <Card key={transcript.id} animate={false}>
              <div className="space-y-4">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                        valid
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {valid ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">
                        Transcrição #{index + 1}
                      </label>
                      {transcript.filename && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          {transcript.isAudio ? (
                            <Music className="w-3 h-3 text-purple-500" />
                          ) : (
                            <FileText className="w-3 h-3" />
                          )}
                          {transcript.filename}
                          {transcript.isTranscribed && (
                            <span className="text-purple-500">(transcrito)</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  {transcripts.length > 1 && (
                    <button
                      onClick={() => removeTranscript(transcript.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      aria-label={`Remover transcrição ${index + 1}`}
                      title="Remover transcrição"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Textarea with drag & drop */}
                <div
                  className={`relative rounded-lg border-2 transition-all ${
                    isDragOver
                      ? "border-primary-400 bg-primary-50"
                      : "border-dashed border-gray-200 focus-within:border-solid focus-within:border-primary-400"
                  }`}
                  onDragOver={(e) => handleDragOver(e, transcript.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, transcript.id)}
                >
                  {isDragOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary-50/90 rounded-lg z-10">
                      <Upload className="w-8 h-8 text-primary-500 animate-bounce mb-2" />
                      <p className="text-sm font-medium text-primary-600">
                        Solte o arquivo aqui
                      </p>
                    </div>
                  )}
                  {transcribingId === transcript.id && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-50/90 rounded-lg z-10">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
                      <p className="text-sm font-medium text-purple-600">
                        Transcrevendo áudio...
                      </p>
                      <p className="text-xs text-purple-400 mt-1">
                        Isso pode levar alguns segundos
                      </p>
                    </div>
                  )}
                  <textarea
                    value={transcript.content}
                    onChange={(e) => updateContent(transcript.id, e.target.value)}
                    placeholder="Cole a transcrição ou arraste um arquivo (.txt ou áudio)..."
                    rows={6}
                    className="w-full px-4 py-3 bg-transparent border-none rounded-lg resize-none outline-none placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                {/* Character count and upload button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium ${
                        valid
                          ? "text-green-600"
                          : transcript.content.length > 0
                          ? "text-amber-600"
                          : "text-gray-400"
                      }`}
                    >
                      {transcript.content.length} caracteres
                      {!valid && ` (mínimo: ${VALIDATION.MIN_TRANSCRIPT_LENGTH})`}
                    </span>
                    {valid && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".txt,.mp3,.wav,.m4a"
                      ref={(el) => (fileInputRefs.current[transcript.id] = el)}
                      onChange={(e) => handleFileInputChange(transcript.id, e)}
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRefs.current[transcript.id]?.click()}
                      disabled={uploadingId === transcript.id}
                      isLoading={uploadingId === transcript.id}
                    >
                      <Upload className="w-4 h-4" />
                      Upload arquivo
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="secondary" onClick={addTranscript}>
          <Plus className="w-4 h-4" />
          Adicionar Transcrição
        </Button>

        <Button onClick={handleSubmit} disabled={!canSubmit} isLoading={isLoading} size="lg">
          <Send className="w-4 h-4" />
          Analisar Transcrições
        </Button>
      </div>
    </div>
  );
}

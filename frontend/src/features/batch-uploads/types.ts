// Mirrors backend enums
export enum BatchStage {
  UPLOADING = "uploading",
  TRANSCRIBING = "transcribing",
  DETECTING = "detecting",
  ANALYZING = "analyzing",
  GENERATING = "generating",
  DONE = "done",
}

export enum BatchStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface BatchProgressEvent {
  stage: BatchStage;
  current: number;
  total: number;
  message: string;
  analysisId?: string;
  error?: string;
}

export interface BatchFileInfo {
  filename: string;
  isAudio: boolean;
  processed: boolean;
  error?: string;
}

export interface BatchJobResponse {
  jobId: string;
  status: BatchStatus;
  currentStage?: BatchStage;
  totalFiles: number;
  processedFiles: number;
  files?: BatchFileInfo[];
  analysisId?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

// Local UI state
export interface FileItem {
  id: string;
  file: File;
  name: string;
  isAudio: boolean;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
}

export type BatchUploaderState = "idle" | "uploading" | "processing" | "complete" | "error";

export const STAGE_LABELS: Record<BatchStage, { label: string }> = {
  [BatchStage.UPLOADING]: { label: "Processando arquivos" },
  [BatchStage.TRANSCRIBING]: { label: "Transcrevendo" },
  [BatchStage.DETECTING]: { label: "Detectando outcomes" },
  [BatchStage.ANALYZING]: { label: "Analisando padrões" },
  [BatchStage.GENERATING]: { label: "Gerando playbook" },
  [BatchStage.DONE]: { label: "Concluído" },
};

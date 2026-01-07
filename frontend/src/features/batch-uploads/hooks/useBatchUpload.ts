import { useState, useCallback, useRef } from "react";
import { createBatchUpload, getAnalysis } from "@/lib/api";
import { getErrorMessage, isAudioFile } from "@/lib/helpers";
import { MESSAGES } from "@/constants/validation";
import { AnalysisResult } from "@/types";
import { useJobProgress } from "./useJobProgress";
import {
  BatchProgressEvent,
  BatchStage,
  BatchUploaderState,
  FileItem,
} from "../types";

interface UseBatchUploadReturn {
  files: FileItem[];
  state: BatchUploaderState;
  progress: BatchProgressEvent | null;
  error: string | null;
  result: AnalysisResult | null;
  addFiles: (newFiles: File[]) => void;
  removeFile: (fileId: string) => void;
  startUpload: () => Promise<void>;
  reset: () => void;
}

export function useBatchUpload(): UseBatchUploadReturn {
  const fileIdRef = useRef(0);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [state, setState] = useState<BatchUploaderState>("idle");
  const [progress, setProgress] = useState<BatchProgressEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleProgress = useCallback((event: BatchProgressEvent) => {
    setProgress(event);

    // Update file statuses based on progress
    if (event.stage === BatchStage.TRANSCRIBING || event.stage === BatchStage.UPLOADING) {
      setFiles((prev) =>
        prev.map((file, index) => {
          if (index < event.current) {
            return { ...file, status: "done" };
          }
          if (index === event.current - 1) {
            return { ...file, status: "processing" };
          }
          return file;
        }),
      );
    }

    if (event.stage === BatchStage.DETECTING || event.stage === BatchStage.ANALYZING) {
      setState("processing");
      setFiles((prev) => prev.map((file) => ({ ...file, status: "done" })));
    }
  }, []);

  const handleComplete = useCallback(async (analysisId: string) => {
    try {
      const analysisResult = await getAnalysis(analysisId);
      setResult(analysisResult);
      setState("complete");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch analysis result"));
      setState("error");
    }
  }, []);

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setState("error");
  }, []);

  useJobProgress({
    jobId,
    onProgress: handleProgress,
    onComplete: handleComplete,
    onError: handleError,
  });

  const addFiles = useCallback((newFiles: File[]) => {
    const fileItems: FileItem[] = newFiles.map((file) => ({
      id: `file-${++fileIdRef.current}`,
      file,
      name: file.name,
      isAudio: isAudioFile(file.name),
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...fileItems]);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const startUpload = useCallback(async () => {
    if (files.length < 2) {
      setError(MESSAGES.MIN_FILES_REQUIRED);
      return;
    }

    setState("uploading");
    setError(null);
    setProgress(null);

    try {
      const response = await createBatchUpload(files.map((f) => f.file));
      setJobId(response.jobId);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to start upload"));
      setState("error");
    }
  }, [files]);

  const reset = useCallback(() => {
    setFiles([]);
    setState("idle");
    setProgress(null);
    setError(null);
    setResult(null);
    setJobId(null);
  }, []);

  return {
    files,
    state,
    progress,
    error,
    result,
    addFiles,
    removeFile,
    startUpload,
    reset,
  };
}

import axios from "axios";
import { TranscriptInput, AnalysisResult } from "@/types";
import { BatchJobResponse } from "@/features/batch-uploads/types";

export const API_BASE_URL = "/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Error interceptor - extract message from NestJS error response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "An error occurred";
    return Promise.reject(new Error(message));
  },
);

export async function createAnalysis(
  transcripts: TranscriptInput[],
): Promise<AnalysisResult> {
  const { data } = await api.post<AnalysisResult>("/analyses", { transcripts });
  return data;
}

export async function getAnalysis(id: string): Promise<AnalysisResult> {
  const { data } = await api.get<AnalysisResult>(`/analyses/${id}`);
  return data;
}

// Batch Upload API
export async function createBatchUpload(files: File[]): Promise<BatchJobResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const { data } = await api.post<BatchJobResponse>("/batch-uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

export function getBatchUploadEventsUrl(jobId: string): string {
  return `${API_BASE_URL}/batch-uploads/${jobId}/events`;
}

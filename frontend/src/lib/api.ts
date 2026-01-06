import axios from "axios";
import { TranscriptInput, AnalysisResult, UploadResult } from "@/types";

const api = axios.create({
  baseURL: "/api/v1",
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

export async function uploadTranscript(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<UploadResult>("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

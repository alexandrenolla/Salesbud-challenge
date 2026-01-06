import { useState, useCallback } from "react";
import { TranscriptInput } from "@/types";
import { createAnalysis } from "@/lib/api";
import type { AnalysisResult } from "./types";

interface UseAnalysisReturn {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  analyze: (transcripts: TranscriptInput[]) => Promise<void>;
  reset: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (transcripts: TranscriptInput[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await createAnalysis(transcripts);
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, analyze, reset };
}

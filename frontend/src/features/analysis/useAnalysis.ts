import { useState } from "react";
import { TranscriptInput, AnalysisResult } from "@/types";
import { createAnalysis } from "@/lib/api";
import { getErrorMessage } from "@/lib/helpers";

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

  const analyze = async (transcripts: TranscriptInput[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await createAnalysis(transcripts);
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { result, isLoading, error, analyze, reset };
}

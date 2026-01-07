import { useEffect, useRef, useCallback } from "react";
import { getBatchUploadEventsUrl } from "@/lib/api";
import { SSE, MESSAGES } from "@/constants/validation";
import { BatchProgressEvent, BatchStage } from "../types";

interface UseJobProgressOptions {
  jobId: string | null;
  onProgress: (event: BatchProgressEvent) => void;
  onComplete: (analysisId: string) => void;
  onError: (error: string) => void;
}

export function useJobProgress({
  jobId,
  onProgress,
  onComplete,
  onError,
}: UseJobProgressOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    reconnectAttempts.current = 0;
  }, []);

  useEffect(() => {
    if (!jobId) {
      disconnect();
      return;
    }

    const connect = () => {
      const url = getBatchUploadEventsUrl(jobId);
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data: BatchProgressEvent = JSON.parse(event.data);
          onProgress(data);

          if (data.stage === BatchStage.DONE && data.analysisId) {
            onComplete(data.analysisId);
            disconnect();
          }

          if (data.error && !data.analysisId) {
            onError(data.error);
          }
        } catch {
          // Silently ignore parse errors - connection issues handled by onerror
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;

        if (reconnectAttempts.current < SSE.MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++;
          const delay = Math.pow(2, reconnectAttempts.current) * SSE.RECONNECT_BASE_DELAY_MS;
          setTimeout(connect, delay);
        } else {
          onError(MESSAGES.CONNECTION_LOST);
        }
      };
    };

    connect();

    return () => {
      disconnect();
    };
  }, [jobId, onProgress, onComplete, onError, disconnect]);
}

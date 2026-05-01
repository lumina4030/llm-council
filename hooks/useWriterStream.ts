import { useEffect, useRef, useCallback } from "react";
import { useProjectStore } from "@/store/projectStore";

interface UseWriterStreamOptions {
  projectId: string;
  agentId: string;
  onComplete?: (content: string) => void;
  onError?: (error: Error) => void;
}

export function useWriterStream({
  projectId,
  agentId,
  onComplete,
  onError,
}: UseWriterStreamOptions) {
  const { setWriterProgress, updateDocumentContent } = useProjectStore();
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const contentRef = useRef<string>("");

  const startStream = useCallback(
    async (endpoint: string) => {
      setWriterProgress(agentId, "streaming");
      contentRef.current = "";

      try {
        const response = await fetch(endpoint, { method: "POST" });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        readerRef.current = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await readerRef.current.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          contentRef.current += chunk;
        }

        setWriterProgress(agentId, "done");
        onComplete?.(contentRef.current);
      } catch (error) {
        setWriterProgress(agentId, "error");
        onError?.(error as Error);
      }
    },
    [agentId, setWriterProgress, onComplete, onError]
  );

  const cancelStream = useCallback(() => {
    readerRef.current?.cancel();
    setWriterProgress(agentId, "pending");
  }, [agentId, setWriterProgress]);

  useEffect(() => {
    return () => {
      readerRef.current?.cancel();
    };
  }, []);

  return { startStream, cancelStream };
}
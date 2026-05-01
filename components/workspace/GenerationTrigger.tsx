"use client";

import { Play } from "lucide-react";
import type { Agent } from "@/types";
import { useState } from "react";

interface GenerationTriggerProps {
  projectId: string;
  writers: Agent[];
  onGenerationStart: () => void;
  onAllComplete?: () => void;
}

export function GenerationTrigger({
  projectId,
  writers,
  onGenerationStart,
}: GenerationTriggerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    onGenerationStart();

    const endpoints = writers.map(
      (w) => `/api/projects/${projectId}/writer/${w.id}/stream`
    );

    const streams = endpoints.map((endpoint) =>
      fetch(endpoint, { method: "POST" })
    );

    let completed = 0;
    await Promise.all(
      streams.map(async (streamPromise) => {
        try {
          const response = await streamPromise;
          if (!response.ok) throw new Error("Stream failed");
          await response.text();
        } catch (error) {
          console.error("Stream error:", error);
        } finally {
          completed++;
          setProgress((completed / writers.length) * 100);
        }
      })
    );

    setIsGenerating(false);
    setProgress(100);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full px-6 py-3 text-lg font-medium rounded-lg bg-warning-500 text-white hover:bg-warning-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Play size={20} />
        {isGenerating ? "Generating..." : "Start Generation"}
      </button>
      {isGenerating && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-warning-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-center text-default-500">{Math.round(progress)}% complete</p>
        </div>
      )}
    </div>
  );
}
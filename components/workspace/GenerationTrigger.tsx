"use client";

import { Play, Square } from "lucide-react";
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
        className="w-full px-6 py-4 text-base font-bold rounded-2xl btn-gradient text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Play size={20} className="fill-white" />
            <span>Start Generation</span>
          </>
        )}
      </button>
      {isGenerating && (
        <div className="space-y-3">
          <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-warning-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-center text-default-500 font-medium">{Math.round(progress)}% complete</p>
        </div>
      )}
    </div>
  );
}
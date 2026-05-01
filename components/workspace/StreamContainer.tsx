"use client";

import { Card } from "@heroui/react";
import { CheckCircle, XCircle, Loader2, Copy, Edit3, RefreshCw } from "lucide-react";
import type { Agent, WriterProgress } from "@/types";

interface StreamContainerProps {
  agent: Agent;
  progress: WriterProgress;
  content?: string;
  progressPercent?: number;
  errorMsg?: string;
  onRetry?: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
}

export function StreamContainer({
  agent,
  progress,
  content,
  progressPercent = 0,
  errorMsg,
  onRetry,
  onEdit,
  onCopy,
}: StreamContainerProps) {
  const statusConfig = {
    pending: { icon: null, label: "Waiting", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-700" },
    streaming: { icon: Loader2, label: "Generating...", bg: "bg-warning-100 dark:bg-warning-900/30", text: "text-warning-700 dark:text-warning-300", border: "border-warning-200 dark:border-warning-800/50" },
    done: { icon: CheckCircle, label: "Completed", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800/50" },
    error: { icon: XCircle, label: "Error", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800/50" },
  };

  const config = statusConfig[progress] || statusConfig.pending;
  const StatusIcon = config.icon;

  const renderProgressBar = (percent: number) => {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-warning-600">{percent}%</span>
        <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-56 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-warning-400 to-warning-600 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs text-default-400 font-mono">
          [{'█'.repeat(filled)}{'░'.repeat(empty)}]
        </span>
      </div>
    );
  };

  return (
    <Card className={`w-full overflow-hidden transition-all duration-300 ${
      progress === 'error'
        ? 'border-2 border-danger dark:border-danger/50 shadow-danger/20'
        : config.border
    } ${progress === 'streaming' ? 'pulse-glow' : ''} bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm`}>
      <Card.Header className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
            agent.role === "writer"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
              : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
          }`}>
            {agent.role === "writer" ? "🤖" : "🔍"} {agent.role}
          </span>
          <span className="font-semibold text-foreground">{agent.name}</span>
          <span className="text-xs text-default-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {agent.model}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {StatusIcon && (
            <StatusIcon
              size={16}
              className={progress === "streaming" ? "animate-spin text-warning" : `text-${config.text.split('-')[1]}`}
            />
          )}
          <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
        </div>
      </Card.Header>
      <Card.Content className="p-4">
        {/* Streaming State */}
        {progress === "streaming" && (
          <div className="space-y-4">
            {renderProgressBar(progressPercent)}
            {content && (
              <div className="prose prose-sm max-w-none overflow-auto max-h-48 p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <pre className="whitespace-pre-wrap text-sm">{content}</pre>
              </div>
            )}
            {!content && (
              <div className="space-y-3 py-4">
                <div className="h-3 skeleton rounded-full" />
                <div className="h-3 skeleton rounded-full w-5/6" />
                <div className="h-3 skeleton rounded-full w-4/6" />
                <p className="text-sm text-default-400 mt-3 animate-pulse">Generating document...</p>
              </div>
            )}
          </div>
        )}

        {/* Pending State */}
        {progress === "pending" && (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <span className="text-2xl">⏳</span>
            </div>
            <p className="text-sm text-default-400">Waiting to start...</p>
          </div>
        )}

        {/* Completed State */}
        {progress === "done" && content && (
          <div className="space-y-4">
            {renderProgressBar(100)}
            <div className="prose prose-sm max-w-none overflow-auto max-h-80 p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-green-200 dark:border-green-800/50">
              <pre className="whitespace-pre-wrap text-sm">{content}</pre>
            </div>
            <div className="flex gap-2 pt-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
              )}
              {onCopy && (
                <button
                  onClick={onCopy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Copy size={14} />
                  Copy MD
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {progress === "error" && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800/50">
              <p className="text-sm font-semibold text-danger">Generation Failed</p>
              {errorMsg && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-mono">{errorMsg}</p>
              )}
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-danger-500 to-danger-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <RefreshCw size={14} />
                Retry {agent.name}
              </button>
            )}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
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
    pending: { color: "gray", icon: null, label: "Waiting", bg: "bg-gray-100", text: "text-gray-700" },
    streaming: { color: "warning", icon: Loader2, label: "Generating...", bg: "bg-yellow-100", text: "text-yellow-700" },
    done: { color: "success", icon: CheckCircle, label: "Completed", bg: "bg-green-100", text: "text-green-700" },
    error: { color: "danger", icon: XCircle, label: "Error", bg: "bg-red-100", text: "text-red-700" },
  };

  const config = statusConfig[progress] || statusConfig.pending;
  const StatusIcon = config.icon;

  const renderProgressBar = (percent: number) => {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{percent}%</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-48">
          <div
            className="h-full bg-warning-500 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">
          [{'█'.repeat(filled)}{'░'.repeat(empty)}]
        </span>
      </div>
    );
  };

  return (
    <Card className={`w-full ${progress === 'error' ? 'border-2 border-danger' : ''}`}>
      <Card.Header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            agent.role === "writer"
              ? "bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-200"
              : "bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-200"
          }`}>
            {agent.role === "writer" ? "🤖" : "🔍"} {agent.role}
          </span>
          <span className="font-medium">{agent.name}</span>
          <span className="text-xs text-gray-400">({agent.model})</span>
        </div>
        <div className="flex items-center gap-2">
          {StatusIcon && (
            <StatusIcon
              size={16}
              className={progress === "streaming" ? "animate-spin" : ""}
            />
          )}
          <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
        </div>
      </Card.Header>
      <Card.Content>
        {/* Streaming State */}
        {progress === "streaming" && (
          <div className="space-y-3">
            {renderProgressBar(progressPercent)}
            {content && (
              <div className="prose prose-sm max-w-none overflow-auto max-h-48 mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <pre className="whitespace-pre-wrap text-sm">{content}</pre>
              </div>
            )}
            {!content && (
              <div className="space-y-2 mt-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-warning-500 animate-pulse w-full" />
                </div>
                <p className="text-sm text-default-400">Generating document...</p>
              </div>
            )}
          </div>
        )}

        {/* Pending State */}
        {progress === "pending" && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Waiting to start...</p>
          </div>
        )}

        {/* Completed State */}
        {progress === "done" && content && (
          <div className="space-y-3">
            {renderProgressBar(100)}
            <div className="prose prose-sm max-w-none overflow-auto max-h-96 p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <pre className="whitespace-pre-wrap text-sm">{content}</pre>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-600 transition-colors"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
              )}
              {onCopy && (
                <button
                  onClick={onCopy}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-danger font-medium">Generation Failed</p>
              {errorMsg && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errorMsg}</p>
              )}
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-danger text-white hover:bg-danger-600 transition-colors"
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

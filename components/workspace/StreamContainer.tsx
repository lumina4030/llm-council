"use client";

import { Card } from "@heroui/react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { Agent, WriterProgress } from "@/types";

interface StreamContainerProps {
  agent: Agent;
  progress: WriterProgress;
  content?: string;
}

export function StreamContainer({ agent, progress, content }: StreamContainerProps) {
  const statusConfig = {
    pending: { color: "gray", icon: null, label: "Waiting" },
    streaming: { color: "warning", icon: Loader2, label: "Generating..." },
    done: { color: "success", icon: CheckCircle, label: "Completed" },
    error: { color: "danger", icon: XCircle, label: "Error" },
  };

  const config = statusConfig[progress] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <Card className="w-full">
      <Card.Header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            agent.role === "writer"
              ? "bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-200"
              : "bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-200"
          }`}>
            {agent.role}
          </span>
          <span className="font-medium">{agent.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {StatusIcon && (
            <StatusIcon
              size={16}
              className={progress === "streaming" ? "animate-spin" : ""}
            />
          )}
          <span className="text-sm text-default-500">{config.label}</span>
        </div>
      </Card.Header>
      <Card.Content>
        {progress === "streaming" && !content && (
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-warning-500 animate-pulse w-full" />
            </div>
            <p className="text-sm text-default-400">Generating document...</p>
          </div>
        )}
        {content && (
          <div className="prose prose-sm max-w-none overflow-auto max-h-96">
            <pre className="whitespace-pre-wrap text-sm">{content}</pre>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
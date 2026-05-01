"use client";

import { Card } from "@heroui/react";
import type { Agent } from "@/types";

const MODEL_OPTIONS = [
  { key: "gpt-4o", label: "GPT-4o" },
  { key: "gpt-4o-mini", label: "GPT-4o Mini" },
  { key: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  { key: "claude-3-opus-20240229", label: "Claude 3 Opus" },
  { key: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { key: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
];

interface AgentConfiguratorProps {
  projectId: string;
  agents: Agent[];
  onUpdate?: () => void;
  disabled?: boolean;
}

export function AgentConfigurator({ agents, disabled }: AgentConfiguratorProps) {
  const writers = agents.filter((a) => a.role === "writer");
  const reviewers = agents.filter((a) => a.role === "reviewer");

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Writers ({writers.length})</h3>
        <div className="space-y-3">
          {writers.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <span className="px-2 py-1 text-xs font-medium rounded bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-200">
                Writer
              </span>
              <span className="flex-1">{agent.name}</span>
              <select
                value={agent.model}
                disabled
                className="w-48 px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Reviewers ({reviewers.length})</h3>
        <div className="space-y-3">
          {reviewers.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <span className="px-2 py-1 text-xs font-medium rounded bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-200">
                Reviewer
              </span>
              <span className="flex-1">{agent.name}</span>
              <select
                value={agent.model}
                disabled
                className="w-48 px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
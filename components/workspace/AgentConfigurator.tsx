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
    <div className="space-y-4">
      <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow">
            {writers.length}
          </span>
          Writers
        </h3>
        <div className="space-y-2">
          {writers.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100/50 dark:border-purple-800/30"
            >
              <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow">
                🤖
              </span>
              <span className="flex-1 font-medium text-sm">{agent.name}</span>
              <select
                value={agent.model}
                disabled
                className="w-36 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900/50 text-xs focus:ring-2 focus:ring-purple-500/30 transition-all"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow">
            {reviewers.length}
          </span>
          Reviewers
        </h3>
        <div className="space-y-2">
          {reviewers.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100/50 dark:border-green-800/30"
            >
              <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow">
                🔍
              </span>
              <span className="flex-1 font-medium text-sm">{agent.name}</span>
              <select
                value={agent.model}
                disabled
                className="w-36 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900/50 text-xs focus:ring-2 focus:ring-green-500/30 transition-all"
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
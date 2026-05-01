"use client";

import { useState } from "react";
import { Toast } from "@heroui/react";
import { Plus, Trash2 } from "lucide-react";

const MODEL_OPTIONS = [
  { key: "gpt-4o", label: "GPT-4o" },
  { key: "gpt-4o-mini", label: "GPT-4o Mini" },
  { key: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  { key: "claude-3-opus-20240229", label: "Claude 3 Opus" },
  { key: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { key: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
];

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    idea: string;
    docType: string;
    agents: { name: string; role: string; model: string }[];
  }) => Promise<void>;
}

export function CreateProjectModal({ isOpen, onClose, onCreate }: CreateProjectModalProps) {
  const [title, setTitle] = useState("");
  const [idea, setIdea] = useState("");
  const [docType, setDocType] = useState("prd");
  const [agents, setAgents] = useState([
    { id: "1", name: "Writer 1", role: "writer", model: "gpt-4o" },
    { id: "2", name: "Writer 2", role: "writer", model: "claude-3-5-sonnet-20241022" },
    { id: "3", name: "Reviewer", role: "reviewer", model: "gpt-4o-mini" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const addAgent = (role: "writer" | "reviewer") => {
    const newAgent = {
      id: Date.now().toString(),
      name: `${role === "writer" ? "Writer" : "Reviewer"} ${agents.filter(a => a.role === role).length + 1}`,
      role,
      model: role === "writer" ? "gpt-4o" : "gpt-4o-mini",
    };
    setAgents([...agents, newAgent]);
  };

  const removeAgent = (id: string) => {
    if (agents.length <= 3) return;
    setAgents(agents.filter(a => a.id !== id));
  };

  const updateAgent = (id: string, updates: Partial<{ name: string; model: string }>) => {
    setAgents(agents.map(a => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !idea.trim()) {
      Toast.toast.danger("Please fill in all fields");
      return;
    }

    const writerCount = agents.filter(a => a.role === "writer").length;
    const reviewerCount = agents.filter(a => a.role === "reviewer").length;

    if (writerCount < 2) {
      Toast.toast.danger("At least 2 writers required");
      return;
    }
    if (reviewerCount < 1) {
      Toast.toast.danger("At least 1 reviewer required");
      return;
    }

    setIsLoading(true);
    try {
      await onCreate({ title, idea, docType, agents });
      onClose();
      setTitle("");
      setIdea("");
      setDocType("prd");
    } catch (error) {
      Toast.toast.danger("Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto border border-gray-200/50 dark:border-gray-700/50 animate-fade-in-up">
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold gradient-text">Create New Project</h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Project Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-900/50 focus:ring-2 focus:ring-warning-500/50 focus:border-warning-500 transition-all"
              placeholder="Enter project title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Product Idea</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-900/50 min-h-[100px] focus:ring-2 focus:ring-warning-500/50 focus:border-warning-500 transition-all"
              placeholder="Describe your product idea..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-900/50 focus:ring-2 focus:ring-warning-500/50 focus:border-warning-500 transition-all"
            >
              <option value="prd">PRD (Product Requirements Document)</option>
              <option value="spec">Technical Spec</option>
            </select>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium rounded-lg bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300">
                  {agents.filter(a => a.role === "writer").length}
                </span>
                Writers
              </h4>
              <button
                type="button"
                onClick={() => addAgent("writer")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <Plus size={16} />
                Add Writer
              </button>
            </div>
            {agents.filter(a => a.role === "writer").map((agent) => (
              <div key={agent.id} className="flex gap-2 items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <input
                  type="text"
                  placeholder="Agent name"
                  value={agent.name}
                  onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 text-sm focus:ring-2 focus:ring-warning-500/50 focus:border-warning-500 transition-all"
                />
                <select
                  value={agent.model}
                  onChange={(e) => updateAgent(agent.id, { model: e.target.value })}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 text-sm focus:ring-2 focus:ring-warning-500/50 focus:border-warning-500 transition-all"
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeAgent(agent.id)}
                  disabled={agents.filter(a => a.role === "writer").length <= 2}
                  className="p-2 text-danger hover:bg-danger-100 dark:hover:bg-danger-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <div className="flex justify-between items-center mt-6">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium rounded-lg bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300">
                  {agents.filter(a => a.role === "reviewer").length}
                </span>
                Reviewers
              </h4>
              <button
                type="button"
                onClick={() => addAgent("reviewer")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <Plus size={16} />
                Add Reviewer
              </button>
            </div>
            {agents.filter(a => a.role === "reviewer").map((agent) => (
              <div key={agent.id} className="flex gap-2 items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <input
                  type="text"
                  placeholder="Agent name"
                  value={agent.name}
                  onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 text-sm focus:ring-2 focus:ring-warning-500/50 focus:border-warning-500 transition-all"
                />
                <select
                  value={agent.model}
                  onChange={(e) => updateAgent(agent.id, { model: e.target.value })}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 text-sm focus:ring-2 focus:ring-warning-500/50 focus:border-warning-500 transition-all"
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeAgent(agent.id)}
                  disabled={agents.filter(a => a.role === "reviewer").length <= 1}
                  className="p-2 text-danger hover:bg-danger-100 dark:hover:bg-danger-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium rounded-xl text-default-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-medium rounded-xl btn-gradient text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
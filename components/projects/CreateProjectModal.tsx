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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Create New Project</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter project title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Product Idea</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 min-h-[100px]"
              placeholder="Describe your product idea..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="prd">PRD (Product Requirements Document)</option>
              <option value="spec">Technical Spec</option>
            </select>
          </div>

          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Writers ({agents.filter(a => a.role === "writer").length})</h4>
              <button
                type="button"
                onClick={() => addAgent("writer")}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-warning-500 text-white hover:bg-warning-600 transition-colors"
              >
                <Plus size={16} />
                Add Writer
              </button>
            </div>
            {agents.filter(a => a.role === "writer").map((agent) => (
              <div key={agent.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Agent name"
                  value={agent.name}
                  onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
                <select
                  value={agent.model}
                  onChange={(e) => updateAgent(agent.id, { model: e.target.value })}
                  className="w-48 px-3 py-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeAgent(agent.id)}
                  disabled={agents.filter(a => a.role === "writer").length <= 2}
                  className="p-1.5 text-danger hover:bg-danger-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <div className="flex justify-between items-center mt-4">
              <h4 className="font-semibold">Reviewers ({agents.filter(a => a.role === "reviewer").length})</h4>
              <button
                type="button"
                onClick={() => addAgent("reviewer")}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-warning-500 text-white hover:bg-warning-600 transition-colors"
              >
                <Plus size={16} />
                Add Reviewer
              </button>
            </div>
            {agents.filter(a => a.role === "reviewer").map((agent) => (
              <div key={agent.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Agent name"
                  value={agent.name}
                  onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
                <select
                  value={agent.model}
                  onChange={(e) => updateAgent(agent.id, { model: e.target.value })}
                  className="w-48 px-3 py-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeAgent(agent.id)}
                  disabled={agents.filter(a => a.role === "reviewer").length <= 1}
                  className="p-1.5 text-danger hover:bg-danger-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-default-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-warning-500 text-white hover:bg-warning-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
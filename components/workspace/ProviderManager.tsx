"use client";

import { useState } from "react";
import { Card } from "@heroui/react";
import { Plus, Trash2, Settings, X, Eye, EyeOff, Plug, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import type { Provider } from "@/types";

interface ProviderManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type TestStatus = "idle" | "loading" | "success" | "error";

export function ProviderManager({ isOpen, onClose }: ProviderManagerProps) {
  const { providers, addProvider, removeProvider, updateProvider } = useProjectStore();
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Provider>>({});
  const [testStatus, setTestStatus] = useState<Record<string, TestStatus>>({});
  const [testMessage, setTestMessage] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!form.name || !form.apiBase || !form.apiKey) return;
    addProvider({
      id: Date.now().toString(),
      name: form.name,
      apiBase: form.apiBase.replace(/\/$/, ""),
      apiKey: form.apiKey,
    });
    setForm({});
  };

  const handleUpdate = (id: string) => {
    if (!form.name || !form.apiBase || !form.apiKey) return;
    updateProvider(id, {
      name: form.name,
      apiBase: form.apiBase.replace(/\/$/, ""),
      apiKey: form.apiKey,
    });
    setForm({});
    setEditingId(null);
  };

  const startEdit = (p: Provider) => {
    setForm(p);
    setEditingId(p.id);
  };

  const toggleKey = (id: string) => {
    setShowKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "***";
    return key.slice(0, 4) + "***" + key.slice(-4);
  };

  const handleTestConnection = async (p: Provider) => {
    setTestStatus((prev) => ({ ...prev, [p.id]: "loading" }));
    setTestMessage((prev) => ({ ...prev, [p.id]: "" }));

    try {
      const res = await fetch("/api/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiBase: p.apiBase,
          apiKey: p.apiKey,
          model: p.name.toLowerCase().includes("openai") ? "gpt-4o" : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTestStatus((prev) => ({ ...prev, [p.id]: "success" }));
        setTestMessage((prev) => ({ ...prev, [p.id]: data.message }));
      } else {
        setTestStatus((prev) => ({ ...prev, [p.id]: "error" }));
        setTestMessage((prev) => ({ ...prev, [p.id]: data.error }));
      }
    } catch (err) {
      setTestStatus((prev) => ({ ...prev, [p.id]: "error" }));
      setTestMessage((prev) => ({ ...prev, [p.id]: err instanceof Error ? err.message : "Connection failed" }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-auto border border-gray-200/50 dark:border-gray-700/50 animate-fade-in-up">
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
          <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
            <Settings size={20} />
            Model Providers
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add new provider */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-semibold mb-3">Add New Provider</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Provider name (e.g., OpenAI, Local LLM)"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
              <input
                type="text"
                placeholder="API Base URL (e.g., https://api.openai.com/v1)"
                value={form.apiBase || ""}
                onChange={(e) => setForm({ ...form, apiBase: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="API Key"
                  value={form.apiKey || ""}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                />
                {editingId ? (
                  <>
                    <button
                      onClick={() => handleUpdate(editingId)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setForm({}); }}
                      className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAdd}
                    disabled={!form.name || !form.apiBase || !form.apiKey}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Provider list */}
          {providers.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Your Providers</h3>
              {providers.map((p) => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{p.name}</h4>
                      <p className="text-xs text-default-500 mt-1">{p.apiBase}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-default-500">Key:</span>
                        <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded">
                          {showKey[p.id] ? p.apiKey : maskKey(p.apiKey)}
                        </code>
                        <button
                          onClick={() => toggleKey(p.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          {showKey[p.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTestConnection(p)}
                        disabled={testStatus[p.id] === "loading"}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {testStatus[p.id] === "loading" ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Plug size={12} />
                        )}
                        Test
                      </button>
                      <button
                        onClick={() => startEdit(p)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300 hover:bg-warning-200 dark:hover:bg-warning-800/50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeProvider(p.id)}
                        className="p-1.5 text-danger hover:bg-danger-100 dark:hover:bg-danger-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {testStatus[p.id] === "success" && testMessage[p.id] && (
                    <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
                        <CheckCircle size={12} />
                        {testMessage[p.id]}
                      </p>
                    </div>
                  )}
                  {testStatus[p.id] === "error" && testMessage[p.id] && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1">
                        <XCircle size={12} />
                        {testMessage[p.id]}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {providers.length === 0 && (
            <div className="text-center py-8 text-default-500">
              <Settings size={32} className="mx-auto mb-2 opacity-50" />
              <p>No providers configured yet.</p>
              <p className="text-sm">Add your first provider above to get started.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium rounded-xl btn-gradient text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, RefreshCw, Square } from "lucide-react";
import Link from "next/link";
import { useProjectStore } from "@/store/projectStore";
import { AgentConfigurator } from "@/components/workspace/AgentConfigurator";
import { StreamContainer } from "@/components/workspace/StreamContainer";
import { DocumentViewer } from "@/components/workspace/DocumentViewer";
import { ReviewPanel } from "@/components/workspace/ReviewPanel";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const {
    project,
    agents,
    documents,
    review,
    writerProgress,
    isGenerating,
    setProjectData,
    setWriterProgress,
    setIsGenerating,
    updateDocumentContent,
  } = useProjectStore();

  const [streamContents, setStreamContents] = useState<Record<string, string>>({});
  const [progressPercents, setProgressPercents] = useState<Record<string, number>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProjectData(data);
    } catch {
      router.push("/");
    }
  }, [projectId, setProjectData, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const writers = agents.filter((a) => a.role === "writer");

  const handleGenerationStart = () => {
    setIsGenerating(true);
    setErrorMessages({});
    writers.forEach((w) => {
      setWriterProgress(w.id, "pending");
      setStreamContents((prev) => ({ ...prev, [w.id]: "" }));
      setProgressPercents((prev) => ({ ...prev, [w.id]: 0 }));
      abortControllersRef.current[w.id] = new AbortController();
    });
  };

  const handleStopGeneration = () => {
    Object.values(abortControllersRef.current).forEach((controller) => {
      controller.abort();
    });
    setIsGenerating(false);
  };

  const handleCopyMarkdown = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add toast notification here
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleExportMarkdown = () => {
    const allContent = writers
      .map((w) => `# ${w.name} (${w.model})\n\n${streamContents[w.id] || ""}`)
      .join("\n\n---\n\n");

    const blob = new Blob([allContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.title || "project"}-documents.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRetryWriter = async (writerId: string) => {
    const writer = writers.find((w) => w.id === writerId);
    if (!writer) return;

    setWriterProgress(writerId, "pending");
    setErrorMessages((prev) => ({ ...prev, [writerId]: "" }));

    const endpoint = `/api/projects/${projectId}/writer/${writerId}/stream`;
    setWriterProgress(writerId, "streaming");
    abortControllersRef.current[writerId] = new AbortController();

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        signal: abortControllersRef.current[writerId].signal,
      });

      if (!response.ok) throw new Error(`Stream failed (${response.status})`);

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        content += chunk;
        setStreamContents((prev) => ({ ...prev, [writerId]: content }));

        // Estimate progress based on content length
        const estimatedPercent = Math.min(90, Math.round((content.length / 5000) * 100));
        setProgressPercents((prev) => ({ ...prev, [writerId]: estimatedPercent }));
      }

      setWriterProgress(writerId, "done");
      setProgressPercents((prev) => ({ ...prev, [writerId]: 100 }));

      const doc = documents.find((d) => d.agentId === writerId);
      if (doc) updateDocumentContent(doc.id, content);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error with writer ${writer.name}:`, message);
      setWriterProgress(writerId, "error");
      setErrorMessages((prev) => ({ ...prev, [writerId]: message }));
    }
  };

  const handleGenerate = async () => {
    handleGenerationStart();

    const streams = writers.map(async (writer) => {
      const endpoint = `/api/projects/${projectId}/writer/${writer.id}/stream`;
      setWriterProgress(writer.id, "streaming");

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          signal: abortControllersRef.current[writer.id].signal,
        });

        if (!response.ok) throw new Error(`Stream failed (${response.status})`);

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let content = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          content += chunk;
          setStreamContents((prev) => ({ ...prev, [writer.id]: content }));

          // Estimate progress
          const estimatedPercent = Math.min(90, Math.round((content.length / 5000) * 100));
          setProgressPercents((prev) => ({ ...prev, [writer.id]: estimatedPercent }));
        }

        setWriterProgress(writer.id, "done");
        setProgressPercents((prev) => ({ ...prev, [writer.id]: 100 }));

        const doc = documents.find((d) => d.agentId === writer.id);
        if (doc) updateDocumentContent(doc.id, content);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error with writer ${writer.name}:`, message);
        setWriterProgress(writer.id, "error");
        setErrorMessages((prev) => ({ ...prev, [writer.id]: message }));
      }
    });

    await Promise.all(streams);
    setIsGenerating(false);
  };

  const handleReview = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/review`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Review failed");
      await fetchProject();
    } catch (error) {
      console.error("Review error:", error);
    }
  };

  const allWritersDone = writers.every((w) => writerProgress[w.id] === "done");
  const anyWriterError = writers.some((w) => writerProgress[w.id] === "error");
  const hasPartialSuccess = anyWriterError && !allWritersDone;

  const getStatusBadge = () => {
    if (project?.status === "running" || isGenerating) {
      return { label: "Running", className: "bg-yellow-100 text-yellow-700" };
    }
    if (project?.status === "completed") {
      return { label: "Completed", className: "bg-green-100 text-green-700" };
    }
    if (hasPartialSuccess) {
      return { label: "Partial", className: "bg-orange-100 text-orange-700" };
    }
    if (project?.status === "failed") {
      return { label: "Failed", className: "bg-red-100 text-red-700" };
    }
    return { label: "Idle", className: "bg-gray-100 text-gray-700" };
  };

  const statusBadge = getStatusBadge();

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-sm text-gray-500 line-clamp-1">{project.idea}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <AgentConfigurator projectId={projectId} agents={agents} />

          {/* Generation Controls */}
          <div className="space-y-2">
            {!isGenerating && (project.status === "idle" || project.status === "failed" || allWritersDone || hasPartialSuccess) && (
              <button
                onClick={handleGenerate}
                className="w-full px-4 py-3 text-base font-medium rounded-lg bg-warning-500 text-white hover:bg-warning-600 transition-colors flex items-center justify-center gap-2"
              >
                {hasPartialSuccess ? (
                  <>
                    <RefreshCw size={18} />
                    Regenerate Failed
                  </>
                ) : allWritersDone ? (
                  <>
                    <RefreshCw size={18} />
                    Regenerate All
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Start Generation
                  </>
                )}
              </button>
            )}

            {isGenerating && (
              <>
                <button
                  onClick={handleStopGeneration}
                  className="w-full px-4 py-3 text-base font-medium rounded-lg bg-danger text-white hover:bg-danger-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Square size={18} />
                  Stop Generation
                </button>
              </>
            )}

            {project.status === "completed" && !isGenerating && (
              <button
                onClick={handleReview}
                className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-success text-white hover:bg-success-600 transition-colors"
              >
                Re-run Review
              </button>
            )}

            {(allWritersDone || hasPartialSuccess) && !isGenerating && (
              <button
                onClick={handleExportMarkdown}
                className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Export All as Markdown
              </button>
            )}
          </div>
        </div>

        {/* Main Content - Writers */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Generated Documents</h2>
          <div className="space-y-4">
            {writers.map((writer) => (
              <StreamContainer
                key={writer.id}
                agent={writer}
                progress={writerProgress[writer.id] || "pending"}
                content={streamContents[writer.id]}
                progressPercent={progressPercents[writer.id] || 0}
                errorMsg={errorMessages[writer.id]}
                onRetry={() => handleRetryWriter(writer.id)}
                onEdit={() => {
                  const doc = documents.find((d) => d.agentId === writer.id);
                  if (doc) setEditingDocId(doc.id);
                }}
                onCopy={() => handleCopyMarkdown(streamContents[writer.id] || "")}
              />
            ))}
          </div>

          {/* BlockNote Editor Modal */}
          {editingDocId && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-semibold">Edit Document</h3>
                  <button
                    onClick={() => setEditingDocId(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4">
                  <DocumentViewer
                    documentId={editingDocId}
                    initialContent={streamContents[writers.find((w) => documents.find((d) => d.id === editingDocId)?.agentId === w.id)?.id || ""] || ""}
                    editable
                    onSave={async (content) => {
                      await fetch(
                        `/api/projects/${projectId}/documents/${editingDocId}`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ content }),
                        }
                      );
                      setEditingDocId(null);
                      await fetchProject();
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Review */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Review Results</h2>
          <ReviewPanel reviewPayload={review?.payload || null} />
        </div>
      </div>
    </div>
  );
}

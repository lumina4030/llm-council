"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useProjectStore } from "@/store/projectStore";
import { AgentConfigurator } from "@/components/workspace/AgentConfigurator";
import { GenerationTrigger } from "@/components/workspace/GenerationTrigger";
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

  const [activeTab, setActiveTab] = useState<"documents" | "review">("documents");
  const [streamContents, setStreamContents] = useState<Record<string, string>>({});

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
    writers.forEach((w) => {
      setWriterProgress(w.id, "pending");
      setStreamContents((prev) => ({ ...prev, [w.id]: "" }));
    });
  };

  const handleGenerate = async () => {
    handleGenerationStart();

    const streams = writers.map(async (writer) => {
      const endpoint = `/api/projects/${projectId}/writer/${writer.id}/stream`;
      setWriterProgress(writer.id, "streaming");

      try {
        const response = await fetch(endpoint, { method: "POST" });
        if (!response.ok) throw new Error(`Stream failed for ${writer.name}`);

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
        }

        setWriterProgress(writer.id, "done");
        const doc = documents.find((d) => d.agentId === writer.id);
        if (doc) updateDocumentContent(doc.id, content);
      } catch (error) {
        console.error(`Error with writer ${writer.name}:`, error);
        setWriterProgress(writer.id, "error");
      }
    });

    await Promise.all(streams);
    setIsGenerating(false);

    if (writers.every((w) => writerProgress[w.id] === "done")) {
    }
  };

  const handleReview = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/review`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Review failed");
      await fetchProject();
    } catch {
    }
  };

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-sm text-gray-500">ID: {project.id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          project.status === "completed"
            ? "bg-green-100 text-green-700"
            : project.status === "running"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-gray-100 text-gray-700"
        }`}>
          {project.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <AgentConfigurator projectId={projectId} agents={agents} />

          {project.status === "idle" || project.status === "failed" ? (
            <GenerationTrigger
              projectId={projectId}
              writers={writers}
              onGenerationStart={handleGenerationStart}
            />
          ) : null}

          {project.status === "completed" && (
            <button
              onClick={handleReview}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Re-run Review
            </button>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-4 py-2 font-medium ${
                activeTab === "documents"
                  ? "border-b-2 border-warning text-warning"
                  : "text-gray-500"
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab("review")}
              className={`px-4 py-2 font-medium ${
                activeTab === "review"
                  ? "border-b-2 border-warning text-warning"
                  : "text-gray-500"
              }`}
            >
              Review
            </button>
          </div>

          {activeTab === "documents" ? (
            <div className="space-y-4">
              {writers.map((writer) => (
                <div key={writer.id}>
                  <h3 className="text-sm font-medium mb-2">{writer.name}</h3>
                  <StreamContainer
                    agent={writer}
                    progress={writerProgress[writer.id] || "pending"}
                    content={streamContents[writer.id]}
                  />
                  {streamContents[writer.id] && (
                    <div className="mt-2">
                      <DocumentViewer
                        documentId={
                          documents.find((d) => d.agentId === writer.id)?.id || ""
                        }
                        initialContent={streamContents[writer.id]}
                        editable
                        onSave={async (content) => {
                          const doc = documents.find((d) => d.agentId === writer.id);
                          if (!doc) return;
                          await fetch(
                            `/api/projects/${projectId}/documents/${doc.id}`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ content }),
                            }
                          );
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <ReviewPanel reviewPayload={review?.payload || null} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
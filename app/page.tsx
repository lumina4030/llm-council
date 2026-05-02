"use client";

import { useState, useEffect } from "react";
import { toast } from "@heroui/react";
import { Plus, Settings } from "lucide-react";
import { ProjectList } from "@/components/projects/ProjectList";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { ProviderManager } from "@/components/workspace/ProviderManager";
import { useProjectStore } from "@/store/projectStore";

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="skeleton h-6 w-3/4 rounded-lg" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-3">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
          <div className="flex gap-2 mt-4">
            <div className="skeleton h-8 w-20 rounded-lg" />
            <div className="skeleton h-8 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const { providers, addProvider, removeProvider, updateProvider } = useProjectStore();

  useEffect(() => {
    const saved = localStorage.getItem("llm-council-providers");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.forEach((p: any) => {
          addProvider(p);
        });
      } catch (e) {
        console.error("Failed to load providers", e);
      }
    }
  }, [addProvider]);

  useEffect(() => {
    if (providers.length > 0) {
      localStorage.setItem("llm-council-providers", JSON.stringify(providers));
    }
  }, [providers]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProjects(data.projects);
    } catch {
      toast.danger("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (data: any) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      await fetchProjects();
      toast.success("Project created");
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      await fetchProjects();
      toast.success("Project deleted");
    } catch {
      toast.danger("Failed to delete project");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg-soft" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50" />
        <div className="relative container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in-up">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                <span className="gradient-text">Your Projects</span>
              </h1>
              <p className="text-lg text-default-500 max-w-lg">
                Create and manage your PRD generation projects with AI-powered multi-agent collaboration
              </p>
            </div>
            <button
              onClick={() => setIsProviderModalOpen(true)}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
            >
              <Settings size={18} />
              <span className="font-medium text-sm">Providers</span>
              {providers.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                  {providers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center gap-2 px-6 py-3 rounded-2xl btn-gradient text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-semibold">New Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="stagger-children">
            <ProjectList projects={projects} onDelete={handleDelete} />
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />

      <ProviderManager
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
      />
    </div>
  );
}
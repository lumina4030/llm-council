"use client";

import { useCallback } from "react";
import { useProjectStore } from "@/store/projectStore";
import type { Project, Agent, Document, Review } from "@/types";

export function useProject() {
  const { project, agents, documents, review, setProjectData, reset } =
    useProjectStore();

  const fetchProject = useCallback(async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}`);
    if (!res.ok) throw new Error("Failed to fetch project");
    const data = await res.json();
    setProjectData({
      project: data.project,
      agents: data.agents,
      documents: data.documents,
      review: data.review,
    });
    return data;
  }, [setProjectData]);

  const createProject = useCallback(async (input: {
    title: string;
    idea: string;
    docType: string;
    agents: { name: string; role: string; model: string }[];
  }) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create project");
    return res.json();
  }, []);

  return { project, agents, documents, review, fetchProject, createProject, reset };
}
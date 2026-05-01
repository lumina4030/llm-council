import { create } from "zustand";
import type { Project, Agent, Document, Review, WriterProgress, ProjectState } from "@/types";

const initialState = {
  project: null,
  agents: [],
  documents: [],
  review: null,
  isGenerating: false,
  writerProgress: {},
};

export const useProjectStore = create<ProjectState>((set) => ({
  ...initialState,

  setProjectData: (data) =>
    set({
      project: data.project,
      agents: data.agents,
      documents: data.documents,
      review: data.review,
      writerProgress: data.agents
        .filter((a) => a.role === "writer")
        .reduce((acc, a) => ({ ...acc, [a.id]: "pending" }), {}),
    }),

  setWriterProgress: (agentId, status) =>
    set((state) => ({
      writerProgress: { ...state.writerProgress, [agentId]: status },
    })),

  setIsGenerating: (val) => set({ isGenerating: val }),

  updateDocumentContent: (docId, content) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === docId ? { ...d, content } : d
      ),
    })),

  reset: () => set(initialState),
}));
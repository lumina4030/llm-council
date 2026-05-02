import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Project, Agent, Document, Review, WriterProgress, ProjectState, Provider } from "@/types";

const initialState = {
  project: null,
  agents: [],
  documents: [],
  review: null,
  isGenerating: false,
  writerProgress: {},
  providers: [],
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
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

      addProvider: (provider) =>
        set((state) => ({
          providers: [...state.providers, provider],
        })),

      removeProvider: (id) =>
        set((state) => ({
          providers: state.providers.filter((p) => p.id !== id),
        })),

      updateProvider: (id, updates) =>
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
    }),
    {
      name: "llm-council-providers",
      partialize: (state) => ({ providers: state.providers }),
    }
  )
);
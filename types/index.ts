export interface Project {
  id: string;
  title: string;
  idea: string;
  docType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  agents?: Agent[];
  documents?: Document[];
  review?: Review | null;
}

export interface Agent {
  id: string;
  projectId: string;
  name: string;
  role: string;
  model: string;
}

export interface Document {
  id: string;
  projectId: string;
  agentId: string;
  content: string;
  type: string;
  status: string;
  errorMsg?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  projectId: string;
  payload: string;
  createdAt: Date;
}

export type WriterProgress = "pending" | "streaming" | "done" | "error";

export interface ProjectState {
  project: Project | null;
  agents: Agent[];
  documents: Document[];
  review: Review | null;
  isGenerating: boolean;
  writerProgress: Record<string, WriterProgress>;
  setProjectData: (data: {
    project: Project;
    agents: Agent[];
    documents: Document[];
    review: Review | null;
  }) => void;
  setWriterProgress: (agentId: string, status: WriterProgress) => void;
  setIsGenerating: (val: boolean) => void;
  updateDocumentContent: (docId: string, content: string) => void;
  reset: () => void;
}
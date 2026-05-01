---
title: LLM-Council-HL-SPEC
created: 2026-05-01
source: Cherry Studio
tags: 
---
## 🤖 Assistant

# HL-SPEC: AI PRD Copilot

**Version**: 1.0
**Target**: Coding Agent (Cursor / Claude Code / OpenCode)
**Scope**: High-level technical architecture, data flow, API contracts, and component boundaries.

---

## 1. System Overview

AI PRD Copilot is a Next.js 14+ full-stack application. It allows users to configure multi-LLM Agent pipelines (2+ Writers, 1+ Reviewer) to generate Product Requirement Documents (PRD) or Technical Specs from a raw idea.

**Core Runtime Pattern**:
1. **Frontend** triggers parallel streaming generation requests (one per Writer).
2. **API Routes** use Vercel AI SDK (`streamText`) to proxy LLM streams to the client.
3. **Database** (SQLite via Prisma) persists Project metadata, Agent configs, final Document Markdown, and Reviewer scores.
4. **Reviewer** is invoked only after all Writers finish, using `generateObject` to return structured JSON.

---

## 2. Tech Stack & Key Dependencies

| Layer | Technology | Package / Service | Version Constraint |
|-------|------------|-------------------|--------------------|
| Framework | Next.js (App Router) | `next` | `^14.x` or `^15.x` |
| Language | TypeScript | `typescript` | `^5.x` |
| Styling | Tailwind CSS | `tailwindcss` | `^3.4` |
| UI Library | HeroUI | `@heroui/react` | Latest stable |
| AI Orchestration | Vercel AI SDK | `ai` | `^3.x` |
| AI Providers | Vercel AI SDK Providers | `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google` | `latest` |
| Editor | BlockNote | `@blocknote/react`, `@blocknote/core`, `@blocknote/mantine` | `^0.15+` |
| ORM | Prisma | `@prisma/client`, `prisma` | `^5.x` |
| Database | SQLite | Native via Prisma | File-based |
| State Management | Zustand | `zustand` | `^4.x` |
| Validation | Zod | `zod` | `^3.x` |
| Icons | Lucide React | `lucide-react` | `latest` |

> **Deployment Note on SQLite**: Vercel Serverless Functions have an ephemeral filesystem. A SQLite file written in production will not persist across invocations. For the initial version, target **local development** with SQLite. For Vercel production, the schema must be portable to **Turso** (`@libsql/client` + Prisma driver adapter) without changing the data model.

---

## 3. System Architecture

```
┌─────────────────────────────────────┐
│           Client (Browser)          │
│  React + HeroUI + BlockNote Editor  │
│  Zustand Store (Project/Gen State)  │
└──────────────┬──────────────────────┘
               │ HTTP / SSE (Stream)
┌──────────────▼──────────────────────┐
│      Next.js App Router (API)       │
│  ┌──────────────┐  ┌─────────────┐  │
│  │ /api/projects│  │ /api/writer │  │
│  │ /api/review  │  │ /stream     │  │
│  └──────┬───────┘  └──────┬──────┘  │
│         │                 │          │
│  ┌──────▼─────────────────▼──────┐   │
│  │      Vercel AI SDK            │   │
│  │  (streamText / generateObject)│   │
│  └──────┬─────────────────┬──────┘   │
│         │                 │          │
│    [OpenAI] [Anthropic] [Google]     │
└─────────┬────────────────────────────┘
          │ Prisma ORM
┌─────────▼────────────────────────────┐
│        SQLite Database               │
│   (Project, Agent, Document, Review) │
└──────────────────────────────────────┘
```

---

## 4. Project Directory Structure

```
ai-prd-copilot/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with HeroUI Provider
│   ├── page.tsx                  # Landing / Project List
│   ├── globals.css
│   ├── api/
│   │   ├── projects/
│   │   │   ├── route.ts          # POST list, GET list
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET, PATCH, DELETE project
│   │   │       ├── generate/
│   │   │       │   └── route.ts  # (Optional) Legacy orchestrator
│   │   │       ├── writer/
│   │   │       │   └── [agentId]/
│   │   │       │       └── stream/
│   │   │       │           └── route.ts  # POST: streamText for one writer
│   │   │       ├── review/
│   │   │       │   └── route.ts  # POST: trigger reviewer
│   │   │       └── documents/
│   │   │           └── [docId]/
│   │   │               └── route.ts  # GET, PATCH document
│   │   └── health/
│   │       └── route.ts
│   ├── projects/
│   │   ├── page.tsx              # /projects (list view)
│   │   └── [id]/
│   │       └── page.tsx          # /projects/[id] (workspace)
│   └── layout.tsx
├── components/
│   ├── ui/                       # HeroUI wrappers / generic UI
│   ├── projects/
│   │   ├── ProjectList.tsx
│   │   ├── ProjectCard.tsx
│   │   └── CreateProjectModal.tsx
│   ├── workspace/
│   │   ├── AgentConfigurator.tsx
│   │   ├── GenerationTrigger.tsx
│   │   ├── DocumentViewer.tsx    # BlockNote integration
│   │   ├── ReviewPanel.tsx
│   │   └── StreamContainer.tsx   # Handles SSE/stream state
│   └── layout/
│       └── Navbar.tsx
├── lib/
│   ├── prisma.ts                 # Singleton PrismaClient
│   ├── ai/                       # AI SDK configurations
│   │   ├── providers.ts          # Provider factory (openai, anthropic)
│   │   ├── prompts.ts            # SYSTEM_PROMPT_WRITER, SYSTEM_PROMPT_REVIEWER
│   │   └── schemas.ts            # Zod schemas for AI outputs
│   └── utils.ts
├── hooks/
│   ├── useProject.ts
│   └── useWriterStream.ts        # Custom hook for streaming a single writer
├── store/
│   └── projectStore.ts           # Zustand store
├── prisma/
│   └── schema.prisma
├── types/
│   └── index.ts                  # Shared TypeScript types
├── public/
└── package.json
```

---

## 5. Database Design (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Project {
  id        String   @id @default(cuid())
  title     String
  idea      String
  docType   String   @default("prd") // "prd" | "spec"
  status    String   @default("idle") // idle | running | completed | failed
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  agents    Agent[]
  documents Document[]
  review    Review?

  @@index([status])
  @@index([createdAt])
}

model Agent {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name      String
  role      String   // "writer" | "reviewer"
  model     String   // e.g., "gpt-4o", "claude-3-5-sonnet"

  documents Document[]
  
  @@index([projectId])
}

model Document {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  content   String   // Final Markdown content
  type      String   // inherited from Project.docType
  status    String   @default("pending") // pending | generating | completed | error
  errorMsg  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([projectId, agentId])
  @@index([projectId, status])
}

model Review {
  id        String   @id @default(cuid())
  projectId String   @unique
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  payload   String   // JSON string: { scores: [...], best: string }
  createdAt DateTime @default(now())
}
```

---

## 6. API Interface Specification

### 6.1 Zod Validation Schemas

```typescript
// types/api.ts

import { z } from "zod";

export const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  idea: z.string().min(1).max(5000),
  docType: z.enum(["prd", "spec"]),
  agents: z.array(
    z.object({
      name: z.string().min(1),
      role: z.enum(["writer", "reviewer"]),
      model: z.string().min(1), // e.g., "gpt-4o"
    })
  ).refine(
    (agents) => agents.filter((a) => a.role === "writer").length >= 2,
    { message: "At least 2 writers required" }
  ).refine(
    (agents) => agents.filter((a) => a.role === "reviewer").length >= 1,
    { message: "At least 1 reviewer required" }
  ),
});

export const UpdateDocumentSchema = z.object({
  content: z.string(),
});

// AI Output Schema (enforced via generateObject)
export const ReviewerOutputSchema = z.object({
  scores: z.array(
    z.object({
      writerName: z.string(),
      writerId: z.string(), // maps to Agent.id
      score: z.number().min(1).max(10),
      comment: z.string(),
    })
  ),
  best: z.object({
    writerName: z.string(),
    writerId: z.string(),
    reason: z.string(),
  }),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type ReviewerOutput = z.infer<typeof ReviewerOutputSchema>;
```

### 6.2 Endpoint Details

| Method | Route | Description | Request | Response |
|--------|-------|-------------|---------|----------|
| `POST` | `/api/projects` | Create project with agents | `CreateProjectSchema` | `{ project: Project }` |
| `GET` | `/api/projects` | List all projects | - | `{ projects: Project[] }` |
| `GET` | `/api/projects/[id]` | Get full project tree | - | `{ project, agents, documents, review }` |
| `PATCH` | `/api/projects/[id]` | Update title/idea | `{ title?, idea? }` | `{ project }` |
| `DELETE` | `/api/projects/[id]` | Delete project | - | `{ success: boolean }` |
| `POST` | `/api/projects/[id]/writer/[agentId]/stream` | **Stream** a writer | - (body unused) | `ReadableStream` (text/event-stream) |
| `POST` | `/api/projects/[id]/review` | Trigger reviewer | - | `{ review: Review }` |
| `GET` | `/api/projects/[id]/documents` | List documents | - | `{ documents: Document[] }` |
| `PATCH` | `/api/projects/[id]/documents/[docId]` | Save manual edit | `UpdateDocumentSchema` | `{ document }` |

**Critical Design Decision**: Each Writer Agent has its own streaming endpoint. The frontend calls all writer streams in parallel via `fetch()` and `ReadableStream`. This avoids multiplexing complexity and leverages Next.js Route Handlers natively.

---

## 7. Core Business Logic & Data Flow

### 7.1 State Machine Definitions

**Project Lifecycle**:
```
idle ──(user clicks generate)──> running ──(all writers & review done)──> completed
                                    │
                                    └──(any unrecoverable error)──> failed
```

**Document Lifecycle**:
```
pending ──(stream endpoint hit)──> generating ──(stream finishes)──> completed
                                           │
                                           └──(stream error)──> error
```

### 7.2 Generation Sequence (Detailed)

**Step 1: Frontend Initialization**
- User clicks "Generate" in `GenerationTrigger.tsx`.
- Zustand store sets `isGenerating = true`.
- Frontend iterates `project.agents.filter(a => a.role === "writer")` and calls `POST /api/projects/[id]/writer/[agentId]/stream` for each.

**Step 2: Writer Stream Handler** (`stream/route.ts`)
```typescript
// Pseudo-logic for Coding Agent
export async function POST(req, { params }) {
  const { id: projectId, agentId } = params;

  // 1. Validate project exists and is in 'idle' or 'completed' state (allow re-run)
  // 2. Upsert Document record: status -> 'generating', content -> ''
  // 3. Fetch project.idea and docType
  // 4. Call streamText({
  //      model: getProviderModel(agent.model),
  //      system: SYSTEM_PROMPT_WRITER,
  //      prompt: buildUserPrompt(project.idea, project.docType),
  //      onFinish: async ({ text }) => {
  //        await prisma.document.update({ where: { agentId_projectId: ... }, data: { content: text, status: 'completed' }});
  //        // Optionally check if this was the last writer -> auto-trigger review?
  //        // DECISION: Frontend drives the review trigger for simplicity.
  //      }
  //    });
  // 5. return result.toAIStreamResponse(); // Vercel AI SDK helper
}
```

**Step 3: Frontend Stream Consumption** (`useWriterStream.ts`)
- Uses native `fetch` to the stream endpoint.
- Reads `response.body` via `ReadableStreamDefaultReader`.
- Appends chunks to a local state keyed by `agentId`.
- When stream closes (reader.read() done), marks that writer as `done`.
- **Rendering**: Each writer's partial output is rendered in its own `StreamContainer` -> `DocumentViewer` (BlockNote in read-only preview mode for streaming text? Or a simple `<pre>`/Markdown preview during stream, switching to BlockNote on completion).

**Step 4: Reviewer Trigger** (`review/route.ts`)
- Frontend detects all writers are `done` (via Zustand derived state).
- Frontend calls `POST /api/projects/[id]/review`.

**Step 5: Reviewer Handler Logic**
```typescript
export async function POST(req, { params }) {
  const { id: projectId } = params;

  // 1. Verify all documents status === 'completed'
  // 2. Gather { agentName, content } for each writer document
  // 3. Call generateObject({
  //      model: getReviewerModel(), // e.g., fast/cheap model for review
  //      schema: ReviewerOutputSchema,
  //      system: SYSTEM_PROMPT_REVIEWER,
  //      prompt: buildReviewerPrompt(project.idea, documents)
  //    });
  // 4. Save result.object to Review table as JSON string
  // 5. Update Project.status -> 'completed'
  // 6. Return review payload
}
```

---

## 8. Frontend Architecture

### 8.1 Routing (`app/projects/[id]/page.tsx`)

The workspace page is the primary UI. It must conditionally render based on `project.status`.

```typescript
// app/projects/[id]/page.tsx
export default async function ProjectPage({ params }: { params: { id: string } }) {
  // Server-side prefetch? No, use client-side fetch for real-time generation status.
  return <ProjectWorkspace projectId={params.id} />;
}
```

### 8.2 Component Interface Contracts

```typescript
// components/workspace/AgentConfigurator.tsx
interface AgentConfiguratorProps {
  projectId: string;
  agents: Agent[];
  onUpdate: () => void; // Callback to refresh parent
  disabled: boolean;     // Disable edits while generating
}

// components/workspace/GenerationTrigger.tsx
interface GenerationTriggerProps {
  projectId: string;
  writers: Agent[];
  onGenerationStart: () => void;
}

// components/workspace/StreamContainer.tsx
interface StreamContainerProps {
  agent: Agent;
  streamEndpoint: string;
  onComplete: (content: string) => void;
}

// components/workspace/DocumentViewer.tsx
interface DocumentViewerProps {
  documentId: string;
  initialContent: string; // Markdown
  editable?: boolean;
  onSave?: (markdown: string) => Promise<void>;
}
```

### 8.3 State Management (Zustand)

```typescript
// store/projectStore.ts
import { create } from 'zustand';

interface ProjectState {
  project: Project | null;
  agents: Agent[];
  documents: Document[];
  review: Review | null;
  isGenerating: boolean;
  writerProgress: Record<string, 'pending' | 'streaming' | 'done' | 'error'>;
  
  setProjectData: (data: { project, agents, documents, review }) => void;
  setWriterProgress: (agentId: string, status: string) => void;
  setIsGenerating: (val: boolean) => void;
  updateDocumentContent: (docId: string, content: string) => void;
}
```

### 8.4 BlockNote Integration Strategy

BlockNote operates on a Block-based JSON structure, not raw Markdown. Since the database stores Markdown strings, a conversion layer is required.

**Implementation**:
- **Display/Edit**: Use `<BlockNoteView />` initialized with `initialContent` converted from Markdown.
- **Conversion**: On mount/editor init, use `editor.tryParseMarkdownToBlocks(content)` (available in `@blocknote/core` utilities) to populate the editor.
- **Save**: When user edits, debounce `editor.blocksToMarkdownLossy(editor.document)` and PATCH to `/api/documents/[docId]`.
- **Read-Only Mode**: During streaming, the container can show a simpler Markdown preview (e.g., `react-markdown`) for performance, switching to BlockNote once status is `completed` and user wants to edit.

```typescript
// components/workspace/DocumentViewer.tsx (Implementation Sketch)
"use client";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect, useState } from "react";

export function DocumentViewer({ initialContent, editable, onSave }: DocumentViewerProps) {
  const editor = useCreateBlockNote();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function load() {
      if (!initialContent) return;
      const blocks = await editor.tryParseMarkdownToBlocks(initialContent);
      editor.replaceBlocks(editor.document, blocks);
      setIsReady(true);
    }
    load();
  }, [initialContent, editor]);

  useEffect(() => {
    if (!editable || !onSave) return;
    const handler = setTimeout(async () => {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      await onSave(markdown);
    }, 1000);
    return () => clearTimeout(handler);
  }, [editor.document, editable, onSave]);

  if (!isReady) return <div className="p-4 text-gray-500">Loading editor...</div>;

  return <BlockNoteView editor={editor} editable={editable} />;
}
```

### 8.5 AI SDK Frontend Integration

Do **not** use `useChat` from Vercel AI SDK because we have multiple independent parallel streams, not a single chat thread.

Instead, implement a custom hook `useWriterStream` using native `fetch` + `ReadableStream` to read the Vercel AI SDK formatted stream (SSE). Alternatively, use `readStreamableValue` if the backend returns a `createStreamableValue`.

**Recommended**: The backend returns a standard Web Stream from `streamText.toAIStreamResponse()`. The frontend parses it with `AIStream` parser or simple line parsing (`data: ...`).

---

## 9. AI Layer Implementation

### 9.1 Provider Factory (`lib/ai/providers.ts`)

Map the `Agent.model` string to Vercel AI SDK provider instances.

```typescript
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

export function getProviderModel(modelId: string) {
  // Simple prefix matching or lookup map
  if (modelId.startsWith("gpt-")) return openai(modelId);
  if (modelId.startsWith("claude-")) return anthropic(modelId);
  if (modelId.startsWith("gemini-")) return google(modelId);
  throw new Error(`Unsupported model: ${modelId}`);
}
```

### 9.2 Writer Prompt (`lib/ai/prompts.ts`)

```typescript
export const SYSTEM_PROMPT_WRITER = `You are an elite technical product manager. Your task is to transform a user's rough product idea into a highly structured, implementation-ready document.
The output must be valid Markdown.
Target Audience: Coding Agents (e.g., Cursor, Claude Code). Be explicit, unambiguous, and use tables, checklists, and code blocks where appropriate.

Include these sections:
1. Executive Summary
2. Goals & Success Metrics
3. User Stories (As a... I want... So that... + Acceptance Criteria in Gherkin style if possible)
4. Functional Requirements (table with ID, Requirement, Priority)
5. Non-Functional Requirements
6. Data Model (Prisma-style schema or ER description)
7. API Spec (Method, Route, Request, Response)
8. UI/UX Notes (if applicable)

Do not add conversational filler. Start directly with the Markdown content.`;

export function buildWriterUserPrompt(idea: string, docType: "prd" | "spec") {
  return `Document Type: ${docType.toUpperCase()}\nUser Idea:\n${idea}`;
}
```

### 9.3 Reviewer Prompt & Structured Output

```typescript
export const SYSTEM_PROMPT_REVIEWER = `You are a ruthless, objective document reviewer. You evaluate technical documents based on:
- Completeness (all necessary sections present?)
- Actionability (can a coding agent implement from this without asking questions?)
- Clarity (no ambiguous language)
- Structure (proper Markdown formatting)

You will receive the original user idea and an array of documents. Output ONLY valid JSON matching the provided schema.`;

export function buildReviewerPrompt(idea: string, docs: { name: string; id: string; content: string }[]) {
  return `Original Idea: ${idea}\n\nDocuments:\n${docs.map(d => `---\nID: ${d.id}\nName: ${d.name}\nContent:\n${d.content}\n---`).join("\n")}`;
}
```

**Backend invocation**:
```typescript
const result = await generateObject({
  model: getProviderModel(reviewerAgent.model),
  schema: ReviewerOutputSchema,
  system: SYSTEM_PROMPT_REVIEWER,
  prompt: buildReviewerPrompt(project.idea, documents),
});
// result.object is typed as ReviewerOutput
```

---

## 10. Error Handling & Edge Cases

| Scenario | Strategy |
|----------|----------|
| **Writer Stream Fails** | Catch in `streamText` error handler. Update `Document.status` to `error`, `errorMsg` to error message. Frontend marks stream as `error`. Do not block other writers. |
| **Reviewer Fails** | Return HTTP 500. Frontend shows error toast. Allow manual "Retry Review" button. |
| **User Navigates Away During Gen** | Streams are server-driven. Backend continues writing to DB via `onFinish`. When user returns, `GET /api/projects/[id]` shows latest state. |
| **Agent Model Unavailable** | `getProviderModel` throws -> API route catches -> returns 400 Bad Request with clear message. |
| **Partial Stream Save** | `streamText` buffers the full text; `onFinish` writes complete text. Do not write partial chunks to DB to avoid corruption. Frontend shows partial text from stream, DB stores final text. |
| **Re-generation** | If user clicks "Generate" again, delete old `Document` and `Review` records for that project, reset `Project.status` to `running`, and start fresh. |

---

## 11. Deployment & Environment Configuration

### 11.1 Required Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"   # Local dev

# AI Providers (at least one required)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_GENERATIVE_AI_API_KEY="..."

# Optional: Turso for production SQLite
# TURSO_DATABASE_URL="libsql://..."
# TURSO_AUTH_TOKEN="..."
```

### 11.2 Vercel Configuration (`vercel.json`)

Not strictly required for Next.js, but ensure functions have adequate max duration for streaming:

```json
{
  "functions": {
    "app/api/projects/[id]/writer/[agentId]/stream/route.ts": {
      "maxDuration": 60
    },
    "app/api/projects/[id]/review/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### 11.3 Build Configuration

Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

---

## 12. Acceptance Criteria (for Coding Agent)

- [ ] `prisma migrate dev` initializes the database with all 4 models (`Project`, `Agent`, `Document`, `Review`).
- [ ] User can create a project via UI, selecting 2 Writers and 1 Reviewer with different models.
- [ ] Clicking "Generate" opens parallel HTTP connections to `/writer/[id]/stream` endpoints.
- [ ] Each writer's output appears in real-time in a distinct UI panel.
- [ ] Upon stream completion, the final Markdown is persisted in SQLite and rendered in BlockNote.
- [ ] Once all Writers show "completed", the Reviewer API auto-triggers (or manual trigger available) and returns a JSON scorecard.
- [ ] The scorecard highlights the "best" document and displays per-writer scores/comments.
- [ ] User can edit any finalized document in BlockNote; edits are saved to the database via PATCH.
- [ ] Project status transitions correctly: `idle` -> `running` -> `completed`.
- [ ] If a single writer fails, other writers continue; the user sees an error state for the failed writer only.
- [ ] The application builds successfully (`next build`) and deploys to Vercel.

---

**End of HL-SPEC**. Ready for implementation.

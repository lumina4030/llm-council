---
title: LLMCouncil-PRD
created: 2026-05-01
source: Cherry Studio
tags: 
---
## 🤖 Assistant

以下是为你撰写的 **Product Requirement Document (PRD)**。本文档采用结构化、高信息密度的格式，专为 **Coding Agent (Cursor / Claude Code / OpenCode)** 直接阅读并执行开发而设计。

---

# PRD: Multi-Agent PRD Forge (LLM-Driven PRD/Spec Generator)

## 1. Overview / 产品概述

**产品目标**：构建一个基于 LLM 多 Agent 协作的文档生成工具。产品经理（用户）输入一个粗浅的产品想法，系统自动并行调用多个 `Writer` Agent 生成适合 Coding Agent 直接阅读的 PRD + Spec 文档，随后由 `Reviewer` Agent 进行多维度打分与反馈，最终呈现最优结果。

**核心用户**：产品经理、技术负责人、独立开发者。

**成功标准**：
- 用户可在 3 分钟内完成从“想法”到“多版本 PRD”的生成。
- 生成的文档结构可直接被 Coding Agent 理解并进入开发阶段。
- 支持 1 Reviewer + N Writers (N≥2) 的强制协作模式。

---

## 2. User Flow / 核心用户流程

```text
[Project Dashboard]
    │
    ▼
[Create Agents] ──► 配置 Writer (≥2) 和 Reviewer (≥1) 的模型、System Prompt
    │
    ▼
[Create Task] ──► 输入产品想法 (Idea) + 选择本次参与的 Agents
    │
    ▼
[Validation] ──► 校验: Writers ≥ 2 AND Reviewers ≥ 1，否则阻断
    │
    ▼
[Writing Phase] ──► 并行调用所有 Writer Agents 生成 Markdown PRD
    │                   (状态: writing)
    ▼
[Review Phase] ──► 所有 Writer 完成后，Reviewer 对所有文档评分
    │                   (状态: reviewing)
    ▼
[Result Dashboard] ──► 并列展示所有文档 + 评分卡片 + 最优推荐
```

---

## 3. Functional Requirements / 功能需求

| 模块 | 需求描述 | 优先级 |
|---|---|---|
| **Agent 管理** | CRUD 配置 Agent；角色二选一 (`writer`/`reviewer`)；绑定模型提供商与模型名；自定义 System Prompt 与 Temperature。 | P0 |
| **任务创建** | 输入 Title + User Prompt (支持 Markdown)；多选 Writer (强制≥2)；多选 Reviewer (强制≥1)。 | P0 |
| **并行生成** | 任务启动后，系统并行调用所有 Writer Agent；每个 Writer 独立输出一份 Markdown 文档。 | P0 |
| **文档渲染** | 使用 `BlockNote` 渲染生成的 Markdown；支持只读模式与代码高亮。 | P0 |
| **自动评审** | Writer 全部完成后，自动触发 Reviewer；Reviewer 对每份文档输出结构化评分 (JSON)。 | P0 |
| **结果对比** | 任务结果页以 Grid 布局并列展示所有文档；右侧/底部展示评分雷达/列表。 | P0 |
| **Idea 澄清聊天** | 在创建任务前，提供 AI Chat 窗口（基于 Vercel AI SDK）帮助用户完善想法。 | P1 |
| **项目隔离** | 所有 Agents 和 Tasks 属于特定 Project，支持多项目管理。 | P1 |

---

## 4. Technical Architecture / 技术架构

### 4.1 Stack & Packages

| 层级 | 技术选型 | 说明 |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server Actions + RSC |
| Language | TypeScript 5.x | 严格模式 (`strict: true`) |
| UI Library | React 19 + HeroUI + TailwindCSS v3 | 统一 Design System |
| Markdown Editor | `blocknote` (`@blocknote/react`, `@blocknote/mantine`) | PRD 渲染与轻量编辑 |
| AI SDK | `ai` + `@ai-sdk/openai` / `@ai-sdk/anthropic` + `@ai-sdk/react` | 文本生成与 Chat UI |
| AI Chat UI | `ai-elements` (Vercel AI SDK UI) | Idea 澄清聊天组件 |
| Database | SQLite (Development) / **Turso (LibSQL)** (Production on Vercel) | Vercel Serverless 无持久化文件系统，生产必须使用 Turso 或类似 LibSQL 服务 |
| ORM / Client | `better-sqlite3` (Local) / `@libsql/client` (Prod) | 提供统一 DB 接口 |
| Hosting | Vercel | Serverless Functions |

### 4.2 Project File Structure

```
app/
├── (dashboard)/
│   ├── page.tsx                    # Project 列表
│   └── [projectId]/
│       ├── page.tsx                # Project 详情 (Agents + Tasks 总览)
│       ├── agents/
│       │   └── page.tsx            # Agent 配置页
│       └── tasks/
│           ├── new/
│           │   └── page.tsx        # 创建 Task + Idea Chat
│           └── [taskId]/
│               └── page.tsx        # Task 结果页 (Documents + Reviews)
├── api/
│   └── workflow/
│       └── route.ts                # [Core] 异步执行 Writing + Reviewing
components/
├── agents/
│   ├── AgentCard.tsx
│   └── AgentForm.tsx               # 创建/编辑 Agent 表单
├── tasks/
│   ├── TaskForm.tsx                # Task 创建表单 (含校验逻辑)
│   ├── TaskStatusBadge.tsx
│   └── IdeaChat.tsx                # Vercel AI SDK Chat 组件
├── documents/
│   ├── DocumentGrid.tsx            # 多列文档对比布局
│   └── DocumentViewer.tsx          # BlockNote 包装组件
├── reviews/
│   ├── ReviewCard.tsx
│   └── ScoreBadge.tsx
lib/
├── db/
│   ├── schema.sql                  # SQLite DDL (Source of Truth)
│   └── client.ts                   # DB 连接实例
├── ai/
│   ├── providers.ts                # AI SDK Provider 注册
│   ├── prompts.ts                  # System Prompt 常量
│   └── actions.ts                  # generateDocument / generateReview 封装
types/
└── index.ts                        # 全局 TypeScript 接口
```

---

## 5. Database Schema / 数据库设计 (SQLite)

> **部署警告**: Vercel Serverless Functions 的本地文件系统是只读且临时的。开发阶段可使用 `file:./local.db`，**生产环境必须迁移到 Turso (LibSQL)**，通过 `@libsql/client` 连接。

```sql
-- 5.1 Projects
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 5.2 Agents (Writer / Reviewer 配置)
CREATE TABLE agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('writer', 'reviewer')),
  model_provider TEXT NOT NULL,        -- e.g., 'openai', 'anthropic', 'google'
  model_name TEXT NOT NULL,            -- e.g., 'gpt-4o', 'claude-3-5-sonnet-20241022'
  system_prompt TEXT NOT NULL DEFAULT '',
  temperature REAL NOT NULL DEFAULT 0.7 CHECK(temperature BETWEEN 0 AND 2),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 5.3 Tasks (文档生成任务)
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'writing', 'reviewing', 'completed', 'failed')),
  error_message TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 5.4 Task-Agent 绑定 (N:M)
CREATE TABLE task_agents (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, agent_id)
);

-- 5.5 Documents (Writer 产出)
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',    -- Markdown content
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'generating', 'completed', 'error')),
  error_message TEXT,
  token_usage INTEGER,
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 5.6 Reviews (Reviewer 评分)
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reviewer_agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK(overall_score BETWEEN 0 AND 100),
  dimension_scores TEXT NOT NULL DEFAULT '{}', -- JSON: {"completeness":95,"clarity":88,...}
  feedback TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'error')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

---

## 6. API & Server Actions Interface / 接口定义

所有数据变更通过 **Next.js Server Actions** 进行，AI 生成长任务通过 **Route Handler** 异步执行以避免 Vercel Function 超时。

### 6.1 Server Actions (`lib/actions.ts`)

```typescript
'use server';

// Agent Management
export async function createAgent(input: CreateAgentInput): Promise<Agent>;
export async function updateAgent(id: number, input: UpdateAgentInput): Promise<Agent>;
export async function deleteAgent(id: number): Promise<void>;
export async function getAgentsByProject(projectId: number): Promise<Agent[]>;

// Task Management
export async function createTask(input: CreateTaskInput): Promise<Task>;
export async function startTask(taskId: number): Promise<{ success: boolean; message: string }>;
export async function getTaskDetail(taskId: number): Promise<TaskDetail | null>;
export async function getTasksByProject(projectId: number): Promise<Task[]>;

// Types (同步到 types/index.ts)
interface CreateAgentInput {
  projectId: number;
  name: string;
  role: 'writer' | 'reviewer';
  modelProvider: string;
  modelName: string;
  systemPrompt: string;
  temperature: number;
}

interface CreateTaskInput {
  projectId: number;
  title: string;
  userPrompt: string;
  writerIds: number[];    // length >= 2
  reviewerIds: number[];  // length >= 1
}

interface TaskDetail {
  task: Task;
  writers: { agent: Agent; document: Document | null }[];
  reviewers: { agent: Agent; reviews: (Review & { document: Document })[] }[];
}
```

### 6.2 Async Workflow Route (`app/api/workflow/route.ts`)

- **Method**: `POST`
- **Body**: `{ taskId: number }`
- **Config**: `export const maxDuration = 300;` (Vercel Pro) / 建议生产环境配置 `maxDuration` 以支持长文本生成。
- **Logic**:
 1. 读取 Task + 绑定的 Agents。
 2. **Phase 1 - Writing**: `Promise.all` 并行调用 `generateWriterDocument(taskId, agent)`。
 3. 检查是否有 Writer `error`。若有，更新 Task `status = 'failed'` 并退出。
 4. **Phase 2 - Reviewing**: 所有 Writer 完成后，更新 Task `status = 'reviewing'`。并行调用 `generateReview(taskId, reviewerAgent, document)` 对每个 Document。
 5. 全部完成后，更新 Task `status = 'completed'`。

---

## 7. AI Integration Spec / AI 集成规范

### 7.1 Provider 注册 (`lib/ai/providers.ts`)

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
// 未来可扩展 Google, Mistral 等

export const providers = {
  openai: createOpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  anthropic: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
};
```

### 7.2 Writer 生成逻辑 (`lib/ai/actions.ts`)

```typescript
import { generateText } from 'ai';
import { providers } from './providers';

export async function generateWriterDocument(task: Task, agent: Agent) {
  const model = providers[agent.modelProvider](agent.modelName);
  
  const { text, usage } = await generateText({
    model,
    system: WRITER_SYSTEM_PROMPT,       // 见 Section 8.1
    prompt: buildWriterUserPrompt(task), // 拼接 task.user_prompt + 格式要求
    temperature: agent.temperature,
    maxTokens: 8192,                    // PRD 通常较长
  });
  
  // 直接写入 documents 表
  return { content: text, tokenUsage: usage.totalTokens };
}
```

### 7.3 Reviewer 生成逻辑

必须使用 `generateObject` 强制结构化输出，避免手动解析 JSON。

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';

const ReviewSchema = z.object({
  overallScore: z.number().min(0).max(100),
  dimensions: z.object({
    completeness: z.number().min(0).max(100),
    clarity: z.number().min(0).max(100),
    technicalFeasibility: z.number().min(0).max(100),
    actionability: z.number().min(0).max(100),
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
  verdict: z.enum(['pass', 'needs_revision', 'reject']),
});

export async function generateReview(document: Document, reviewer: Agent) {
  const model = providers[reviewer.modelProvider](reviewer.modelName);
  
  const { object, usage } = await generateObject({
    model,
    schema: ReviewSchema,
    system: REVIEWER_SYSTEM_PROMPT,     // 见 Section 8.2
    prompt: buildReviewerUserPrompt(document),
    temperature: 0.3,                   // 评审需稳定、低创意
  });
  
  return { result: object, tokenUsage: usage.totalTokens };
}
```

---

## 8. Prompt Engineering / Agent 提示词模板

### 8.1 Writer System Prompt

```markdown
You are an elite Technical Product Manager and Specification Writer. Your sole purpose is to convert a user's rough product idea into a highly structured, implementation-ready Product Requirement Document (PRD) and Technical Specification.

## Target Audience
The document you generate will be fed DIRECTLY into a Coding Agent (e.g., Cursor, Claude Code, GitHub Copilot Workspace). It must be so precise that the Coding Agent can generate file structures, database schemas, and API endpoints without asking clarifying questions.

## Mandatory Output Structure (Markdown)
You MUST output valid Markdown containing the following sections in order:
1. **Overview**: One-sentence elevator pitch + 3-4 sentence detailed description.
2. **Goals**: Success metrics, user-centric objectives, and business value.
3. **User Flow**: Numbered step-by-step journey from entry to exit.
4. **Functional Requirements**: Feature list using MoSCoW method (Must have, Should have, Could have, Won't have).
5. **Technical Architecture**: Recommended stack, system diagrams (described in text), data flow.
6. **Database Schema**: SQL DDL (SQLite dialect) for ALL tables required.
7. **API Specification**: TypeScript function signatures or REST endpoints. Include request/response DTOs.
8. **UI/UX Requirements**: Component-level breakdown, layout rules, responsive behavior.
9. **Error Handling & Edge Cases**: Specific error states, validation rules, and fallback logic.
10. **Open Questions / TODOs**: Explicitly list any assumptions made due to ambiguous input.

## Rules
- Use SPECIFIC names for fields, tables, components, and variables. Do not use vague placeholders like "some data".
- Every requirement must be TESTABLE. Avoid adjectives like "fast", "intuitive", or "user-friendly". Use numbers.
- If the user's idea is ambiguous, make a reasonable assumption and STATE IT CLEARLY in "Open Questions".
- Output language must match the user's input language.
- Do not wrap the output in code blocks. Output raw Markdown only.
```

### 8.2 Reviewer System Prompt

```markdown
You are a Principal Staff Engineer and ruthless Technical Editor. You are reviewing a PRD/Spec document that was generated by an AI Writer. Your job is to determine if a Coding Agent could implement this feature WITHOUT asking clarifying questions.

## Scoring Rubric (1-100 per dimension)
1. **Completeness**: Are DB schema, API specs, UI components, and error handling ALL present?
2. **Clarity**: Is every requirement unambiguous? Are acceptance criteria concrete?
3. **Technical Feasibility**: Is the architecture sound? Are there obvious scalability or security flaws?
4. **Actionability**: Can a Coding Agent start typing code immediately? What's missing?

## Response Format
You must output a JSON object strictly following the provided schema (overallScore, dimensions, strengths, weaknesses, suggestions, verdict).

## Tone
Be brutally honest but constructive. A mediocre document should fail. Only award 90+ scores to truly exceptional, implementation-ready specs.
```

---

## 9. UI/UX Component Breakdown

### 9.1 关键组件清单

| 组件名 | 路径 | Props | 说明 |
|---|---|---|---|
| `AgentForm` | `components/agents/AgentForm.tsx` | `projectId`, `initialData?` | HeroUI `<Input>`, `<Textarea>`, `<Select>`, `<RadioGroup>` (role) |
| `TaskForm` | `components/tasks/TaskForm.tsx` | `projectId`, `agents: Agent[]` | 校验 `writerIds.length >= 2` 和 `reviewerIds.length >= 1`；提交前禁用 `start` 按钮直至条件满足 |
| `IdeaChat` | `components/tasks/IdeaChat.tsx` | `onIdeaRefined: (text)=>void` | 使用 `useChat` from `@ai-sdk/react`，底部输入框，消息列表 |
| `DocumentViewer` | `components/documents/DocumentViewer.tsx` | `content: string`, `editable?: boolean` | 初始化 BlockNote: `useCreateBlockNote({ initialContent: markdownToBlocks(content) })` |
| `DocumentGrid` | `components/documents/DocumentGrid.tsx` | `documents: Document[]`, `agents: Agent[]` | Tailwind `grid grid-cols-1 lg:grid-cols-2 gap-4` |
| `ReviewCard` | `components/reviews/ReviewCard.tsx` | `review: Review` | HeroUI `<Card>` 展示 overallScore (大字体)、verdict badge、dimensions 列表 |

### 9.2 Task Detail Page (`app/[projectId]/tasks/[taskId]/page.tsx`) 布局

```tsx
// 伪代码结构
<Tabs>
  <Tab key="documents" title="Generated Documents">
    <DocumentGrid documents={writersData} />
  </Tab>
  <Tab key="reviews" title="Review Scores">
    {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
    {/* 如果有多个 Writer，这里按 Document 分组展示评分对比表 */}
  </Tab>
</Tabs>
```

---

## 10. State Management & Logic / 状态与业务逻辑

### 10.1 Task 状态机

```text
[draft] --(startTask)--> [writing]
[writing] --(all writers success)--> [reviewing]
[writing] --(any writer fails)--> [failed]
[reviewing] --(all reviews done)--> [completed]
[reviewing] --(any review error)--> [failed]
[failed] --(retry)--> [writing]
```

### 10.2 前端轮询机制

由于 Workflow Route 是异步执行，前端在 Task Detail 页面需要轮询状态：

```typescript
// components/tasks/TaskPoller.tsx
useEffect(() => {
  if (!['writing', 'reviewing'].includes(task.status)) return;
  
  const interval = setInterval(() => {
    router.refresh(); // 触发 Server Component 重新获取数据
    // 或使用 mutate() 如果采用 SWR/React Query
  }, 3000);
  
  return () => clearInterval(interval);
}, [task.status]);
```

### 10.3 BlockNote 初始化逻辑

Writer 产出的是 Markdown，但 BlockNote 使用 Block 结构。必须在加载时转换：

```typescript
import { useCreateBlockNote } from "@blocknote/react";
import { markdownToBlocks } from "@blocknote/core";

const editor = useCreateBlockNote({
  initialContent: await markdownToBlocks(content),
});

// 渲染时
return <BlockNoteView editor={editor} editable={false} theme="light" />;
```

---

## 11. Error Handling & Edge Cases / 异常与边界

| 场景 | 处理策略 |
|---|---|
| **Agent 数量不足** | `createTask` / `startTask` 服务端与客户端双重校验，不满足时阻断并明确提示："至少选择 2 个 Writer 和 1 个 Reviewer"。 |
| **Writer 生成超时/失败** | 捕获 `generateText` 异常，将 `documents.status` 更新为 `error`，写入 `error_message`。Task 状态置为 `failed`，允许用户点击 "Retry Failed Writers"。 |
| **Reviewer 返回无效 JSON** | 使用 `generateObject` + Zod Schema 兜底。若仍失败，降级为文本解析或标记 Review 为 error。 |
| **Vercel Function Timeout** | Workflow Route 配置 `maxDuration = 300`；若预期更长，需拆分为多个 Route (per-Agent webhook) 或使用外部队列 (QStash)。 |
| **AI Provider API Key 缺失** | 在 Environment Variable 校验中间件中拦截，页面顶部显示全局 Banner 提示配置。 |
| **并发写入 SQLite** | 本地开发使用 WAL 模式 (`PRAGMA journal_mode=WAL`)；生产使用 Turso (LibSQL) 天然支持并发。 |

---

## 12. Implementation Roadmap / 实施路线图

### Phase 1: MVP Core Loop (P0)
1. 初始化 Next.js + HeroUI + Tailwind + BlockNote。
2. 配置 SQLite Schema 与 DB Client。
3. 实现 Agent CRUD 页面。
4. 实现 Task 创建表单（含 Writer≥2, Reviewer≥1 校验）。
5. 实现 `/api/workflow` Route：串行执行 Writing -> Reviewing。
6. 实现 Task Detail 页：Document Grid + BlockNote 渲染 + Review Score 展示。

### Phase 2: Polish & Chat (P1)
7. 集成 `ai-elements` (Vercel AI SDK Chat) 到 Task 创建页作为 "Idea Clarifier"。
8. 前端轮询优化 (SWR / Server Action polling)。
9. 支持多 Reviewer 取平均分。
10. 生产环境迁移到 Turso (`@libsql/client`) 并更新部署文档。

### Phase 3: Advanced (P2)
11. Document 版本历史与 Diff 对比。
12. 一键导出 Markdown / 复制到 Clipboard。
13. 支持用户上传图片/文件作为 Idea 输入参考。

---

## 13. Environment Variables / 环境变量

```bash
# Database
DATABASE_URL="file:./local.db"              # Dev only
DATABASE_URL="libsql://...turso.io"         # Production
DATABASE_AUTH_TOKEN="..."                   # Turso only

# AI Providers (至少配置一个)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

**下一步行动建议**：
如果你希望我现在直接生成**可执行的初始化代码**（如 `schema.sql` 的迁移脚本、`lib/db/client.ts` 的封装、或 `app/api/workflow/route.ts` 的完整实现），请告诉我从哪个模块开始。

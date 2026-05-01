# LLM-Council AI PRD Copilot

## Project Overview

Multi-agent PRD/Spec generator using Next.js 15 App Router. Users configure 2+ Writer agents and 1+ Reviewer agent to generate documents from raw ideas.

## Tech Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- HeroUI v3 (custom styled components - HeroUI API differs from docs)
- Vercel AI SDK (streamText, generateObject)
- Prisma v7 + LibSQL adapter (SQLite dev, Turso prod-ready)
- BlockNote (document editor)
- Zustand (state management)

## Database

- SQLite via Prisma with LibSQL adapter
- Models: Project, Agent, Document, Review
- Initialize: `npx prisma migrate dev`
- Prisma client: `lib/prisma.ts` exports singleton

## Key Components

- `app/page.tsx` - Project list
- `app/projects/[id]/page.tsx` - Project workspace
- `components/workspace/GenerationTrigger.tsx` - Start parallel generation
- `components/workspace/StreamContainer.tsx` - Per-writer streaming UI
- `components/workspace/DocumentViewer.tsx` - BlockNote editor

## API Routes

- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project with agents/documents
- `POST /api/projects/[id]/writer/[agentId]/stream` - Stream writer output
- `POST /api/projects/[id]/review` - Run reviewer with generateObject

## State

- `store/projectStore.ts` - Zustand store for project/agents/documents/review

## Development

```bash
npm run dev    # Start dev server
npm run build  # Production build
```

## Notes

- HeroUI v3 uses `Card.Header`, `Card.Content`, `Card.Footer` (not Body)
- Button component uses `variant` (primary/secondary/soft/ghost/outline/tertiary) not `color`
- Use standard HTML elements with Tailwind for HeroUI compatibility issues
- BlockNote `useCreateBlockNote` for editor initialization
---

## 2026-05-01 Implementation Notes

### Completed
- Multi-agent PRD/Spec generator with parallel Writer + Reviewer
- 52 unit tests passing
- Deployed to Vercel: https://llm-council-green.vercel.app
- GitHub: https://github.com/lumina4030/llm-council

### Important Lesson
Coding agent does NOT automatically commit to git. After implementation:
1. `git add -A && git commit -m "..." && git push`
2. Verify GitHub has the latest code before declaring done

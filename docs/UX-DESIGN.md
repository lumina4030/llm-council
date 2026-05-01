# LLM-Council UX Design Specification
**Version**: 1.0
**Date**: 2026-05-01
**Status**: Implementation Reference

---

## 1. User Flow

```
[Dashboard] → [Create Project Modal] → [Workspace Idle] → [Workspace Generating] → [Workspace Completed]
                    ↓                      ↓                    ↓                    ↓
              配置 Agents           配置≥2W + ≥1R        SSE Streaming          Review Results
```

### State Machine
- **Project Status**: `idle` → `running` → `completed` / `failed` / `partial`
- **Document Status**: `pending` → `generating` → `completed` / `error`
- **Review Status**: `pending` → `reviewing` → `completed` / `error`

---

## 2. Screen Specifications

### Screen 1: Dashboard (`/`)
- Project list with cards
- Each card shows: title, type, status badge, agents count, last updated
- Filter dropdown: All / PRD / Spec
- "+ New" button opens CreateProjectModal

### Screen 2: Create Project Modal
**Layout**: Full-screen overlay with centered modal (max-w-2xl)

**Fields**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Project Title | text | Yes | min 1 char |
| Document Type | radio (PRD/Spec) | Yes | default PRD |
| Your Raw Idea | textarea | Yes | min 1 char |
| Writers | dynamic list | Yes | ≥2 writers |
| Reviewers | dynamic list | Yes | ≥1 reviewer |

**Agent Row**:
- Name input (text)
- Model dropdown (GPT-4o, GPT-4o Mini, Claude 3.5 Sonnet, Claude 3 Opus, Gemini 2.0 Flash, Gemini 1.5 Pro)
- Delete button (disabled if would drop below minimum)

**Actions**: Cancel, Create & Generate

### Screen 3: Workspace Idle (`/projects/[id]`)
**Layout**: 3-column grid (Agents sidebar + Main content + Review panel)

**Components**:
- Header: Back button, Project title, Status badge
- Left sidebar: AgentConfigurator, GenerationTrigger
- Main: StreamContainer cards for each Writer
- Right panel: ReviewPanel (empty state)

**Status Badge Colors**:
- `idle`: gray
- `running`: yellow
- `completed`: green
- `failed`: red
- `partial`: orange

### Screen 4: Workspace Generating
**StreamContainer Updates**:
- Progress bar with percentage: `Writer-A [████████░░░░░░░░░░░░] 48%`
- Real-time Markdown preview as chunks arrive
- Reviewer card shows "Standby" with waiting message

### Screen 5: Workspace Completed
**ReviewPanel Shows**:
- Best Document card (highlighted with trophy icon)
- Score cards for each writer with visual bars: `████████░░ 82%`
- Best choice recommendation

**StreamContainer Actions**:
- Edit button → BlockNote editor
- Copy MD button → clipboard

### Screen 6: BlockNote Editor
- Full BlockNote editing experience
- Save Draft button
- Toolbar: Paragraph, H1, H2, Bold, Italic, Bullet, Numbered, Link, Code

### Screen 7: Error State
**Writer Failure**:
- Error badge with error message
- Retry button on the card
- Other writers continue

**Review Failure**:
- Error toast notification
- Manual "Retry Review" button

---

## 3. Component Specifications

### StreamContainer
**Props**: `agent: Agent`, `progress: WriterProgress`, `content?: string`

**States**:
| Progress | Display |
|----------|---------|
| `pending` | Gray badge, "Waiting", empty |
| `streaming` | Yellow badge, animated spinner, progress bar with %, live content preview |
| `done` | Green badge with checkmark, full content, Edit/Copy MD buttons |
| `error` | Red badge, error icon, error message, Retry button |

### ReviewPanel
**Props**: `reviewPayload: string | null`

**Empty State**: "No review yet. Generate documents first."

**Completed State**:
- Best Document card (yellow border, trophy icon)
- Score bars: filled blocks + percentage
- Writer name + score badge

### GenerationTrigger
**Button States**:
- Idle: "▶ Start Generation" (warning color)
- Generating: "⏹ Stop" (danger color) + progress bar

---

## 4. Design Tokens

### Colors
```css
--color-primary: #f59e0b;       /* warning-500 */
--color-success: #22c55e;       /* green-500 */
--color-danger: #ef4444;        /* red-500 */
--color-warning: #f59e0b;       /* amber-500 */
```

### Status Badge Styles
```css
.idle    { bg-gray-100, text-gray-700 }
.running { bg-yellow-100, text-yellow-700 }
.completed { bg-green-100, text-green-700 }
.failed  { bg-red-100, text-red-700 }
.partial { bg-orange-100, text-orange-700 }
```

---

## 5. API Integration Points

| Action | Endpoint | Method |
|--------|----------|--------|
| Create Project | `/api/projects` | POST |
| Get Project | `/api/projects/[id]` | GET |
| Start Generation | `/api/projects/[id]/writer/[agentId]/stream` | POST |
| Trigger Review | `/api/projects/[id]/review` | POST |
| Update Document | `/api/projects/[id]/documents/[docId]` | PATCH |

---

## 6. Implementation Checklist

- [x] Dashboard with project list
- [x] CreateProjectModal with validation
- [x] Workspace page with agent cards
- [x] StreamContainer with progress states
- [x] BlockNote DocumentViewer
- [x] ReviewPanel with scores
- [ ] Progress percentage in StreamContainer
- [ ] Edit/Copy MD buttons
- [ ] Retry button for failed writers
- [ ] Stop generation button
- [ ] Export Markdown button
- [ ] Regenerate button

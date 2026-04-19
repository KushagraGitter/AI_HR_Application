# Architecture — AI HR Platform

## System Overview

An AI-powered hiring department built as a Multi-Agent System (MaaS). Five specialist agents replace three human HR roles — Screener, Outreacher, Scheduler — while the HR Manager retains control via a Kanban-based management UI.

```
HR Manager (human)
  |
  |-- [generate_jd]       writes job descriptions
  |-- [score_resume]       screens candidate resumes
  |-- [rank_and_shortlist] filters by score threshold
  |-- [draft_outreach]     composes personalized emails
  |-- [assign_slots]       matches interviews to calendars
```

---

## Agent Team

| Agent | Type | Role | Replaces |
|-------|------|------|----------|
| **generate_jd** | LLM | Expands bullet-point requirements into a structured job description | HR writing JDs manually |
| **score_resume** | LLM | Evaluates each resume against JD, returns score (0-100), reasoning, and 4-criteria breakdown | Human screener reading resumes |
| **rank_and_shortlist** | Logic | Sorts by score, filters by configurable threshold, caps at top N | Human shortlisting |
| **draft_outreach** | LLM | Writes personalized outreach emails per candidate with embedded availability links | Recruiter writing emails |
| **assign_slots** | Logic | Greedy-matches candidate availability with panel calendars, generates .ics files | Scheduler coordinating calendars |

3 of 5 agents use LLM calls (OpenRouter → gpt-4o-mini). 2 are deterministic logic.

---

## Pipeline Flow

```
Candidate applies (POST /api/candidates)
       │
       ▼
  ┌─────────────┐    ┌──────────────────┐
  │ score_resume │───▶│ rank_and_shortlist│
  │   (LLM)     │    │   (Logic)        │
  └─────────────┘    └──────────────────┘
       │                      │
       │         status: "scored"
       ▼
  HR clicks "Draft Outreach"
       │
       ▼
  ┌───────────────┐
  │ draft_outreach │
  │    (LLM)       │
  └───────────────┘
       │
       │   status: "shortlisted"
       ▼
  HR clicks "Send Email" → Resend API → candidate inbox
       │
       │   status: "outreach_sent"
       ▼
  Candidate submits availability
       │
       │   status: "availability_received"
       ▼
  HR clicks "Schedule"
       │
       ▼
  ┌──────────────┐
  │ assign_slots  │
  │   (Logic)     │
  └──────────────┘
       │
       │   status: "scheduled" + .ics generated
       ▼
  Interview confirmed
```

---

## LangGraph Composition

Instead of one monolithic graph, the system composes **4 sub-graphs** triggered independently by the UI. Each runs only the nodes needed for that pipeline stage.

| Sub-graph | Trigger | Nodes |
|-----------|---------|-------|
| `buildJdGraph()` | HR creates job | `generate_jd` |
| `buildScoringGraph()` | Candidate applies | `score_resume` → `rank_and_shortlist` |
| `buildOutreachGraph()` | HR drafts outreach | `draft_outreach` |
| `buildSchedulingGraph()` | HR schedules | `assign_slots` |

All sub-graphs share a single state annotation (`HRAgentAnnotation`) with an **append-only trace** accumulator.

---

## State & Memory

```
HRAgentAnnotation {
  jobId, jobTitle, requirements, jd     ← job context
  candidates: ScoredCandidate[]         ← all candidates with scores
  shortlist: ScoredCandidate[]          ← filtered candidates
  outreachDrafts: OutreachDraft[]       ← drafted emails + tokens
  availabilityResponses[]               ← candidate time slots
  scheduledSlots: ScheduledSlot[]       ← final assignments + .ics
  trace: AgentTraceNode[]               ← append-only execution log
}
```

- **Within a run:** Full context flows between nodes via shared state. No lossy summarization.
- **Across runs:** Results persist to SQLite via Prisma. Application layer rehydrates state for subsequent graph invocations.
- **Trace accumulation:** The `trace` field uses an append reducer — every node contributes to a cumulative execution log across all sub-graph invocations for a job.

---

## Data Model

```
Job  ──1:N──▶  Candidate  (full lifecycle on one row)
Job  ──1:N──▶  AgentTrace (accumulated execution log)
```

**Candidate** stores the entire pipeline state as a flat, denormalized record: identity, score, reasoning, criteria breakdown, email draft, availability token, availability slots, scheduled slot, panel member, and .ics content.

**Status lifecycle:** `applied` → `scored` → `shortlisted` → `outreach_sent` → `availability_received` → `scheduled`

---

## Observability

Each agent node emits an `AgentTraceNode` record:

```typescript
{
  nodeName: "score_resume",
  inputSummary: "3 candidates scored against JD",
  outputSummary: "Scores: Vikram=94, Arjun=88, Neha=52 | Avg: 81",
  durationMs: 2847
}
```

Traces are persisted per-job and surfaced in:
- **Agent Panel** — shows each agent's run status, type (LLM/Logic), last execution summary and duration
- **Activity Log** — chronological timeline of all agent executions for a job
- **Candidate Logs** — per-candidate filtered view of agent activity relevant to that individual

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, Tailwind CSS v4 |
| Database | SQLite via Prisma ORM |
| AI Framework | LangChain + LangGraph |
| LLM | OpenRouter → gpt-4o-mini |
| Email | Resend |
| Language | TypeScript 5 |

---

## File Structure

```
lib/agent/
  state.ts                Shared state annotation
  graph.ts                4 compiled sub-graphs
  llm.ts                  OpenRouter ChatOpenAI config
  panelData.ts            Panel member availability
  nodes/
    generateJd.ts         JD generation (LLM)
    scoreResume.ts        Resume scoring (LLM)
    rankAndShortlist.ts   Ranking (deterministic)
    draftOutreach.ts      Email drafting (LLM)
    assignSlots.ts        Slot matching (deterministic)

app/
  hr/                     HR Manager portal
    jobs/[id]/            Kanban pipeline + agent panel + activity log
  candidates/             Candidate portal
    applications/         Status tracking + inline availability
  api/                    REST endpoints triggering sub-graphs

prisma/
  schema.prisma           Job, Candidate, AgentTrace models
```

---

## Two Portals

| Portal | Route | Purpose |
|--------|-------|---------|
| **HR Manager** | `/hr` | Kanban board, agent panel, settings, bulk actions, candidate detail with logs |
| **Candidate** | `/candidates` | Browse jobs, apply, track application status, confirm availability |

Both are separate route groups with distinct navigation and styling — HR uses indigo/violet accents, Candidates use teal/mint.

# MaaS Evaluation — AI HR Platform

## Product Summary

AI-powered HR recruitment pipeline that replaces three human roles (Screener, Outreacher, Scheduler) with a team of AI agents built on LangGraph. The system handles job description generation, resume scoring, candidate ranking, outreach email drafting, availability collection, and interview scheduling.

**Declared domain:** Hiring — end-to-end recruitment pipeline from job creation to interview scheduling.

---

## Current Score: 72 / 164

| Parameter | Weight | Max | Level | Score | Notes |
|-----------|--------|-----|-------|-------|-------|
| Working product shipping real output | 20x | 80 | L3 | 48 | Working output on staged surface only |
| Agent org structure | 5x | 20 | L2 | 8 | Specialists with hardcoded handoffs, no manager |
| Observability | 7x | 28 | L3 | 14 | Custom trace panel, no token/cost tracking |
| Evaluation and iteration | 5x | 20 | L1 | 0 | No evals exist |
| Agent handoffs and memory | 2x | 8 | L3 | 4 | Short-term memory within task, DB persistence |
| Cost and latency per task | 1x | 4 | L3-L4 | 3 | Cheap model, but sequential loops scale poorly |
| Management UI | 1x | 4 | L4 | 3 | Clean Kanban + agent panel, but no role creation |
| **Total** | | **164** | | **72** | |

---

## Detailed Assessment by Parameter

### 1. Working Product Shipping Real Output (48/80 — L3)

**What works:**
- Full candidate lifecycle: applied -> scored -> shortlisted -> outreach_sent -> availability_received -> scheduled
- AI generates job descriptions from minimal input (title + bullet points)
- AI scores resumes 0-100 with 4-criteria breakdown and reasoning
- AI drafts personalized outreach emails with availability links
- Real email delivery via Resend (sends actual emails)
- Deterministic interview scheduling with .ics calendar file generation
- Candidate portal with job browsing, application submission, and "My Applications" status tracking
- HR Kanban board with full pipeline visibility and inline actions

**Why L3, not L4:**
- Runs on localhost with SQLite — not deployed to a production URL
- Resend is in test mode (emails redirected to owner account, not actual candidates)
- Every pipeline step requires manual HR clicks: Draft Outreach, Send Email, Schedule. No autonomous end-to-end execution
- Panel member availability is hardcoded, not from a real calendar
- No integration with a real ATS (Greenhouse, Lever, etc.)

**What would move to L4 (60 pts):**
- Deploy to a real URL (Vercel/Railway)
- Verify a sending domain on Resend so emails reach actual recipients
- Automate the pipeline: candidate applies -> agent scores -> if above threshold, auto-draft + auto-send outreach with zero HR intervention
- That autonomous flow completing during live judging would demonstrate L5 + overflow

**What would move to L5 + overflow (80+ pts):**
- Fully autonomous: mentor submits a resume, email lands in inbox within 2 minutes, no human in the loop
- Each additional task completed autonomously during judging = +20 points (uncapped)

---

### 2. Agent Org Structure (8/20 — L2)

**Current architecture:**

```
API Routes (application code, not an agent)
  |
  |-- buildJdGraph():        generate_jd -> END
  |-- buildScoringGraph():   score_resume -> rank_and_shortlist -> END
  |-- buildOutreachGraph():  draft_outreach -> END
  |-- buildSchedulingGraph():assign_slots -> END
```

**5 specialist agents:**

| Agent | Type | LLM? | What it does |
|-------|------|------|-------------|
| generate_jd | Specialist | Yes | Writes full JD from title + requirements |
| score_resume | Specialist | Yes | Scores each resume 0-100 with criteria breakdown |
| rank_and_shortlist | Specialist | No | Sorts by score, filters by threshold, caps at 5 |
| draft_outreach | Specialist | Yes | Writes personalized emails per candidate |
| assign_slots | Specialist | No | Greedy slot matching + .ics generation |

**Why L2, not L3:**
- No manager agent — the application code (API routes) decides which sub-graph to run
- All graphs are linear with static edges — no conditional routing
- No dynamic delegation — the pipeline is the same regardless of input
- No branching: if all candidates score below threshold, the outreach graph still runs (and produces nothing)

**What would move to L3 (12 pts):**
- Add clear role separation with a named manager agent
- Static routing is fine for L3

**What would move to L4 (16 pts):**
- Manager agent uses LLM to plan subtasks: "Score 5 candidates, shortlist top 2, draft outreach"
- `addConditionalEdges` in LangGraph: skip outreach if no candidates above threshold, skip scheduling if no availability received
- Manager reviews outputs before passing to next specialist

**What would move to L5 (20 pts):**
- Manager spawns sub-specialists on the fly (e.g., creates a "technical screening" agent for engineering roles vs. a "culture fit" agent for people roles)
- Agents escalate to manager when stuck (e.g., score_resume can't parse LLM output, escalates instead of silently defaulting to 50)
- Roles self-adjust: if a job gets 100 applications, manager parallelizes scoring across multiple agent instances

---

### 3. Observability (14/28 — L3)

**What exists:**

| Feature | Status |
|---------|--------|
| Per-node trace capture (nodeName, inputSummary, outputSummary, durationMs) | Yes |
| Trace persisted to DB (SQLite, per-job) | Yes |
| Trace retrieval API (`GET /api/trace/{jobId}`) | Yes |
| Visual trace timeline in UI (TracePanel component) | Yes |
| Agent status panel (run/not-run, LLM/Logic type badges, last run info) | Yes |
| Execution log with node names + durations | Yes |

**What is missing:**

| Feature | Status | Impact |
|---------|--------|--------|
| Token counts (prompt_tokens, completion_tokens) | Not tracked | Cannot audit LLM usage |
| Cost estimation ($) per node | Not tracked | Cannot budget or detect cost anomalies |
| Model name per call | Not tracked (hardcoded globally) | Cannot compare model performance |
| Error traces | Errors silently caught, fallback to score=50 | Quality failures are invisible |
| Per-LLM-call latency (vs. per-node) | Only node-level | score_resume loops N candidates but reports one aggregate duration |
| Trace tree / span hierarchy | Flat list | Cannot see who called whom |
| Filter by agent or task | Not available | Cannot isolate specific agent behavior |
| Compare two runs side-by-side | Not available | Cannot diff prompt changes |
| Alerts on failure or cost spike | Not available | No proactive monitoring |
| LangSmith / LangFuse / OpenTelemetry | None | No standard APM integration |

**What would move to L4 (21 pts):**
- Capture `usage.prompt_tokens` and `usage.completion_tokens` from OpenRouter responses
- Calculate cost per node using model pricing
- Store token counts + cost in `AgentTraceNode`
- Show cost-per-candidate and total-cost-per-job in the Agent Panel UI
- Add error field to traces (instead of silent fallback)
- Enable filtering traces by agent type

**What would move to L5 (28 pts):**
- Integrate with LangSmith or LangFuse for production-grade tracing
- Side-by-side run comparison (e.g., compare scoring results between gpt-4o-mini and gpt-4o)
- Alerts: notify if a scoring run takes >10s, costs >$0.50, or error rate exceeds 10%
- Search across all trace runs

---

### 4. Evaluation and Iteration (0/20 — L1)

**This is the biggest gap. Nothing exists.**

| Eval Capability | Status |
|-----------------|--------|
| Test files | None |
| Gold-standard eval dataset | None |
| Automated eval pipeline | None |
| Prompt versioning | Prompts are inline strings in node files |
| Regression detection | None |
| Human feedback capture | None |
| A/B testing | None |
| Quality assertions on LLM output | Only JSON parse check, fallback to score=50 |

**What would move to L2 (4 pts):**
- Manual spot-checks documented ("we ran 5 resumes and the scores looked reasonable")

**What would move to L3 (10 pts):**
- Create `evals/` directory with gold-standard test cases:
  - 5 resumes with expected score ranges for a specific JD
  - 3 JD inputs with expected output structure (must have sections: About, Responsibilities, Requirements, Nice to Have)
  - 2 outreach email inputs with expected tone/length constraints
- A script `npm run eval` that runs agents on test cases and asserts:
  - Score is 0-100
  - JSON parses correctly
  - criteriaBreakdown has exactly 4 items
  - JD has all 4 sections
  - Email is under 120 words
- Store results in `evals/results/` for comparison

**What would move to L4 (16 pts):**
- CI-style automated eval: runs on every prompt change, fails if quality drops
- Versioned prompts in `prompts/v1/score_resume.txt`, `prompts/v2/score_resume.txt`
- Eval metrics tracked over time (average score accuracy, hallucination rate, format compliance)

**What would move to L5 (20 pts):**
- Failed runs auto-added to eval set (closed-loop learning)
- Version-controlled prompts with git history
- Dashboard showing quality metrics across prompt versions
- Measurable gains documented per iteration

---

### 5. Agent Handoffs and Memory (4/8 — L3)

**Current memory model:**

| Layer | What exists | What's missing |
|-------|-------------|----------------|
| Working memory (within a task) | LangGraph shared state (`HRAgentAnnotation`) — full context passed between nodes | No summarization, entire state forwarded |
| Short-term memory (within a session) | State lives for duration of one graph invocation | No LangGraph checkpointing enabled |
| Persistent storage (across runs) | SQLite via Prisma — candidates, scores, traces, drafts all persisted | Application layer rehydrates state; agents have no awareness of prior runs |
| Cross-job memory | None | Agent doesn't know candidate applied to 3 other jobs |
| Learning memory | None | Agent doesn't learn from past scoring patterns |

**How handoffs work:**
- Shared `HRAgentAnnotation` state object — each node reads from and writes to the same state
- Context is NOT lossy: full JD text, full resume text, full criteria breakdown all flow forward
- But there is no explicit handoff protocol: no "reason for handoff", no confidence signal, no structured metadata about what the next agent needs

**What would move to L4 (6 pts):**
- Cross-job memory: when scoring a candidate who applied to multiple roles, the agent references their previous scores and reasoning
- HR preferences persist: if HR consistently lowers threshold for engineering roles, store that preference

**What would move to L5 (8 pts):**
- Hierarchical memory:
  - **Working memory:** current task state (exists)
  - **Episodic memory:** past scoring runs, outreach results (which candidates responded, which didn't)
  - **Semantic memory:** domain facts ("our team values system design over leetcode", "we prefer candidates with open source contributions") stored in a knowledge base that influences scoring prompts

---

### 6. Cost and Latency Per Task (3/4 — L3-L4)

**Model:** `openai/gpt-4o-mini` via OpenRouter

**Cost per operation (approximate):**

| Operation | LLM Calls | Est. Tokens | Est. Cost | Est. Latency |
|-----------|-----------|-------------|-----------|-------------|
| Generate JD | 1 | ~800 | $0.0002 | ~2s |
| Score 1 resume | 1 | ~1200 | $0.0003 | ~3s |
| Score 10 resumes | 10 (sequential) | ~12,000 | $0.003 | ~30s |
| Rank + shortlist | 0 | 0 | $0 | <1ms |
| Draft 1 outreach | 1 | ~600 | $0.0002 | ~2s |
| Assign slots | 0 | 0 | $0 | <1ms |
| **Full pipeline (1 candidate)** | **3** | **~2,600** | **~$0.001** | **~7s** |
| **Full pipeline (10 candidates)** | **13-15** | **~15,000** | **~$0.005** | **~40s** |

**Why L3-L4, not L5:**
- Individual task cost is well under $0.10 (L5 territory for cost)
- But latency for 10+ candidates exceeds 30 seconds due to sequential LLM calls
- No parallelization in `score_resume` or `draft_outreach` (uses `for...of` loop, not `Promise.all`)
- The lower tier (latency) governs, capping at L3-L4

**What would move to L5 (4 pts):**
- Parallelize LLM calls in `score_resume` using `Promise.all` — scoring 10 candidates in ~3s instead of ~30s
- Pre-warm LLM connections
- End-to-end single candidate: apply -> score -> shortlist -> draft -> send should complete in under 60 seconds

---

### 7. Management UI (3/4 — L4)

**What exists:**

| Feature | Status |
|---------|--------|
| Landing page with portal selection (HR / Candidate) | Yes |
| HR Dashboard with job listing and pipeline status counts | Yes |
| Kanban board with 6-column pipeline view | Yes |
| Agent Panel sidebar showing all 4 agents with status, type, description, last run | Yes |
| Minimum score threshold slider (settings) | Yes |
| Bulk actions: Draft Outreach, Schedule All | Yes |
| Candidate detail modal with Overview / Resume / Outreach tabs | Yes |
| Inline availability form in candidate portal | Yes |
| Job creation with AI JD generation | Yes |
| Dark theme with consistent design system | Yes |

**Why L4, not L5:**
- A non-engineer can operate the system with one walkthrough
- But you cannot onboard a new agent role from the UI
- No way to define new tools, guardrails, or prompt templates through the interface
- No way to add a new pipeline stage without code changes

**What would move to L5 (4 pts):**
- UI for defining new agent roles: name, description, prompt template, tools, guardrails
- Non-engineer volunteer can configure a new screening criterion or modify outreach tone from the UI in under 10 minutes
- Settings panel for model selection, temperature, max tokens per agent

---

## Gap Summary — Fastest Path to Higher Score

### Priority-ordered improvements by points recoverable:

| # | Action | Effort | Points Gained | New Total |
|---|--------|--------|---------------|-----------|
| 1 | **Add eval script** with 3-5 test cases + assertions on score range, JSON format, criteria count | 1-2 hours | +10 (L1->L3) | 82 |
| 2 | **Autonomous pipeline** — candidate applies, agent auto-scores, auto-drafts, auto-sends email if above threshold, zero HR clicks | 1-2 hours | +16 (L3->L4 on real output) | 98 |
| 3 | **Add manager agent** node with LLM planning + conditional edges in LangGraph | 2-3 hours | +8 (L2->L4) | 106 |
| 4 | **Track token counts + cost** in traces, display in Agent Panel | 1 hour | +7 (L3->L4) | 113 |
| 5 | **Deploy to real URL** (Vercel) + verify Resend domain | 30 min | +8 (supports L4 on real surfaces) | 121 |
| 6 | **Parallelize LLM calls** in score_resume and draft_outreach | 30 min | +1 (L3->L5 on latency) | 122 |
| 7 | **Cross-job memory** — reference candidate's past applications when scoring | 1-2 hours | +2 (L3->L4) | 124 |
| 8 | **Agent role creation from UI** — settings for prompt templates + tools | 2-3 hours | +1 (L4->L5) | 125 |

**Maximum achievable with ~10 hours of work: ~125 / 164 (76%)**

### For overflow points (past L5 on real output):
Each additional real task completed autonomously during judging adds +1 pt x 20x weight = **+20 points uncapped**. To maximize overflow:
- Deploy live
- Make pipeline fully autonomous
- Have 5 test candidates ready to submit during demo
- Each one that goes from application -> email in inbox autonomously = +20 points

---

## Architecture Reference

### Agent Pipeline

```
Candidate Applies (POST /api/candidates)
       |
       v
  [score_resume]  -- LLM: evaluates resume vs JD, returns score + reasoning
       |
       v
  [rank_and_shortlist]  -- Logic: sort by score, filter >= threshold
       |
       v
  HR clicks "Draft Outreach" (POST /api/outreach/draft)
       |
       v
  [draft_outreach]  -- LLM: writes personalized email + generates availability token
       |
       v
  HR clicks "Send Email" (POST /api/outreach/send)
       |
       v
  [Resend API]  -- Sends actual email to candidate
       |
       v
  Candidate submits availability (POST /api/availability)
       |
       v
  HR clicks "Schedule" (POST /api/schedule)
       |
       v
  [assign_slots]  -- Logic: greedy matching + .ics generation
       |
       v
  Interview Scheduled
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, Tailwind CSS v4 |
| Database | SQLite via Prisma ORM |
| AI Framework | LangChain + LangGraph |
| LLM | OpenRouter -> gpt-4o-mini |
| Email | Resend |
| Language | TypeScript 5 |

### File Map

```
lib/agent/
  state.ts              Shared state annotation (HRAgentAnnotation)
  graph.ts              4 compiled sub-graphs
  llm.ts                OpenRouter ChatOpenAI factory
  panelData.ts          Hardcoded panel availability
  nodes/
    generateJd.ts       generate_jd — LLM
    scoreResume.ts      score_resume — LLM
    rankAndShortlist.ts rank_and_shortlist — deterministic
    draftOutreach.ts    draft_outreach — LLM
    assignSlots.ts      assign_slots — deterministic

app/hr/                 HR Manager portal
  page.tsx              Dashboard with job listing
  jobs/new/             Job creation with AI JD generation
  jobs/[id]/            Kanban pipeline view
    KanbanView.tsx      Orchestrator component
    KanbanBoard.tsx     6-column board
    AgentPanel.tsx      Left sidebar with agents + settings + traces
    CandidateModal.tsx  Detail modal with tabs

app/candidates/         Candidate portal
  page.tsx              Browse open positions
  jobs/[id]/            View JD + apply
  applications/         My Applications (status tracking + inline availability)

app/api/                API routes
  jobs/                 Job CRUD + JD generation
  candidates/           Application submission + scoring
  candidates/me/        Candidate self-service lookup
  outreach/draft/       AI outreach drafting
  outreach/send/        Email sending via Resend
  availability/         Availability submission
  schedule/             Interview scheduling
  trace/                Agent execution traces
```

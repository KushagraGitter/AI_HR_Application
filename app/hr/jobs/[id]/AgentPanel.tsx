"use client"

import type { AgentTraceNode } from "@/types"

interface CandidateData {
  id: string
  status: string
  score: number
}

interface Props {
  traceNodes: AgentTraceNode[]
  candidates: CandidateData[]
  minScore: number
  onMinScoreChange: (score: number) => void
  onBulkDraft: () => void
  onScheduleAll: () => void
  actionLoading: string
  autoRefresh?: boolean
  onToggleAutoRefresh?: () => void
  lastUpdate?: Date | null
}

function formatTimestamp(iso?: string): string {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
  } catch {
    return ""
  }
}

const AGENTS = [
  {
    name: "Resume Scorer",
    node: "score_resume",
    description: "Evaluates candidate resumes against the job description using AI. Assigns a score 0-100 with reasoning and per-criteria breakdown.",
    type: "LLM",
  },
  {
    name: "Rank & Shortlist",
    node: "rank_and_shortlist",
    description: "Sorts candidates by score and filters those meeting the minimum threshold. Pure logic, no AI call.",
    type: "Logic",
  },
  {
    name: "Outreach Drafter",
    node: "draft_outreach",
    description: "Generates personalized outreach emails for shortlisted candidates with an availability link. Uses AI to write warm, concise emails.",
    type: "LLM",
  },
  {
    name: "Slot Scheduler",
    node: "assign_slots",
    description: "Matches candidate availability with panel members using a greedy algorithm. Generates calendar (.ics) invites. No AI call.",
    type: "Logic",
  },
]

export default function AgentPanel({
  traceNodes,
  candidates,
  minScore,
  onMinScoreChange,
  onBulkDraft,
  onScheduleAll,
  actionLoading,
  autoRefresh = true,
  onToggleAutoRefresh,
  lastUpdate,
}: Props) {
  const scoredCount = candidates.filter((c) => c.status === "scored").length
  const eligibleCount = candidates.filter((c) => c.status === "scored" && c.score >= minScore).length
  const availableCount = candidates.filter((c) => c.status === "availability_received").length

  // Build a set of agent nodes that have run
  const ranNodes = new Set(traceNodes.map((n) => n.nodeName))

  return (
    <div className="p-4 space-y-5">
      {/* Live status bar */}
      <div className="flex items-center justify-between rounded-xl bg-neutral-950/60 border border-cardborder px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
          />
          <span className="text-[11px] font-mono font-semibold text-fg">
            {autoRefresh ? "LIVE" : "PAUSED"}
          </span>
          <span className="text-[10px] font-mono text-muted">
            · {lastUpdate ? formatTimestamp(lastUpdate.toISOString()) : "--:--:--"}
          </span>
        </div>
        {onToggleAutoRefresh && (
          <button
            onClick={onToggleAutoRefresh}
            className="text-[10px] font-mono text-muted hover:text-fg px-2 py-0.5 rounded"
            title={autoRefresh ? "Pause auto-refresh" : "Resume auto-refresh"}
          >
            {autoRefresh ? "❚❚ pause" : "▶ resume"}
          </button>
        )}
      </div>

      {/* Settings */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
          Settings
        </h3>
        <div className="rounded-xl bg-surface border border-cardborder p-3">
          <label className="block text-xs font-medium text-fg/70 mb-2">
            Minimum Score Threshold
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => onMinScoreChange(Number(e.target.value))}
              className="flex-1 h-1.5 bg-cardborder rounded-full appearance-none cursor-pointer accent-accent"
            />
            <span className="text-sm font-bold text-accentlt w-8 text-right">{minScore}</span>
          </div>
          <p className="text-[10px] text-muted mt-1.5">
            Candidates scoring &ge; {minScore} will be eligible for outreach.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
          Actions
        </h3>
        <div className="space-y-2">
          <button
            onClick={onBulkDraft}
            disabled={eligibleCount === 0 || actionLoading === "bulk-drafting"}
            className="w-full rounded-lg bg-accent/90 px-3 py-2 text-xs font-medium text-white hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition text-left"
          >
            {actionLoading === "bulk-drafting" ? (
              <span>Drafting outreach...</span>
            ) : (
              <>
                Draft Outreach
                <span className="block text-[10px] opacity-70 mt-0.5">
                  {eligibleCount} of {scoredCount} scored candidates eligible (&ge;{minScore})
                </span>
              </>
            )}
          </button>
          <button
            onClick={onScheduleAll}
            disabled={availableCount === 0 || actionLoading === "scheduling"}
            className="w-full rounded-lg bg-ctext/80 px-3 py-2 text-xs font-medium text-white hover:bg-ctext/90 disabled:opacity-40 disabled:cursor-not-allowed transition text-left"
          >
            {actionLoading === "scheduling" ? (
              <span>Scheduling...</span>
            ) : (
              <>
                Schedule Interviews
                <span className="block text-[10px] opacity-70 mt-0.5">
                  {availableCount} candidate{availableCount !== 1 ? "s" : ""} with availability
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Agents */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
          Agents
        </h3>
        <div className="space-y-2">
          {AGENTS.map((agent) => {
            const hasRun = ranNodes.has(agent.node)
            const traceEntry = traceNodes.filter((n) => n.nodeName === agent.node)
            const lastRun = traceEntry.length > 0 ? traceEntry[traceEntry.length - 1] : null

            return (
              <div
                key={agent.node}
                className="rounded-xl bg-surface border border-cardborder p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`h-2 w-2 rounded-full ${hasRun ? "bg-emerald-400" : "bg-cardborder"}`} />
                  <span className="text-xs font-semibold text-fg">{agent.name}</span>
                  <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    agent.type === "LLM"
                      ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20"
                      : "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/20"
                  }`}>
                    {agent.type}
                  </span>
                </div>
                <p className="text-[10px] text-muted leading-relaxed">{agent.description}</p>
                {lastRun && (
                  <div className="mt-2 pt-2 border-t border-cardborder">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted">Last run</span>
                      <span className="font-mono text-accentlt">{lastRun.durationMs}ms</span>
                    </div>
                    <p className="text-[10px] text-muted mt-0.5 truncate" title={lastRun.outputSummary}>
                      {lastRun.outputSummary}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

"use client"

interface CandidateData {
  id: string
  name: string
  email: string
  status: string
  score: number
  reasoning: string
  scheduledSlot: string
  scheduledPanel: string
}

interface Props {
  candidates: CandidateData[]
  loading: boolean
  minScore: number
  onCardClick: (id: string) => void
}

const COLUMNS = [
  { key: "applied",                label: "Applied",         color: "bg-slate-400",   accent: "border-slate-500/30" },
  { key: "scored",                 label: "Scored",          color: "bg-blue-400",    accent: "border-blue-500/30" },
  { key: "shortlisted",           label: "Shortlisted",     color: "bg-amber-400",   accent: "border-amber-500/30" },
  { key: "outreach_sent",         label: "Outreach Sent",   color: "bg-violet-400",  accent: "border-violet-500/30" },
  { key: "availability_received", label: "Availability In", color: "bg-cyan-400",    accent: "border-cyan-500/30" },
  { key: "scheduled",             label: "Scheduled",       color: "bg-emerald-400", accent: "border-emerald-500/30" },
]

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-400"
  if (score >= 70) return "text-blue-400"
  if (score >= 50) return "text-amber-400"
  return "text-red-400"
}

function formatSlot(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  } catch {
    return iso
  }
}

export default function KanbanBoard({ candidates, loading, minScore, onCardClick }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted">Loading pipeline...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-3 p-3">
      {COLUMNS.map((col) => {
        const items = candidates.filter((c) => c.status === col.key)

        return (
          <div key={col.key} className="flex flex-col w-[220px] shrink-0">
            {/* Column header */}
            <div className={`flex items-center gap-2 px-3 py-2 mb-2 rounded-lg border ${col.accent} bg-surface`}>
              <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
              <span className="text-xs font-semibold text-fg">{col.label}</span>
              <span className="ml-auto text-[10px] font-mono text-muted bg-cardborder/50 px-1.5 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>

            {/* Column body */}
            <div className="flex-1 space-y-2 overflow-y-auto pr-1 pb-2">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-cardborder p-4 text-center">
                  <p className="text-[10px] text-muted/50">No candidates</p>
                </div>
              ) : (
                items.map((c) => {
                  const belowThreshold = col.key === "scored" && c.score < minScore

                  return (
                    <button
                      key={c.id}
                      onClick={() => onCardClick(c.id)}
                      className={`w-full text-left rounded-xl border bg-card/80 p-3 hover:bg-cardhover transition-all duration-150 cursor-pointer group ${
                        belowThreshold
                          ? "border-red-500/20 opacity-60"
                          : "border-cardborder hover:border-accent/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h4 className="text-xs font-semibold text-fg group-hover:text-accentlt transition truncate">
                          {c.name}
                        </h4>
                        {c.score > 0 && (
                          <span className={`text-xs font-bold shrink-0 ${scoreColor(c.score)}`}>
                            {c.score}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted truncate">{c.email}</p>

                      {/* Status-specific details */}
                      {col.key === "scored" && belowThreshold && (
                        <p className="text-[9px] text-red-400/80 mt-1.5">Below threshold ({minScore})</p>
                      )}
                      {col.key === "scored" && !belowThreshold && (
                        <p className="text-[9px] text-emerald-400/70 mt-1.5">Eligible for outreach</p>
                      )}
                      {c.reasoning && col.key !== "applied" && (
                        <p className="text-[10px] text-muted/70 mt-1.5 line-clamp-2">{c.reasoning}</p>
                      )}
                      {col.key === "scheduled" && c.scheduledSlot && (
                        <div className="mt-1.5 pt-1.5 border-t border-cardborder">
                          <p className="text-[10px] text-emerald-400/80">{formatSlot(c.scheduledSlot)}</p>
                          <p className="text-[9px] text-muted">{c.scheduledPanel}</p>
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

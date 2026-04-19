"use client"

import { useEffect, useRef } from "react"
import type { AgentTraceNode } from "@/types"

interface Props {
  traceNodes: AgentTraceNode[]
  autoRefresh?: boolean
  lastUpdate?: Date | null
  onToggleAutoRefresh?: () => void
}

const ACTOR_STYLES: Record<string, { label: string; color: string }> = {
  hr:          { label: "HR",        color: "text-neutral-400" },
  system:      { label: "SYSTEM",    color: "text-sky-400" },
  screener:    { label: "SCREENER",  color: "text-blue-400" },
  outreacher:  { label: "OUTREACH",  color: "text-purple-400" },
  scheduler:   { label: "SCHEDULER", color: "text-amber-400" },
  candidate:   { label: "CANDIDATE", color: "text-green-400" },
}

const LEVEL_TEXT: Record<string, string> = {
  info:    "text-neutral-300",
  action:  "text-neutral-100",
  success: "text-green-300",
  warn:    "text-amber-300",
  error:   "text-red-300",
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

export default function ActivityLogPanel({
  traceNodes,
  autoRefresh = true,
  lastUpdate,
  onToggleAutoRefresh,
}: Props) {
  const logRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  // Auto-scroll to bottom when new entries arrive (if user is near the bottom)
  useEffect(() => {
    if (traceNodes.length === prevCountRef.current) return
    prevCountRef.current = traceNodes.length
    const el = logRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [traceNodes])

  return (
    <div className="flex flex-col h-full rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-200 overflow-hidden">
      {/* Terminal title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-900 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          </div>
          <span className="text-xs font-mono text-neutral-400 ml-2">agent_activity.log</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-[11px] font-mono ${autoRefresh ? "text-green-400" : "text-amber-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${autoRefresh ? "bg-green-400 animate-pulse" : "bg-amber-400"}`} />
            {autoRefresh ? "LIVE" : "PAUSED"}
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
            · {lastUpdate ? formatTimestamp(lastUpdate.toISOString()) : "--:--:--"}
          </span>
          {onToggleAutoRefresh && (
            <button
              onClick={onToggleAutoRefresh}
              className="text-[11px] font-mono text-neutral-500 hover:text-neutral-300 px-1.5"
              title={autoRefresh ? "Pause" : "Resume"}
            >
              {autoRefresh ? "❚❚" : "▶"}
            </button>
          )}
          <span className="text-[10px] font-mono text-neutral-500 tabular-nums">
            {traceNodes.length}
          </span>
        </div>
      </div>

      {/* Log stream */}
      <div
        ref={logRef}
        className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed space-y-1 min-h-0"
      >
        {traceNodes.length === 0 ? (
          <div className="text-neutral-500 italic">
            Waiting for agent activity...
          </div>
        ) : (
          traceNodes.map((node, i) => {
            const actor = ACTOR_STYLES[node.actor ?? "system"] ?? ACTOR_STYLES.system
            const levelStyle = LEVEL_TEXT[node.level ?? "info"] ?? LEVEL_TEXT.info
            const time = formatTimestamp(node.timestamp)
            const text = node.message ?? node.outputSummary ?? node.nodeName

            return (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-neutral-600 shrink-0 tabular-nums text-[11px]">{time}</span>
                <span className={`${actor.color} shrink-0 font-semibold w-[84px] text-[11px]`}>
                  [{actor.label}]
                </span>
                <span className="shrink-0 w-5 text-center">{node.icon ?? "·"}</span>
                <span className={`${levelStyle} break-words flex-1`}>{text}</span>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-800 bg-neutral-900 px-4 py-1.5 text-[11px] font-mono text-neutral-500 flex justify-between shrink-0">
        <span>agent_activity.log</span>
        <span>poll: 2000ms</span>
      </div>
    </div>
  )
}

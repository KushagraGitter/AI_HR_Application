"use client"

import { useEffect, useRef, useState } from "react"
import type { AgentTraceNode } from "@/types"

interface Props {
  jobId: string
  /** Poll interval in ms. Default 1000. */
  pollMs?: number
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
  info:    "text-neutral-200",
  action:  "text-neutral-100",
  success: "text-green-300",
  warn:    "text-amber-300",
  error:   "text-red-300",
}

function formatTime(iso?: string): string {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    const h = String(d.getHours()).padStart(2, "0")
    const m = String(d.getMinutes()).padStart(2, "0")
    const s = String(d.getSeconds()).padStart(2, "0")
    return `${h}:${m}:${s}`
  } catch {
    return ""
  }
}

export default function LiveLogPanel({ jobId, pollMs = 1000 }: Props) {
  const [logs, setLogs] = useState<AgentTraceNode[]>([])
  const [paused, setPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const previousCountRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (paused) return
      try {
        const res = await fetch(`/api/trace/${jobId}`, { cache: "no-store" })
        const data = await res.json()
        if (!cancelled) setLogs(data.nodes ?? [])
      } catch {
        // ignore transient errors
      }
    }
    load()
    const interval = setInterval(load, pollMs)
    return () => { cancelled = true; clearInterval(interval) }
  }, [jobId, pollMs, paused])

  // Auto-scroll to bottom when new logs arrive (only if we are near the bottom already)
  useEffect(() => {
    if (logs.length === previousCountRef.current) return
    previousCountRef.current = logs.length
    const el = scrollRef.current
    if (!el) return
    // Only auto-scroll if user is near the bottom already
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (nearBottom) {
      el.scrollTop = el.scrollHeight
    }
  }, [logs])

  return (
    <div className="sticky top-6 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-200 shadow-lg overflow-hidden flex flex-col h-[calc(100vh-6rem)]">
      {/* Terminal title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          </div>
          <span className="text-xs font-mono text-neutral-400 ml-2">agent_activity.log</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-[11px] font-mono ${paused ? "text-amber-400" : "text-green-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${paused ? "bg-amber-400" : "bg-green-400 animate-pulse"}`} />
            {paused ? "PAUSED" : "LIVE"}
          </span>
          <button
            onClick={() => setPaused((p) => !p)}
            className="text-[11px] font-mono text-neutral-500 hover:text-neutral-300 px-1.5"
          >
            {paused ? "▶" : "❚❚"}
          </button>
          <span className="text-[11px] font-mono text-neutral-500">
            {logs.length} {logs.length === 1 ? "event" : "events"}
          </span>
        </div>
      </div>

      {/* Log stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed space-y-1.5"
      >
        {logs.length === 0 ? (
          <div className="text-neutral-500 italic">
            Waiting for agent activity...
          </div>
        ) : (
          logs.map((log, i) => {
            const actor = ACTOR_STYLES[log.actor ?? "system"] ?? ACTOR_STYLES.system
            const levelStyle = LEVEL_TEXT[log.level ?? "info"] ?? LEVEL_TEXT.info
            const time = formatTime(log.timestamp)
            const text = log.message ?? log.outputSummary ?? log.nodeName

            return (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-neutral-600 shrink-0 tabular-nums">{time}</span>
                <span className={`${actor.color} shrink-0 font-semibold w-[84px]`}>
                  [{actor.label}]
                </span>
                <span className="shrink-0 w-5 text-center">{log.icon ?? "·"}</span>
                <span className={`${levelStyle} break-words`}>{text}</span>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-800 bg-neutral-900 px-4 py-1.5 text-[11px] font-mono text-neutral-500 flex justify-between">
        <span>job: {jobId.slice(0, 10)}...</span>
        <span>poll: {pollMs}ms</span>
      </div>
    </div>
  )
}

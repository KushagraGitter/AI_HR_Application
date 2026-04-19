"use client"

import { useEffect, useState } from "react"
import type { AgentTraceNode } from "@/types"

interface Props {
  jobId: string
  refreshKey?: number
}

export default function TracePanel({ jobId, refreshKey }: Props) {
  const [nodes, setNodes] = useState<AgentTraceNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/trace/${jobId}`, { cache: "no-store" })
        const data = await res.json()
        if (!cancelled) setNodes(data.nodes ?? [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [jobId, refreshKey])

  return (
    <div className="sticky top-6 rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-neutral-500">
          Agent Trace
        </h3>
        <span className="text-xs text-neutral-400">{nodes.length} {nodes.length === 1 ? "step" : "steps"}</span>
      </div>

      {loading && nodes.length === 0 ? (
        <p className="text-sm text-neutral-400">Loading...</p>
      ) : nodes.length === 0 ? (
        <p className="text-sm text-neutral-400">Agent has not run yet.</p>
      ) : (
        <div className="relative space-y-4">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-neutral-200" />
          {nodes.map((node, i) => (
            <div key={i} className="relative pl-6">
              <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-neutral-900 ring-4 ring-white" />
              <div className="flex items-start justify-between gap-2 mb-1">
                <code className="text-xs font-mono font-semibold text-neutral-900">{node.nodeName}</code>
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                  {node.durationMs}ms
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                <span className="font-medium text-neutral-600">in</span>  {node.inputSummary}
              </p>
              <p className="text-[11px] text-neutral-500 leading-relaxed mt-0.5">
                <span className="font-medium text-neutral-600">out</span> {node.outputSummary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

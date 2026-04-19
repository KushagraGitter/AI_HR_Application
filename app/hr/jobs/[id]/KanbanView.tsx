"use client"

import { useCallback, useEffect, useState } from "react"
import AgentPanel from "./AgentPanel"
import KanbanBoard from "./KanbanBoard"
import CandidateModal from "./CandidateModal"
import ActivityLogPanel from "./ActivityLogPanel"
import type { AgentTraceNode } from "@/types"

interface CandidateData {
  id: string
  name: string
  email: string
  resume: string
  linkedinUrl: string
  githubUrl: string
  status: string
  score: number
  reasoning: string
  criteriaBreakdown: { criterion: string; score: number; comment: string }[]
  emailDraft: string
  availabilityToken: string
  availabilitySlots: string[]
  scheduledSlot: string
  scheduledPanel: string
  icsFile: string
}

interface Props {
  jobId: string
  jobTitle: string
}

export default function KanbanView({ jobId, jobTitle }: Props) {
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [traceNodes, setTraceNodes] = useState<AgentTraceNode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [minScore, setMinScore] = useState(70)
  const [actionLoading, setActionLoading] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [candidatesRes, traceRes] = await Promise.all([
        fetch(`/api/candidates?jobId=${jobId}`, { cache: "no-store" }),
        fetch(`/api/trace/${jobId}`, { cache: "no-store" }),
      ])
      const candidatesData = await candidatesRes.json()
      const traceData = await traceRes.json()
      setCandidates(candidatesData)
      setTraceNodes(traceData.nodes ?? [])
      setLastUpdate(new Date())
    } catch {
      console.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { loadData() }, [loadData])

  // Auto-refresh every 2s so HR sees statuses flip + new logs in real-time
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(loadData, 2000)
    return () => clearInterval(interval)
  }, [loadData, autoRefresh])

  const selectedCandidate = candidates.find((c) => c.id === selectedId) ?? null

  async function handleDraftOutreach(candidateId: string) {
    setActionLoading("drafting")
    try {
      const res = await fetch("/api/outreach/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, candidateIds: [candidateId] }),
      })
      if (!res.ok) throw new Error("Draft failed")
      await loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading("")
    }
  }

  async function handleBulkDraftOutreach() {
    const eligible = candidates.filter(
      (c) => c.status === "scored" && c.score >= minScore
    )
    if (eligible.length === 0) return
    setActionLoading("bulk-drafting")
    try {
      const res = await fetch("/api/outreach/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, candidateIds: eligible.map((c) => c.id) }),
      })
      if (!res.ok) throw new Error("Bulk draft failed")
      await loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading("")
    }
  }

  async function handleSendEmail(candidateId: string): Promise<{ messageId?: string; actualTo?: string; redirected?: boolean } | null> {
    setActionLoading("sending")
    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Send failed")
      await loadData()
      return { messageId: data.messageId, actualTo: data.actualTo, redirected: data.redirected }
    } catch (err) {
      console.error(err)
      return null
    } finally {
      setActionLoading("")
    }
  }

  async function handleScheduleAll() {
    setActionLoading("scheduling")
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })
      if (!res.ok) throw new Error("Scheduling failed")
      await loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading("")
    }
  }

  return (
    <div className="flex flex-1 gap-0 overflow-hidden rounded-t-2xl border border-cardborder bg-card/30 min-w-0 min-h-0">
      {/* Agent Panel - Left fixed */}
      <div className="w-[280px] shrink-0 border-r border-cardborder bg-card/60 overflow-y-auto">
        <AgentPanel
          traceNodes={traceNodes}
          candidates={candidates}
          minScore={minScore}
          onMinScoreChange={setMinScore}
          onBulkDraft={handleBulkDraftOutreach}
          onScheduleAll={handleScheduleAll}
          actionLoading={actionLoading}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
          lastUpdate={lastUpdate}
        />
      </div>

      {/* Kanban Board - fills remaining width, 6 equal columns */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <KanbanBoard
          candidates={candidates}
          loading={loading}
          minScore={minScore}
          onCardClick={setSelectedId}
        />
      </div>

      {/* Activity Log - Right fixed */}
      <div className="w-[420px] shrink-0 border-l border-cardborder p-3 bg-card/30">
        <ActivityLogPanel
          traceNodes={traceNodes}
          autoRefresh={autoRefresh}
          lastUpdate={lastUpdate}
          onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
        />
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          minScore={minScore}
          actionLoading={actionLoading}
          traceNodes={traceNodes}
          onClose={() => setSelectedId(null)}
          onDraftOutreach={handleDraftOutreach}
          onSendEmail={handleSendEmail}
          onScheduleAll={handleScheduleAll}
        />
      )}
    </div>
  )
}

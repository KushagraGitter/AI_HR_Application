"use client"

import { useCallback, useEffect, useState } from "react"
import CandidateCard from "@/components/CandidateCard"
import OutreachCard from "@/components/OutreachCard"
import LiveLogPanel from "@/components/LiveLogPanel"
import type { ScoredCandidate } from "@/types"

interface DbCandidate extends ScoredCandidate {
  emailDraft: string
  availabilityToken: string
}

interface Props {
  jobId: string
}

export default function RankingClient({ jobId }: Props) {
  const [candidates, setCandidates] = useState<DbCandidate[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/candidates?jobId=${jobId}`, { cache: "no-store" })
      const data = await res.json()
      setCandidates(data)
    } catch {
      setError("Failed to load candidates")
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { load() }, [load])

  // Poll candidates every 2s so HR sees statuses flip as autopilot progresses.
  // The LiveLogPanel polls its own trace endpoint at 1s.
  useEffect(() => {
    const interval = setInterval(load, 2000)
    return () => clearInterval(interval)
  }, [load])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleDraftOutreach() {
    if (selected.size === 0) return
    setDrafting(true)
    setError("")
    try {
      const res = await fetch("/api/outreach/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, candidateIds: [...selected] }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Draft failed")
      }
      await load()
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft failed")
    } finally {
      setDrafting(false)
    }
  }

  const withDrafts = candidates.filter((c) => c.emailDraft && c.availabilityToken)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-6">
      <div className="space-y-6">
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 flex items-start gap-3">
          <div className="mt-0.5 h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-900">Autopilot On</p>
            <p className="text-xs text-purple-800 mt-0.5">
              Candidates scoring ≥ 70 are automatically emailed with an availability link.
              When they submit slots, the scheduler assigns a panel member and confirms instantly.
              No HR action required until final approval.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Candidates {candidates.length > 0 && <span className="text-neutral-400 font-normal">({candidates.length})</span>}
            </h2>
            <button
              onClick={handleDraftOutreach}
              disabled={selected.size === 0 || drafting}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed transition"
              title="Manual override — normally autopilot handles this"
            >
              {drafting
                ? "Agent is drafting..."
                : selected.size === 0
                ? "Manual Draft (override)"
                : `Manual Draft for ${selected.size}`}
            </button>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-neutral-500">Loading candidates...</p>
          ) : candidates.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-white p-8 text-center">
              <p className="text-sm text-neutral-500">
                No candidates yet. Share the application link to collect applications.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((c) => (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  checked={selected.has(c.id)}
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </div>
          )}
        </div>

        {withDrafts.length > 0 && (
          <div className="pt-4 border-t border-neutral-200">
            <h2 className="text-lg font-semibold mb-4">Outreach Drafts</h2>
            <div className="space-y-3">
              {withDrafts.map((c) => (
                <OutreachCard
                  key={c.id}
                  candidateId={c.id}
                  candidateName={c.name}
                  candidateEmail={c.email}
                  emailDraft={c.emailDraft}
                  availabilityToken={c.availabilityToken}
                  alreadySent={["outreach_sent", "availability_received", "scheduled"].includes(c.status)}
                  onSent={load}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <aside>
        <LiveLogPanel jobId={jobId} pollMs={1000} />
      </aside>
    </div>
  )
}

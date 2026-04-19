"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import StatusBadge from "@/components/StatusBadge"

interface JobWithCounts {
  id: string
  title: string
  createdAt: string
  counts: Record<string, number>
  total: number
}

interface RawJob {
  id: string
  title: string
  createdAt: string
  _count?: { candidates: number }
}

interface RawCandidate {
  id: string
  jobId: string
  status: string
}

function formatTimestamp(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
}

export default function JobsList() {
  const [jobs, setJobs] = useState<JobWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const loadData = useCallback(async () => {
    try {
      const jobsRes = await fetch("/api/jobs", { cache: "no-store" })
      const rawJobs: RawJob[] = await jobsRes.json()

      // For each job, fetch candidates in parallel to compute per-status counts
      const enriched = await Promise.all(
        rawJobs.map(async (job) => {
          const cRes = await fetch(`/api/candidates?jobId=${job.id}`, { cache: "no-store" })
          const cands: RawCandidate[] = await cRes.json()
          const counts: Record<string, number> = {}
          for (const c of cands) counts[c.status] = (counts[c.status] ?? 0) + 1
          return {
            id: job.id,
            title: job.title,
            createdAt: job.createdAt,
            counts,
            total: cands.length,
          }
        }),
      )

      setJobs(enriched)
      setLastUpdate(new Date())
    } catch {
      console.error("Failed to load jobs")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(loadData, 3000)
    return () => clearInterval(interval)
  }, [loadData, autoRefresh])

  return (
    <div className="max-w-6xl w-full mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Dashboard</h1>
          <p className="text-muted mt-1">All jobs and candidate pipeline status.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-neutral-950/40 border border-cardborder px-3 py-1.5">
            <span
              className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
            />
            <span className="text-[11px] font-mono font-semibold text-fg">
              {autoRefresh ? "LIVE" : "PAUSED"}
            </span>
            <span className="text-[10px] font-mono text-muted">
              · {lastUpdate ? formatTimestamp(lastUpdate) : "--:--:--"}
            </span>
            <button
              onClick={() => setAutoRefresh((v) => !v)}
              className="ml-1 text-[10px] font-mono text-muted hover:text-fg px-1"
              title={autoRefresh ? "Pause auto-refresh" : "Resume auto-refresh"}
            >
              {autoRefresh ? "❚❚" : "▶"}
            </button>
          </div>
          <Link
            href="/hr/jobs/new"
            className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition shadow-[0_0_20px_rgba(108,92,231,0.2)]"
          >
            + New Job
          </Link>
        </div>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="rounded-2xl border border-cardborder bg-card/30 p-8 text-center">
          <p className="text-sm text-muted">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-cardborder bg-card/50 p-12 text-center">
          <p className="text-muted mb-4">No jobs yet. Create your first one to see the agent in action.</p>
          <Link
            href="/hr/jobs/new"
            className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition shadow-[0_0_20px_rgba(108,92,231,0.2)]"
          >
            + Create Your First Job
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-cardborder bg-card/70 p-6 hover:bg-cardhover hover:border-accent/20 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-fg">{job.title}</h2>
                  <p className="text-sm text-muted mt-0.5">
                    {job.total} {job.total === 1 ? "candidate" : "candidates"} · Created{" "}
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/hr/jobs/${job.id}`}
                    className="text-sm text-white bg-accent hover:bg-accent/90 px-3 py-1.5 rounded-lg transition"
                  >
                    Open Pipeline →
                  </Link>
                </div>
              </div>

              {job.total > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-cardborder">
                  {Object.entries(job.counts).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-1.5">
                      <StatusBadge status={status} />
                      <span className="text-sm font-medium text-muted">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

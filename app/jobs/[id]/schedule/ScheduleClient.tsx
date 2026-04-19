"use client"

import { useCallback, useEffect, useState } from "react"

interface SlotData {
  candidateId: string
  candidateName: string
  candidateEmail?: string
  panelMember: string
  slot: string
  icsFile: string
}

interface ReadyCandidate {
  id: string
  name: string
  email: string
  status: string
}

interface Props {
  jobId: string
}

function formatSlot(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString("en-US", {
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

function downloadIcs(icsContent: string, candidateName: string) {
  const blob = new Blob([icsContent], { type: "text/calendar" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `interview-${candidateName.replace(/\s+/g, "-")}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function ScheduleClient({ jobId }: Props) {
  const [slots, setSlots] = useState<SlotData[]>([])
  const [readyCount, setReadyCount] = useState(0)
  const [totalScheduled, setTotalScheduled] = useState(0)
  const [loading, setLoading] = useState(true)
  const [scheduling, setScheduling] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [scheduleRes, candidatesRes] = await Promise.all([
        fetch(`/api/schedule?jobId=${jobId}`, { cache: "no-store" }),
        fetch(`/api/candidates?jobId=${jobId}`, { cache: "no-store" }),
      ])
      const scheduleData = await scheduleRes.json()
      const candidatesData: ReadyCandidate[] = await candidatesRes.json()
      setSlots(scheduleData.slots ?? [])
      setTotalScheduled(scheduleData.slots?.length ?? 0)
      setReadyCount(candidatesData.filter((c) => c.status === "availability_received").length)
    } catch {
      setError("Failed to load schedule")
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { load() }, [load])

  async function handleSchedule() {
    setScheduling(true)
    setError("")
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Scheduling failed")
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scheduling failed")
    } finally {
      setScheduling(false)
    }
  }

  return (
    <div>
      <div className="rounded-lg border border-neutral-200 bg-white p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600">
              {readyCount} candidate{readyCount === 1 ? "" : "s"} ready to schedule ·{" "}
              {totalScheduled} already scheduled
            </p>
          </div>
          <button
            onClick={handleSchedule}
            disabled={readyCount === 0 || scheduling}
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition"
          >
            {scheduling ? "Agent is assigning slots..." : "Schedule All Ready Candidates"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : slots.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">
            No scheduled interviews yet. Candidates must submit availability first.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((s) => (
            <div
              key={s.candidateId}
              className="rounded-lg border border-neutral-200 bg-white p-5 flex items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{s.candidateName}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    ✓ Scheduled
                  </span>
                </div>
                <p className="text-sm text-neutral-500">{s.candidateEmail}</p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-neutral-400">Panel</span>
                    <p className="font-medium">{s.panelMember}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-neutral-400">Time</span>
                    <p className="font-medium">{formatSlot(s.slot)}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => downloadIcs(s.icsFile, s.candidateName)}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
              >
                ↓ Download .ics
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

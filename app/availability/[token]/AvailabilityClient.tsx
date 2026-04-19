"use client"

import { useEffect, useState } from "react"

interface Info {
  candidateName: string
  jobTitle: string
  alreadySubmitted: boolean
}

function generateSlots(): { iso: string; label: string }[] {
  // Use hardcoded slots matching panel data in /lib/agent/panelData.ts
  // This ensures the scheduler actually finds overlap during the demo
  const slots = [
    "2026-04-22T10:00:00",
    "2026-04-22T14:00:00",
    "2026-04-22T15:00:00",
    "2026-04-23T11:00:00",
    "2026-04-23T14:00:00",
    "2026-04-24T10:00:00",
    "2026-04-24T11:00:00",
    "2026-04-24T15:00:00",
    "2026-04-25T10:00:00",
    "2026-04-25T14:00:00",
  ]
  return slots.map((iso) => ({
    iso,
    label: new Date(iso).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  }))
}

interface Props {
  token: string
}

export default function AvailabilityClient({ token }: Props) {
  const [info, setInfo] = useState<Info | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const slots = generateSlots()

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/availability/${token}`, { cache: "no-store" })
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        const data = await res.json()
        setInfo(data)
        if (data.alreadySubmitted) setSubmitted(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  function toggle(iso: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(iso)) next.delete(iso)
      else next.add(iso)
      return next
    })
  }

  async function handleSubmit() {
    if (selected.size === 0) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, slots: [...selected] }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Submission failed")
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-center text-neutral-500 mt-12">Loading...</p>

  if (notFound) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center mt-12">
        <h1 className="text-xl font-semibold text-red-900 mb-2">Invalid or Expired Link</h1>
        <p className="text-sm text-red-700">
          This availability link is not valid. Please check your email for the correct link.
        </p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center mt-12">
        <div className="text-4xl mb-3">✓</div>
        <h1 className="text-xl font-semibold text-green-900 mb-2">Thank you, {info?.candidateName}</h1>
        <p className="text-sm text-green-800">
          We have received your availability. We will confirm your interview slot shortly via email.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Hi {info?.candidateName},</h1>
      <p className="text-neutral-600 mb-8">
        Please select all times when you are available for the interview for{" "}
        <strong>{info?.jobTitle}</strong>. We will match you with a panel member.
      </p>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="font-semibold mb-4">Available slots ({selected.size} selected)</h2>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {slots.map((s) => (
            <label
              key={s.iso}
              className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer transition ${
                selected.has(s.iso)
                  ? "border-neutral-900 bg-neutral-50"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(s.iso)}
                onChange={() => toggle(s.iso)}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              />
              <span className="text-sm">{s.label}</span>
            </label>
          ))}
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={selected.size === 0 || submitting}
          className="w-full rounded-md bg-neutral-900 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition"
        >
          {submitting
            ? "Submitting..."
            : selected.size === 0
            ? "Select at least one slot"
            : `Confirm ${selected.size} Available Slot${selected.size === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>
  )
}

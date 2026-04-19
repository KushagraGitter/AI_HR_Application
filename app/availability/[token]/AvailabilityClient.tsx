"use client"

import { useEffect, useState } from "react"

interface Info {
  candidateName: string
  jobTitle: string
  alreadySubmitted: boolean
}

function generateSlots(): { iso: string; label: string }[] {
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

  if (loading) return <p className="text-center text-muted mt-12">Loading...</p>

  if (notFound) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center mt-12">
        <h1 className="text-xl font-semibold text-red-300 mb-2">Invalid or Expired Link</h1>
        <p className="text-sm text-red-400/80">
          This availability link is not valid. Please check your email for the correct link.
        </p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center mt-12">
        <div className="text-4xl mb-3 text-emerald-400">&#10003;</div>
        <h1 className="text-xl font-semibold text-emerald-300 mb-2">Thank you, {info?.candidateName}</h1>
        <p className="text-sm text-emerald-400/80">
          We have received your availability. We will confirm your interview slot shortly via email.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h1 className="text-2xl font-bold tracking-tight text-fg mb-1">Hi {info?.candidateName},</h1>
      <p className="text-muted mb-8">
        Please select all times when you are available for the interview for{" "}
        <strong className="text-fg">{info?.jobTitle}</strong>. We will match you with a panel member.
      </p>

      <div className="rounded-2xl border border-cardborder bg-card/70 p-6">
        <h2 className="font-semibold text-fg mb-4">Available slots ({selected.size} selected)</h2>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {slots.map((s) => (
            <label
              key={s.iso}
              className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-all duration-200 ${
                selected.has(s.iso)
                  ? "border-accent/50 bg-accentglow ring-1 ring-accent/30"
                  : "border-cardborder hover:border-cardborder/80 hover:bg-cardhover"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(s.iso)}
                onChange={() => toggle(s.iso)}
                className="h-4 w-4 rounded border-cardborder"
              />
              <span className="text-sm text-fg/80">{s.label}</span>
            </label>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={selected.size === 0 || submitting}
          className="w-full rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[0_0_20px_rgba(108,92,231,0.2)]"
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

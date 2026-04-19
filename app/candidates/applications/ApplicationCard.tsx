"use client"

import { useState } from "react"
import Link from "next/link"

interface ApplicationData {
  id: string
  jobId: string
  jobTitle: string
  name: string
  email: string
  status: string
  score: number
  reasoning: string
  emailDraft: string
  availabilityToken: string
  availabilitySlots: string[]
  scheduledSlot: string
  scheduledPanel: string
  createdAt: string
}

interface Props {
  application: ApplicationData
  onAvailabilitySubmitted: () => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; ring: string; description: string }> = {
  applied:               { label: "Applied",          color: "bg-slate-500/15 text-slate-300",   ring: "ring-slate-500/20",   description: "Your application has been received." },
  scored:                { label: "Under Review",     color: "bg-blue-500/15 text-blue-300",     ring: "ring-blue-500/20",    description: "Your profile has been evaluated by our AI screening agent." },
  shortlisted:           { label: "Shortlisted",      color: "bg-amber-500/15 text-amber-300",   ring: "ring-amber-500/20",   description: "You have been shortlisted. The HR team is preparing to reach out." },
  outreach_sent:         { label: "Action Required",  color: "bg-accent/20 text-accentlt",       ring: "ring-accent/30",      description: "We would like to schedule an interview with you. Please confirm your availability below." },
  availability_received: { label: "Availability Confirmed", color: "bg-cyan-500/15 text-cyan-300", ring: "ring-cyan-500/20",  description: "Thank you! We have your availability. Your interview will be scheduled shortly." },
  scheduled:             { label: "Interview Scheduled", color: "bg-emerald-500/15 text-emerald-300", ring: "ring-emerald-500/20", description: "Your interview has been confirmed." },
}

function generateSlots(): { iso: string; label: string }[] {
  const slots = [
    "2026-04-22T10:00:00", "2026-04-22T14:00:00", "2026-04-22T15:00:00",
    "2026-04-23T11:00:00", "2026-04-23T14:00:00",
    "2026-04-24T10:00:00", "2026-04-24T11:00:00", "2026-04-24T15:00:00",
    "2026-04-25T10:00:00", "2026-04-25T14:00:00",
  ]
  return slots.map((iso) => ({
    iso,
    label: new Date(iso).toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    }),
  }))
}

function formatSlot(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "long", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    })
  } catch { return iso }
}

export default function ApplicationCard({ application: app, onAvailabilitySubmitted }: Props) {
  const [expanded, setExpanded] = useState(app.status === "outreach_sent")
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const config = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.applied
  const isActionRequired = app.status === "outreach_sent"
  const slots = generateSlots()

  const availabilityUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/availability/${app.availabilityToken}`
      : `/availability/${app.availabilityToken}`

  const renderedEmail = app.emailDraft
    ? app.emailDraft.replace(/\[AVAILABILITY_LINK\]/g, availabilityUrl)
    : ""

  function toggleSlot(iso: string) {
    setSelectedSlots((prev) => {
      const next = new Set(prev)
      if (next.has(iso)) next.delete(iso)
      else next.add(iso)
      return next
    })
  }

  async function handleSubmitAvailability() {
    if (selectedSlots.size === 0) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: app.availabilityToken, slots: [...selectedSlots] }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Submission failed")
      }
      setSubmitted(true)
      onAvailabilitySubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`rounded-2xl border bg-card/70 overflow-hidden transition-all duration-200 ${
      isActionRequired ? "border-accent/40 ring-1 ring-accent/20" : "border-cardborder"
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-4 hover:bg-cardhover/50 transition"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-fg">{app.jobTitle}</h3>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${config.color} ${config.ring}`}>
              {config.label}
            </span>
            {isActionRequired && !submitted && (
              <span className="inline-flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            )}
          </div>
          <p className="text-xs text-muted">
            Applied {new Date(app.createdAt).toLocaleDateString()}
            {app.score > 0 && <> &middot; Score: <span className="text-fg font-medium">{app.score}/100</span></>}
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-muted shrink-0 mt-0.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-cardborder pt-4">
          {/* Status message */}
          <p className="text-sm text-muted">{config.description}</p>

          {/* Outreach email notification */}
          {isActionRequired && app.emailDraft && !submitted && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Message from HR
                </h4>
                <div className="rounded-xl bg-surface border border-cardborder p-4">
                  <pre className="whitespace-pre-wrap text-xs text-fg/80 font-sans leading-relaxed">
                    {renderedEmail}
                  </pre>
                </div>
              </div>

              {/* Inline availability form */}
              <div>
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Select Your Available Slots
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {slots.map((s) => (
                    <label
                      key={s.iso}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer transition-all duration-200 text-xs ${
                        selectedSlots.has(s.iso)
                          ? "border-accent/50 bg-accentglow ring-1 ring-accent/30"
                          : "border-cardborder hover:border-cardborder/80 hover:bg-cardhover"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSlots.has(s.iso)}
                        onChange={() => toggleSlot(s.iso)}
                        className="h-3.5 w-3.5 rounded border-cardborder"
                      />
                      <span className="text-fg/80">{s.label}</span>
                    </label>
                  ))}
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 mb-3">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmitAvailability}
                  disabled={selectedSlots.size === 0 || submitting}
                  className="w-full rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[0_0_20px_rgba(108,92,231,0.2)]"
                >
                  {submitting
                    ? "Submitting..."
                    : selectedSlots.size === 0
                    ? "Select at least one slot"
                    : `Confirm ${selectedSlots.size} Available Slot${selectedSlots.size === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>
          )}

          {/* Availability confirmed */}
          {(submitted || app.status === "availability_received") && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <p className="text-sm font-medium text-emerald-300">
                Availability confirmed! We will notify you once your interview is scheduled.
              </p>
            </div>
          )}

          {/* Scheduled info */}
          {app.status === "scheduled" && app.scheduledSlot && (
            <div className="rounded-xl bg-surface border border-cardborder p-4 space-y-3">
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Interview Details</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Time</span>
                <span className="text-fg font-medium">{formatSlot(app.scheduledSlot)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Panel</span>
                <span className="text-fg font-medium">{app.scheduledPanel}</span>
              </div>
            </div>
          )}

          {/* View job link */}
          <div className="pt-2">
            <Link
              href={`/candidates/jobs/${app.jobId}`}
              className="text-xs text-ctext hover:underline"
            >
              View job description &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

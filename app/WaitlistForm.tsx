"use client"

import { useState } from "react"

interface Props {
  variant?: "hero" | "footer"
  source?: string
}

export default function WaitlistForm({ variant = "hero", source = "landing" }: Props) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; position?: number } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, source }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ success: false, message: data.error ?? "Something went wrong" })
      } else if (data.alreadyOnList) {
        setResult({ success: true, message: "You're already on the list." })
      } else {
        setResult({
          success: true,
          message: `You're in. #${data.position} on the waitlist.`,
          position: data.position,
        })
      }
      setEmail("")
      setRole("")
    } catch {
      setResult({ success: false, message: "Network error. Try again." })
    } finally {
      setSubmitting(false)
    }
  }

  if (result?.success) {
    return (
      <div className={`rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 ${variant === "hero" ? "max-w-md mx-auto" : ""}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            ✓
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-300">{result.message}</p>
            <p className="text-xs text-emerald-400/80 mt-1">
              We will reach out when early access opens. Follow along for updates.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${variant === "hero" ? "max-w-md mx-auto" : ""}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="flex-1 rounded-xl border border-cardborder bg-card/80 backdrop-blur-sm px-4 py-3 text-sm text-fg placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:bg-accent/50 disabled:cursor-not-allowed transition shadow-[0_0_24px_rgba(108,92,231,0.3)] whitespace-nowrap"
        >
          {submitting ? "Joining..." : "Join Waitlist"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          { value: "hr", label: "HR / Recruiter" },
          { value: "founder", label: "Founder" },
          { value: "candidate", label: "Candidate" },
          { value: "other", label: "Other" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRole(opt.value)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
              role === opt.value
                ? "border-accent/50 bg-accent/20 text-accentlt"
                : "border-cardborder bg-card/40 text-muted hover:text-fg hover:border-accent/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {result && !result.success && (
        <p className="text-xs text-red-400">{result.message}</p>
      )}

      <p className="text-[11px] text-muted">
        No spam, no selling your data. One email when we open access.
      </p>
    </form>
  )
}

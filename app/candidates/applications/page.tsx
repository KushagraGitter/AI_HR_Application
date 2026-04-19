"use client"

import { useState } from "react"
import Link from "next/link"
import ApplicationCard from "./ApplicationCard"

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

export default function MyApplicationsPage() {
  const [email, setEmail] = useState("")
  const [applications, setApplications] = useState<ApplicationData[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState("")

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError("")
    setSearched(false)
    try {
      const res = await fetch(`/api/candidates/me?email=${encodeURIComponent(email.trim())}`, {
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setApplications(data)
      setSearched(true)
    } catch {
      setError("Failed to load applications. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleAvailabilitySubmitted() {
    // Reload applications to reflect updated status
    if (email.trim()) {
      fetch(`/api/candidates/me?email=${encodeURIComponent(email.trim())}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => setApplications(data))
        .catch(() => {})
    }
  }

  const hasNotifications = applications.some(
    (a) => a.status === "outreach_sent" || a.status === "availability_received" || a.status === "scheduled"
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-fg">My Applications</h1>
          {hasNotifications && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
              {applications.filter((a) => a.status === "outreach_sent").length || ""}
            </span>
          )}
        </div>
        <p className="text-muted">
          Enter your email to view your application status and respond to any pending actions.
        </p>
      </div>

      {/* Email lookup form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="flex-1 rounded-lg border border-cardborder bg-surface px-4 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-ctext/40 focus:border-ctext/40 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-ctext/90 px-5 py-2.5 text-sm font-medium text-white hover:bg-ctext transition disabled:opacity-50 shadow-[0_0_20px_rgba(45,212,191,0.15)]"
          >
            {loading ? "Searching..." : "Look Up"}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 mb-6">
          {error}
        </div>
      )}

      {searched && applications.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-cardborder bg-card/30 p-12 text-center">
          <p className="text-muted mb-2">No applications found for this email.</p>
          <Link href="/candidates" className="text-sm text-ctext hover:underline">
            Browse open positions &rarr;
          </Link>
        </div>
      )}

      {applications.length > 0 && (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onAvailabilitySubmitted={handleAvailabilitySubmitted}
            />
          ))}
        </div>
      )}
    </div>
  )
}

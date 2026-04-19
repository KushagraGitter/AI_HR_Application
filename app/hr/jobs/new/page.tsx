"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NewJobPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [requirements, setRequirements] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [job, setJob] = useState<{ id: string; title: string; jd: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, requirements }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }
      const data = await res.json()
      setJob(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (job) {
    return (
      <div className="max-w-3xl">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 mb-6">
          <p className="text-sm font-medium text-emerald-300">
            Job created successfully. The AI agent generated the job description below.
            It is now live on the Candidate Portal.
          </p>
        </div>

        <h1 className="text-2xl font-bold text-fg mb-2">{job.title}</h1>
        <p className="text-sm text-muted mb-6">Job ID: {job.id}</p>

        <div className="rounded-2xl border border-cardborder bg-card/70 p-6 mb-6">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Generated Job Description
          </h2>
          <pre className="whitespace-pre-wrap text-sm text-fg/80 font-sans leading-relaxed">
            {job.jd}
          </pre>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/hr/jobs/${job.id}`}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition shadow-[0_0_20px_rgba(108,92,231,0.2)]"
          >
            Open Pipeline &rarr;
          </Link>
          <Link
            href={`/candidates/jobs/${job.id}`}
            className="rounded-lg border border-cardborder px-5 py-2.5 text-sm font-medium text-muted hover:text-fg hover:bg-cardhover transition"
          >
            Candidate View
          </Link>
          <button
            onClick={() => router.push("/hr")}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-muted hover:text-fg transition"
          >
            Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-fg mb-2">Create New Job</h1>
      <p className="text-muted mb-8">
        Provide a title and key requirements. The AI agent will generate a comprehensive job description
        that will be posted on the Candidate Portal.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-fg/80 mb-1.5">
            Job Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Senior Frontend Engineer"
            className="w-full rounded-lg border border-cardborder bg-surface px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition"
          />
        </div>

        <div>
          <label htmlFor="requirements" className="block text-sm font-medium text-fg/80 mb-1.5">
            Requirements &amp; Key Points
          </label>
          <p className="text-xs text-muted mb-1.5">
            Provide minimum points — the AI will expand these into a full job posting.
          </p>
          <textarea
            id="requirements"
            required
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={6}
            placeholder="List key skills, experience, must-haves. e.g. React, TypeScript, 4+ years, system design, strong communication"
            className="w-full rounded-lg border border-cardborder bg-surface px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 resize-none transition"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[0_0_20px_rgba(108,92,231,0.2)]"
          >
            {loading ? "Agent is generating JD..." : "Create Job + Generate JD"}
          </button>
          <Link
            href="/hr"
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-muted hover:text-fg transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

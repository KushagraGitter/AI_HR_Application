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
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-6">
          <p className="text-sm font-medium text-green-800">
            ✓ Job created. Agent generated the job description below.
          </p>
        </div>

        <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
        <p className="text-sm text-neutral-500 mb-6">Job ID: {job.id}</p>

        <div className="rounded-lg border border-neutral-200 bg-white p-6 mb-6">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Generated Job Description
          </h2>
          <pre className="whitespace-pre-wrap text-sm text-neutral-800 font-sans leading-relaxed">
            {job.jd}
          </pre>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/jobs/${job.id}`}
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition"
          >
            Share Application Link →
          </Link>
          <Link
            href={`/jobs/${job.id}/ranking`}
            className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            View Rankings
          </Link>
          <button
            onClick={() => router.push("/")}
            className="rounded-md px-5 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition"
          >
            Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight mb-2">New Job</h1>
      <p className="text-neutral-500 mb-8">The agent will write a full JD from your brief.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1.5">
            Job Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Senior Frontend Engineer"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="requirements" className="block text-sm font-medium mb-1.5">
            Requirements
          </label>
          <textarea
            id="requirements"
            required
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={6}
            placeholder="List key skills, experience, must-haves. e.g. React, TypeScript, 4+ years, system design, strong communication"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition"
          >
            {loading ? "Agent is writing JD..." : "Create Job + Generate JD"}
          </button>
          <Link
            href="/"
            className="rounded-md px-5 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

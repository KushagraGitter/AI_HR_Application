"use client"

import { useState } from "react"

interface Props {
  jobId: string
}

export default function CandidateApplicationForm({ jobId }: Props) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [resume, setResume] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState<{ score: number; name: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, name, email, resume, linkedinUrl, githubUrl }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }
      const data = await res.json()
      setSubmitted({ score: data.score ?? 0, name: data.name })
      setName(""); setEmail(""); setResume(""); setLinkedinUrl(""); setGithubUrl("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 mb-4">
          <p className="text-sm font-medium text-emerald-300">
            Application received, {submitted.name}! Your profile has been scored at{" "}
            <span className="font-bold">{submitted.score}/100</span> by our AI screening agent.
          </p>
          <p className="text-xs text-emerald-400/70 mt-1">
            Our HR team will review shortlisted candidates and reach out if there is a match.
          </p>
        </div>
        <button
          onClick={() => setSubmitted(null)}
          className="text-sm text-ctext hover:text-ctext/80 font-medium transition"
        >
          Submit another application &rarr;
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-fg/80 mb-1.5">Full Name *</label>
          <input
            type="text" required
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full rounded-lg border border-cardborder bg-surface px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-ctext/40 focus:border-ctext/40 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fg/80 mb-1.5">Email *</label>
          <input
            type="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="w-full rounded-lg border border-cardborder bg-surface px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-ctext/40 focus:border-ctext/40 transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-fg/80 mb-1.5">Resume *</label>
        <textarea
          required
          value={resume} onChange={(e) => setResume(e.target.value)}
          rows={8}
          placeholder="Paste your resume text here. Include experience, skills, education, projects."
          className="w-full rounded-lg border border-cardborder bg-surface px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-ctext/40 focus:border-ctext/40 resize-none transition"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-fg/80 mb-1.5">LinkedIn URL</label>
          <input
            type="url"
            value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className="w-full rounded-lg border border-cardborder bg-surface px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-ctext/40 focus:border-ctext/40 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fg/80 mb-1.5">GitHub URL</label>
          <input
            type="url"
            value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/..."
            className="w-full rounded-lg border border-cardborder bg-surface px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-ctext/40 focus:border-ctext/40 transition"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-ctext/90 px-5 py-2.5 text-sm font-medium text-white hover:bg-ctext transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(45,212,191,0.15)]"
      >
        {loading ? "Evaluating your profile..." : "Submit Application"}
      </button>
    </form>
  )
}

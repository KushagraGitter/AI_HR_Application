"use client"

import { useState } from "react"

interface Props {
  jobId: string
}

export default function CandidateForm({ jobId }: Props) {
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
      // Reset form
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
        <div className="rounded-md bg-green-50 border border-green-200 p-4 mb-4">
          <p className="text-sm font-medium text-green-800">
            ✓ Application received, {submitted.name}. The agent scored your profile at {submitted.score}/100.
          </p>
        </div>
        <button
          onClick={() => setSubmitted(null)}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Submit another application →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Full Name *</label>
          <input
            type="text" required
            value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email *</label>
          <input
            type="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Resume *</label>
        <textarea
          required
          value={resume} onChange={(e) => setResume(e.target.value)}
          rows={8}
          placeholder="Paste your resume text here. Include experience, skills, education, projects."
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">LinkedIn URL</label>
          <input
            type="url"
            value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">GitHub URL</label>
          <input
            type="url"
            value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/..."
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400 transition"
      >
        {loading ? "Agent is scoring your profile..." : "Submit Application"}
      </button>
    </form>
  )
}

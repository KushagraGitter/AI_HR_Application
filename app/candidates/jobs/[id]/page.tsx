import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import CandidateApplicationForm from "./CandidateApplicationForm"

export const dynamic = "force-dynamic"

export default async function CandidateJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await prisma.job.findUnique({ where: { id } })
  if (!job) notFound()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/candidates" className="text-sm text-muted hover:text-ctext transition">
          &larr; All Positions
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-fg">{job.title}</h1>
          <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            Open
          </span>
        </div>
        <p className="text-sm text-muted">
          Posted {new Date(job.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="rounded-2xl border border-cardborder bg-card/70 p-6 mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Job Description
        </h2>
        <pre className="whitespace-pre-wrap text-sm text-fg/80 font-sans leading-relaxed">
          {job.jd || job.requirements}
        </pre>
      </div>

      <div className="rounded-2xl border border-ctext/20 bg-ctext/5 p-6">
        <h2 className="text-lg font-semibold text-fg mb-1">Apply for this position</h2>
        <p className="text-sm text-muted mb-5">
          Fill in your details below. Your profile will be evaluated by our AI screening agent.
        </p>
        <CandidateApplicationForm jobId={job.id} />
      </div>
    </div>
  )
}

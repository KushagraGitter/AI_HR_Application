import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import CandidateForm from "./CandidateForm"

export const dynamic = "force-dynamic"

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await prisma.job.findUnique({ where: { id } })
  if (!job) notFound()

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
      <p className="text-sm text-neutral-500 mt-1 mb-6">
        Public application form · Job ID: {job.id}
      </p>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 mb-6">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Job Description
        </h2>
        <pre className="whitespace-pre-wrap text-sm text-neutral-800 font-sans leading-relaxed max-h-60 overflow-y-auto">
          {job.jd}
        </pre>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Apply Now</h2>
        <CandidateForm jobId={job.id} />
      </div>

      <div className="mt-6 text-center">
        <Link
          href={`/jobs/${job.id}/ranking`}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          View Rankings →
        </Link>
      </div>
    </div>
  )
}

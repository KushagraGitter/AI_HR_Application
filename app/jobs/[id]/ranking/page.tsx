import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import RankingClient from "./RankingClient"

export const dynamic = "force-dynamic"

export default async function RankingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await prisma.job.findUnique({ where: { id } })
  if (!job) notFound()

  return (
    <div>
      <div className="mb-4">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Dashboard
        </Link>
      </div>

      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
          <p className="text-neutral-500 mt-1">Ranked candidates from the screening agent.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            Apply Link
          </Link>
          <Link
            href={`/jobs/${job.id}/schedule`}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition"
          >
            Go to Schedule →
          </Link>
        </div>
      </div>

      <RankingClient jobId={job.id} />
    </div>
  )
}

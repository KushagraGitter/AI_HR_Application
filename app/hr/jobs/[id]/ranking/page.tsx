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
        <Link href="/hr" className="text-sm text-muted hover:text-fg transition">
          &larr; Dashboard
        </Link>
      </div>

      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">{job.title}</h1>
          <p className="text-muted mt-1">Ranked candidates from the screening agent.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/hr/jobs/${job.id}/schedule`}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition shadow-[0_0_20px_rgba(108,92,231,0.2)]"
          >
            Go to Schedule &rarr;
          </Link>
        </div>
      </div>

      <RankingClient jobId={job.id} />
    </div>
  )
}

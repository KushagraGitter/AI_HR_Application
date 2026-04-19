import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import ScheduleClient from "./ScheduleClient"

export const dynamic = "force-dynamic"

export default async function SchedulePage({
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
          <h1 className="text-3xl font-bold tracking-tight text-fg">Interview Schedule</h1>
          <p className="text-muted mt-1">{job.title}</p>
        </div>
        <Link
          href={`/hr/jobs/${job.id}/ranking`}
          className="rounded-lg border border-cardborder px-4 py-2 text-sm font-medium text-muted hover:text-fg hover:bg-cardhover transition"
        >
          &larr; Back to Rankings
        </Link>
      </div>

      <ScheduleClient jobId={job.id} />
    </div>
  )
}

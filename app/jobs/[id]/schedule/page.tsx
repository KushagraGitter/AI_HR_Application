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
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Dashboard
        </Link>
      </div>

      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Schedule</h1>
          <p className="text-neutral-500 mt-1">{job.title}</p>
        </div>
        <Link
          href={`/jobs/${job.id}/ranking`}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
        >
          ← Back to Rankings
        </Link>
      </div>

      <ScheduleClient jobId={job.id} />
    </div>
  )
}

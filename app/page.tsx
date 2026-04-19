import Link from "next/link"
import { prisma } from "@/lib/prisma"
import StatusBadge from "@/components/StatusBadge"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      candidates: { select: { status: true } },
    },
  })

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-neutral-500 mt-1">All jobs and candidate pipeline status.</p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="text-neutral-600 mb-4">No jobs yet. Create your first one to see the agent in action.</p>
          <Link
            href="/jobs/new"
            className="inline-block rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition"
          >
            + Create Your First Job
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const counts: Record<string, number> = {}
            for (const c of job.candidates) counts[c.status] = (counts[c.status] ?? 0) + 1
            const total = job.candidates.length

            return (
              <div
                key={job.id}
                className="rounded-lg border border-neutral-200 bg-white p-6 hover:border-neutral-300 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{job.title}</h2>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {total} {total === 1 ? "candidate" : "candidates"} · Created{" "}
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-sm text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50"
                    >
                      Apply Link
                    </Link>
                    <Link
                      href={`/jobs/${job.id}/ranking`}
                      className="text-sm text-white bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 rounded-md"
                    >
                      View Rankings →
                    </Link>
                    <Link
                      href={`/jobs/${job.id}/schedule`}
                      className="text-sm text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-md"
                    >
                      Schedule
                    </Link>
                  </div>
                </div>

                {total > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-100">
                    {Object.entries(counts).map(([status, count]) => (
                      <div key={status} className="flex items-center gap-1.5">
                        <StatusBadge status={status} />
                        <span className="text-sm font-medium text-neutral-700">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

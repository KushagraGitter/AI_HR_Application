import Link from "next/link"
import { prisma } from "@/lib/prisma"
import StatusBadge from "@/components/StatusBadge"

export const dynamic = "force-dynamic"

export default async function HRDashboardPage() {
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
          <h1 className="text-3xl font-bold tracking-tight text-fg">Dashboard</h1>
          <p className="text-muted mt-1">All jobs and candidate pipeline status.</p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-cardborder bg-card/50 p-12 text-center">
          <p className="text-muted mb-4">No jobs yet. Create your first one to see the agent in action.</p>
          <Link
            href="/hr/jobs/new"
            className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition shadow-[0_0_20px_rgba(108,92,231,0.2)]"
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
                className="rounded-2xl border border-cardborder bg-card/70 p-6 hover:bg-cardhover hover:border-accent/20 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-fg">{job.title}</h2>
                    <p className="text-sm text-muted mt-0.5">
                      {total} {total === 1 ? "candidate" : "candidates"} &middot; Created{" "}
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/hr/jobs/${job.id}`}
                      className="text-sm text-white bg-accent hover:bg-accent/90 px-3 py-1.5 rounded-lg transition"
                    >
                      Open Pipeline &rarr;
                    </Link>
                  </div>
                </div>

                {total > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-cardborder">
                    {Object.entries(counts).map(([status, count]) => (
                      <div key={status} className="flex items-center gap-1.5">
                        <StatusBadge status={status} />
                        <span className="text-sm font-medium text-muted">{count}</span>
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

import Link from "next/link"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function CandidatePortalPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      candidates: { select: { id: true } },
    },
  })

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-fg">Open Positions</h1>
        <p className="text-muted mt-1">
          Browse our current openings and apply to the ones that match your skills.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-cardborder bg-card/30 p-12 text-center">
          <p className="text-muted text-lg mb-2">No open positions right now</p>
          <p className="text-sm text-muted/60">
            Check back soon — new roles are posted regularly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/candidates/jobs/${job.id}`}
              className="group rounded-2xl border border-cardborder bg-card/70 p-6 hover:bg-cardhover hover:border-ctext/30 hover:shadow-[0_0_40px_rgba(45,212,191,0.08)] transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-semibold text-fg group-hover:text-ctext transition-colors">
                  {job.title}
                </h2>
                <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                  Open
                </span>
              </div>

              <p className="text-sm text-muted line-clamp-3 mb-4">
                {job.jd
                  ? job.jd.slice(0, 200) + (job.jd.length > 200 ? "..." : "")
                  : job.requirements.slice(0, 200)}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-cardborder">
                <span className="text-xs text-muted/60">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>
                <span className="text-sm font-medium text-ctext group-hover:underline">
                  View &amp; Apply &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

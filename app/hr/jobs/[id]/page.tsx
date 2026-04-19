import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import KanbanView from "./KanbanView"

export const dynamic = "force-dynamic"

export default async function JobKanbanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await prisma.job.findUnique({ where: { id } })
  if (!job) notFound()

  return (
    <div className="flex flex-col h-[calc(100vh-73px)]">
      <div className="flex items-center justify-between px-2 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/hr" className="text-sm text-muted hover:text-fg transition">
            &larr; Dashboard
          </Link>
          <span className="text-cardborder">/</span>
          <h1 className="text-lg font-semibold text-fg">{job.title}</h1>
        </div>
      </div>
      <KanbanView jobId={job.id} jobTitle={job.title} />
    </div>
  )
}

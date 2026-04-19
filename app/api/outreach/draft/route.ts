import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildOutreachGraph } from "@/lib/agent/graph"
import type { ScoredCandidate } from "@/types"

// POST /api/outreach/draft — draft outreach emails for selected candidates
export async function POST(req: NextRequest) {
  try {
    const { jobId, candidateIds } = await req.json() as { jobId: string; candidateIds: string[] }

    if (!jobId || !candidateIds?.length) {
      return NextResponse.json({ error: "jobId and candidateIds are required" }, { status: 400 })
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    const rawCandidates = await prisma.candidate.findMany({
      where: { id: { in: candidateIds }, jobId },
    })

    const shortlist: ScoredCandidate[] = rawCandidates.map(c => ({
      ...c,
      status: c.status as ScoredCandidate["status"],
      criteriaBreakdown: JSON.parse(c.criteriaBreakdown || "[]"),
      availabilitySlots: JSON.parse(c.availabilitySlots || "[]"),
    }))

    const graph = buildOutreachGraph()
    const result = await graph.invoke({
      jobId,
      jobTitle: job.title,
      requirements: job.requirements,
      jd: job.jd,
      shortlist,
    })

    // Save drafts + tokens back to each candidate
    const updatedCandidates = []
    for (const draft of result.outreachDrafts) {
      const updated = await prisma.candidate.update({
        where: { id: draft.candidateId },
        data: {
          emailDraft: draft.emailDraft,
          availabilityToken: draft.availabilityToken,
          status: "shortlisted",
        },
      })
      updatedCandidates.push({ ...updated, draft })
    }

    // Append trace
    if (result.trace?.length > 0) {
      const existingTrace = await prisma.agentTrace.findFirst({ where: { jobId } })
      if (existingTrace) {
        const nodes = JSON.parse(existingTrace.nodes)
        await prisma.agentTrace.update({
          where: { id: existingTrace.id },
          data: { nodes: JSON.stringify([...nodes, ...result.trace]) },
        })
      }
    }

    return NextResponse.json({
      drafts: result.outreachDrafts,
      candidates: updatedCandidates,
    })
  } catch (error) {
    console.error("POST /api/outreach/draft error:", error)
    return NextResponse.json({ error: "Failed to draft outreach" }, { status: 500 })
  }
}

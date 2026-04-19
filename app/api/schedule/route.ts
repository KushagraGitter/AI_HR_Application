import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildSchedulingGraph } from "@/lib/agent/graph"
import type { ScoredCandidate, AvailabilityResponse } from "@/types"

// POST /api/schedule — run assign_slots for all ready candidates in a job
export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json() as { jobId: string }

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 })
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    // Get candidates who have submitted availability
    const rawCandidates = await prisma.candidate.findMany({
      where: { jobId, status: "availability_received" },
    })

    if (!rawCandidates.length) {
      return NextResponse.json({ error: "No candidates with availability yet" }, { status: 400 })
    }

    const candidates: ScoredCandidate[] = rawCandidates.map(c => ({
      ...c,
      status: c.status as ScoredCandidate["status"],
      criteriaBreakdown: JSON.parse(c.criteriaBreakdown || "[]"),
    }))

    const availabilityResponses: AvailabilityResponse[] = rawCandidates.map(c => ({
      candidateId: c.id,
      slots: JSON.parse(c.availabilitySlots || "[]"),
    }))

    const graph = buildSchedulingGraph()
    const result = await graph.invoke({
      jobId,
      jobTitle: job.title,
      requirements: job.requirements,
      jd: job.jd,
      candidates,
      availabilityResponses,
    })

    // Persist scheduled slots to DB
    for (const slot of result.scheduledSlots) {
      await prisma.candidate.update({
        where: { id: slot.candidateId },
        data: {
          scheduledSlot: slot.slot,
          scheduledPanel: slot.panelMember,
          icsFile: slot.icsFile,
          status: "scheduled",
        },
      })
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

    return NextResponse.json({ scheduledSlots: result.scheduledSlots })
  } catch (error) {
    console.error("POST /api/schedule error:", error)
    return NextResponse.json({ error: "Failed to schedule" }, { status: 500 })
  }
}

// GET /api/schedule?jobId=xxx — get all scheduled slots for a job
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get("jobId")

    if (!jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 })

    const candidates = await prisma.candidate.findMany({
      where: { jobId, status: "scheduled" },
    })

    const slots = candidates.map(c => ({
      candidateId: c.id,
      candidateName: c.name,
      panelMember: c.scheduledPanel,
      slot: c.scheduledSlot,
      icsFile: c.icsFile,
      candidateEmail: c.email,
    }))

    return NextResponse.json({ slots })
  } catch (error) {
    console.error("GET /api/schedule error:", error)
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 })
  }
}

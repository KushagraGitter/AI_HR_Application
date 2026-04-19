import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildScoringGraph } from "@/lib/agent/graph"
import type { ScoredCandidate } from "@/types"

// POST /api/candidates — submit a candidate + trigger scoring
export async function POST(req: NextRequest) {
  try {
    const { jobId, name, email, resume, linkedinUrl, githubUrl } = await req.json()

    if (!jobId || !name || !email || !resume) {
      return NextResponse.json({ error: "jobId, name, email, resume are required" }, { status: 400 })
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Save candidate first
    const candidate = await prisma.candidate.create({
      data: { jobId, name, email, resume, linkedinUrl: linkedinUrl ?? "", githubUrl: githubUrl ?? "" },
    })

    // Run scoring graph with this single candidate
    const graph = buildScoringGraph()
    const result = await graph.invoke({
      jobId,
      jobTitle: job.title,
      requirements: job.requirements,
      jd: job.jd,
      candidates: [{
        id: candidate.id,
        jobId,
        name,
        email,
        resume,
        linkedinUrl: linkedinUrl ?? "",
        githubUrl: githubUrl ?? "",
        status: "applied" as const,
        score: 0,
        reasoning: "",
        criteriaBreakdown: [],
      }],
    })

    const scored: ScoredCandidate = result.candidates[0]

    // Update candidate with score
    const updated = await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        score: scored.score,
        reasoning: scored.reasoning,
        criteriaBreakdown: JSON.stringify(scored.criteriaBreakdown),
        status: "scored",
      },
    })

    // Append trace to existing trace record for this job (or create new)
    if (result.trace?.length > 0) {
      const existingTrace = await prisma.agentTrace.findFirst({ where: { jobId } })
      if (existingTrace) {
        const existingNodes = JSON.parse(existingTrace.nodes)
        await prisma.agentTrace.update({
          where: { id: existingTrace.id },
          data: { nodes: JSON.stringify([...existingNodes, ...result.trace]) },
        })
      } else {
        await prisma.agentTrace.create({
          data: { jobId, nodes: JSON.stringify(result.trace) },
        })
      }
    }

    return NextResponse.json({ ...updated, criteriaBreakdown: scored.criteriaBreakdown })
  } catch (error) {
    console.error("POST /api/candidates error:", error)
    return NextResponse.json({ error: "Failed to submit candidate" }, { status: 500 })
  }
}

// GET /api/candidates?jobId=xxx — get all candidates for a job, sorted by score
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get("jobId")

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 })
    }

    const candidates = await prisma.candidate.findMany({
      where: { jobId },
      orderBy: { score: "desc" },
    })

    const parsed = candidates.map(c => ({
      ...c,
      criteriaBreakdown: JSON.parse(c.criteriaBreakdown || "[]"),
      availabilitySlots: JSON.parse(c.availabilitySlots || "[]"),
    }))

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("GET /api/candidates error:", error)
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 })
  }
}

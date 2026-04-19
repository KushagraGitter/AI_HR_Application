import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildScoringGraph } from "@/lib/agent/graph"
import { autopilotAfterScore } from "@/lib/agent/autopilot"
import { log, demoDelay } from "@/lib/agent/logger"
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

    await log({
      jobId,
      icon: "📥",
      level: "success",
      actor: "candidate",
      message: `New application received from ${name} (${email})`,
    })
    await demoDelay()

    await log({
      jobId,
      icon: "🤖",
      level: "action",
      actor: "screener",
      message: `Screener agent activated`,
    })
    await demoDelay()

    await log({
      jobId,
      icon: "🧠",
      level: "action",
      actor: "screener",
      message: `Analyzing resume against job description (${job.jd.length} chars)...`,
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

    await log({
      jobId,
      icon: scored.score >= 85 ? "🌟" : scored.score >= 70 ? "✓" : "⚠️",
      level: scored.score >= 70 ? "success" : "warn",
      actor: "screener",
      message: `Scored ${scored.score}/100 — ${scored.reasoning.slice(0, 120)}${scored.reasoning.length > 120 ? "..." : ""}`,
    })
    await demoDelay()

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

    // AUTOPILOT — if score clears threshold, auto-draft + auto-send outreach
    const origin =
      req.headers.get("origin") ||
      `http://${req.headers.get("host") ?? "localhost:3000"}`
    const autopilot = await autopilotAfterScore(candidate.id, origin)

    // Re-fetch the candidate so the response has the latest status
    const finalCandidate = await prisma.candidate.findUnique({ where: { id: candidate.id } })

    return NextResponse.json({
      ...(finalCandidate ?? updated),
      criteriaBreakdown: scored.criteriaBreakdown,
      autopilot,
    })
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

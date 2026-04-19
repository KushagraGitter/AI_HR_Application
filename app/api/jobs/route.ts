import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildJdGraph } from "@/lib/agent/graph"

// POST /api/jobs — create job + generate JD
export async function POST(req: NextRequest) {
  try {
    const { title, requirements } = await req.json()

    if (!title || !requirements) {
      return NextResponse.json({ error: "title and requirements are required" }, { status: 400 })
    }

    // Create job first so we have an ID
    const job = await prisma.job.create({
      data: { title, requirements },
    })

    // Run the JD generation graph
    const graph = buildJdGraph()
    const result = await graph.invoke({
      jobId: job.id,
      jobTitle: title,
      requirements,
    })

    // Update job with generated JD
    const updated = await prisma.job.update({
      where: { id: job.id },
      data: { jd: result.jd },
    })

    // Save trace
    if (result.trace?.length > 0) {
      await prisma.agentTrace.create({
        data: {
          jobId: job.id,
          nodes: JSON.stringify(result.trace),
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("POST /api/jobs error:", error)
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
  }
}

// GET /api/jobs — list all jobs
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { candidates: true } },
      },
    })
    return NextResponse.json(jobs)
  } catch (error) {
    console.error("GET /api/jobs error:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

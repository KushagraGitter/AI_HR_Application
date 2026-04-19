import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/trace/[jobId] — get LangGraph execution trace for a job
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params

    const trace = await prisma.agentTrace.findFirst({
      where: { jobId },
      orderBy: { createdAt: "desc" },
    })

    if (!trace) {
      return NextResponse.json({ nodes: [] })
    }

    return NextResponse.json({ nodes: JSON.parse(trace.nodes) })
  } catch (error) {
    console.error("GET /api/trace error:", error)
    return NextResponse.json({ error: "Failed to fetch trace" }, { status: 500 })
  }
}

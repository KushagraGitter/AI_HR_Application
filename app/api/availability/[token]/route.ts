import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/availability/[token] — get candidate info for availability form
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const candidate = await prisma.candidate.findFirst({
      where: { availabilityToken: token },
      include: { job: true },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
    }

    return NextResponse.json({
      candidateName: candidate.name,
      jobTitle: candidate.job.title,
      alreadySubmitted: candidate.status === "availability_received" || candidate.status === "scheduled",
    })
  } catch (error) {
    console.error("GET /api/availability/[token] error:", error)
    return NextResponse.json({ error: "Failed to fetch availability info" }, { status: 500 })
  }
}

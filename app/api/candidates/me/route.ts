import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/candidates/me?email=xxx — get all applications for a candidate by email
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 })
    }

    const candidates = await prisma.candidate.findMany({
      where: { email: { equals: email } },
      orderBy: { createdAt: "desc" },
      include: { job: { select: { id: true, title: true, jd: true } } },
    })

    const parsed = candidates.map((c) => ({
      id: c.id,
      jobId: c.jobId,
      jobTitle: c.job.title,
      name: c.name,
      email: c.email,
      status: c.status,
      score: c.score,
      reasoning: c.reasoning,
      emailDraft: c.emailDraft,
      availabilityToken: c.availabilityToken,
      availabilitySlots: JSON.parse(c.availabilitySlots || "[]"),
      scheduledSlot: c.scheduledSlot,
      scheduledPanel: c.scheduledPanel,
      createdAt: c.createdAt,
    }))

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("GET /api/candidates/me error:", error)
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PATCH /api/candidates/[id] — update candidate status or any field
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const updated = await prisma.candidate.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({
      ...updated,
      criteriaBreakdown: JSON.parse(updated.criteriaBreakdown || "[]"),
      availabilitySlots: JSON.parse(updated.availabilitySlots || "[]"),
    })
  } catch (error) {
    console.error("PATCH /api/candidates/[id] error:", error)
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 })
  }
}

// GET /api/candidates/[id] — get single candidate
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const candidate = await prisma.candidate.findUnique({ where: { id } })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...candidate,
      criteriaBreakdown: JSON.parse(candidate.criteriaBreakdown || "[]"),
      availabilitySlots: JSON.parse(candidate.availabilitySlots || "[]"),
    })
  } catch (error) {
    console.error("GET /api/candidates/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch candidate" }, { status: 500 })
  }
}

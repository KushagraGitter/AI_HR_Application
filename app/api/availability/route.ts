import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/availability — candidate submits their available slots
export async function POST(req: NextRequest) {
  try {
    const { token, slots } = await req.json() as { token: string; slots: string[] }

    if (!token || !slots?.length) {
      return NextResponse.json({ error: "token and slots are required" }, { status: 400 })
    }

    const candidate = await prisma.candidate.findFirst({
      where: { availabilityToken: token },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    }

    const updated = await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        availabilitySlots: JSON.stringify(slots),
        status: "availability_received",
      },
    })

    return NextResponse.json({ success: true, candidateId: updated.id })
  } catch (error) {
    console.error("POST /api/availability error:", error)
    return NextResponse.json({ error: "Failed to save availability" }, { status: 500 })
  }
}

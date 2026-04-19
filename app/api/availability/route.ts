import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { autopilotAfterAvailability } from "@/lib/agent/autopilot"

// POST /api/availability — candidate submits their available slots
// After save, autopilot runs the scheduler to assign a panel member + slot.
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

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        availabilitySlots: JSON.stringify(slots),
        status: "availability_received",
      },
    })

    // AUTOPILOT — immediately assign a panel member + slot
    const autopilot = await autopilotAfterAvailability(candidate.id)

    return NextResponse.json({
      success: true,
      candidateId: candidate.id,
      autopilot,
    })
  } catch (error) {
    console.error("POST /api/availability error:", error)
    return NextResponse.json({ error: "Failed to save availability" }, { status: 500 })
  }
}

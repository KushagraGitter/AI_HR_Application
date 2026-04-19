import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/waitlist — add an email to the waitlist
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email: string
      name?: string
      role?: string
      company?: string
      useCase?: string
      source?: string
    }

    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const email = body.email.trim().toLowerCase()

    const existing = await prisma.waitlist.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyOnList: true,
        message: "You're already on the waitlist. We'll be in touch!",
      })
    }

    const entry = await prisma.waitlist.create({
      data: {
        email,
        name: body.name?.trim() ?? "",
        role: body.role?.trim() ?? "",
        company: body.company?.trim() ?? "",
        useCase: body.useCase?.trim() ?? "",
        source: body.source?.trim() ?? "",
      },
    })

    // Count total signups for social proof
    const totalCount = await prisma.waitlist.count()

    return NextResponse.json({
      success: true,
      alreadyOnList: false,
      id: entry.id,
      position: totalCount,
    })
  } catch (error) {
    console.error("POST /api/waitlist error:", error)
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 })
  }
}

// GET /api/waitlist — just returns the total count (for social proof on the page)
export async function GET() {
  try {
    const count = await prisma.waitlist.count()
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}

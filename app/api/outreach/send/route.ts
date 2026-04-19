import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendOutreachEmail } from "@/lib/email"

// POST /api/outreach/send — actually send the drafted outreach email via Resend
export async function POST(req: NextRequest) {
  try {
    const { candidateId } = await req.json() as { candidateId: string }

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId is required" }, { status: 400 })
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { job: true },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    if (!candidate.emailDraft || !candidate.availabilityToken) {
      return NextResponse.json(
        { error: "No outreach draft found. Draft the email first." },
        { status: 400 },
      )
    }

    // Build the final email body with the live availability URL
    const origin =
      req.headers.get("origin") ||
      req.headers.get("x-forwarded-host") ||
      "http://localhost:3000"
    const availabilityUrl = origin.startsWith("http")
      ? `${origin}/availability/${candidate.availabilityToken}`
      : `https://${origin}/availability/${candidate.availabilityToken}`

    const bodyText = candidate.emailDraft.replace(/\[AVAILABILITY_LINK\]/g, availabilityUrl)

    const result = await sendOutreachEmail({
      to: candidate.email,
      candidateName: candidate.name,
      jobTitle: candidate.job.title,
      bodyText,
    })

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { status: "outreach_sent" },
    })

    const redirected = result.to.toLowerCase() !== candidate.email.toLowerCase()

    return NextResponse.json({
      success: true,
      messageId: result.id,
      intendedTo: candidate.email,
      actualTo: result.to,
      redirected,
      subject: result.subject,
      previewUrl: availabilityUrl,
    })
  } catch (error) {
    console.error("POST /api/outreach/send error:", error)
    const message = error instanceof Error ? error.message : "Failed to send email"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Autopilot orchestration with demo-grade real-time logging.
 *
 * Flow 1 (triggered after scoring):
 *   candidate submitted → scored
 *   if score >= SHORTLIST_THRESHOLD → draft_outreach → send_email
 *
 * Flow 2 (triggered after availability):
 *   candidate submits slots → assign_slots → persist + generate .ics
 */

import { prisma } from "@/lib/prisma"
import { buildOutreachGraph, buildSchedulingGraph } from "./graph"
import { sendOutreachEmail } from "@/lib/email"
import { log, demoDelay, appendTrace } from "./logger"
import type { ScoredCandidate, AvailabilityResponse } from "@/types"

const SHORTLIST_THRESHOLD = 70

interface AutopilotScoreResult {
  shortlisted: boolean
  outreachSent: boolean
  emailMessageId?: string
  reroutedTo?: string
  error?: string
}

export async function autopilotAfterScore(
  candidateId: string,
  origin: string,
): Promise<AutopilotScoreResult> {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { job: true },
    })
    if (!candidate) return { shortlisted: false, outreachSent: false, error: "Candidate not found" }

    const jobId = candidate.jobId

    await log({
      jobId,
      icon: "🔍",
      level: "action",
      actor: "screener",
      message: `Evaluating ${candidate.name} against shortlist threshold (≥ ${SHORTLIST_THRESHOLD})`,
    })
    await demoDelay()

    if (candidate.score < SHORTLIST_THRESHOLD) {
      await log({
        jobId,
        icon: "✗",
        level: "warn",
        actor: "screener",
        message: `${candidate.name} scored ${candidate.score} — below threshold. Not shortlisted.`,
      })
      return { shortlisted: false, outreachSent: false }
    }

    await log({
      jobId,
      icon: "✓",
      level: "success",
      actor: "screener",
      message: `${candidate.name} passed at ${candidate.score}/100 — shortlisting`,
    })

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { status: "shortlisted" },
    })

    await demoDelay()
    await log({
      jobId,
      icon: "🤖",
      level: "action",
      actor: "outreacher",
      message: `Outreacher agent activated for ${candidate.name}`,
    })

    // --- Draft outreach ---
    const shortlist: ScoredCandidate[] = [{
      ...candidate,
      status: "shortlisted",
      criteriaBreakdown: JSON.parse(candidate.criteriaBreakdown || "[]"),
    } as ScoredCandidate]

    await log({
      jobId,
      icon: "✍️",
      level: "action",
      actor: "outreacher",
      message: `Drafting personalized email for ${candidate.name}...`,
    })

    const outreachGraph = buildOutreachGraph()
    const outreachResult = await outreachGraph.invoke({
      jobId,
      jobTitle: candidate.job.title,
      requirements: candidate.job.requirements,
      jd: candidate.job.jd,
      shortlist,
    })

    await appendTrace(jobId, outreachResult.trace)

    const draft = outreachResult.outreachDrafts[0]
    if (!draft) {
      await log({ jobId, icon: "✗", level: "error", actor: "outreacher", message: "Draft failed" })
      return { shortlisted: true, outreachSent: false, error: "Outreach draft failed" }
    }

    await log({
      jobId,
      icon: "✓",
      level: "success",
      actor: "outreacher",
      message: `Email drafted (${draft.emailDraft.split(/\s+/).length} words)`,
    })

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        emailDraft: draft.emailDraft,
        availabilityToken: draft.availabilityToken,
      },
    })

    await demoDelay()

    // --- Send via Resend ---
    const availabilityUrl = `${origin}/availability/${draft.availabilityToken}`
    const bodyText = draft.emailDraft.replace(/\[AVAILABILITY_LINK\]/g, availabilityUrl)

    await log({
      jobId,
      icon: "📬",
      level: "action",
      actor: "outreacher",
      message: `Sending to ${candidate.email} via Resend...`,
    })

    const sendStart = Date.now()
    const sendResult = await sendOutreachEmail({
      to: candidate.email,
      candidateName: candidate.name,
      jobTitle: candidate.job.title,
      bodyText,
    })

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { status: "outreach_sent" },
    })

    const redirected = sendResult.to.toLowerCase() !== candidate.email.toLowerCase()

    await log({
      jobId,
      icon: "✉️",
      level: "success",
      actor: "outreacher",
      message: redirected
        ? `Email delivered (test-mode reroute to ${sendResult.to}) · Resend id: ${sendResult.id.slice(0, 12)}...`
        : `Email delivered to ${candidate.email} · Resend id: ${sendResult.id.slice(0, 12)}...`,
      durationMs: Date.now() - sendStart,
    })

    await demoDelay()
    await log({
      jobId,
      icon: "⏳",
      level: "info",
      actor: "system",
      message: `Waiting for ${candidate.name} to submit availability...`,
    })

    return {
      shortlisted: true,
      outreachSent: true,
      emailMessageId: sendResult.id,
      reroutedTo: redirected ? sendResult.to : undefined,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown autopilot error"
    console.error("autopilotAfterScore error:", message)
    return { shortlisted: true, outreachSent: false, error: message }
  }
}

interface AutopilotAvailabilityResult {
  scheduled: boolean
  panelMember?: string
  slot?: string
  error?: string
}

export async function autopilotAfterAvailability(
  candidateId: string,
): Promise<AutopilotAvailabilityResult> {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { job: true },
    })
    if (!candidate) return { scheduled: false, error: "Candidate not found" }

    const jobId = candidate.jobId
    const slots = JSON.parse(candidate.availabilitySlots || "[]") as string[]
    if (!slots.length) return { scheduled: false, error: "No availability slots submitted" }

    await log({
      jobId,
      icon: "📥",
      level: "success",
      actor: "candidate",
      message: `${candidate.name} submitted ${slots.length} available slot${slots.length === 1 ? "" : "s"}`,
    })
    await demoDelay()

    await log({
      jobId,
      icon: "🤖",
      level: "action",
      actor: "scheduler",
      message: `Scheduler agent activated`,
    })
    await demoDelay()

    await log({
      jobId,
      icon: "🧩",
      level: "action",
      actor: "scheduler",
      message: `Matching candidate slots against panel availability (3 panel members)...`,
    })

    const scoredCandidate: ScoredCandidate = {
      ...candidate,
      status: "availability_received",
      criteriaBreakdown: JSON.parse(candidate.criteriaBreakdown || "[]"),
    } as ScoredCandidate

    const availabilityResponses: AvailabilityResponse[] = [{
      candidateId: candidate.id,
      slots,
    }]

    const graph = buildSchedulingGraph()
    const result = await graph.invoke({
      jobId,
      jobTitle: candidate.job.title,
      requirements: candidate.job.requirements,
      jd: candidate.job.jd,
      candidates: [scoredCandidate],
      availabilityResponses,
    })

    await appendTrace(jobId, result.trace)

    const scheduled = result.scheduledSlots[0]
    if (!scheduled) {
      await log({ jobId, icon: "✗", level: "error", actor: "scheduler", message: "No slot match found" })
      return { scheduled: false, error: "Scheduler could not find a slot" }
    }

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        scheduledSlot: scheduled.slot,
        scheduledPanel: scheduled.panelMember,
        icsFile: scheduled.icsFile,
        status: "scheduled",
      },
    })

    await log({
      jobId,
      icon: "✓",
      level: "success",
      actor: "scheduler",
      message: `Matched ${candidate.name} ↔ ${scheduled.panelMember}`,
    })
    await demoDelay()

    await log({
      jobId,
      icon: "📆",
      level: "success",
      actor: "scheduler",
      message: `Interview confirmed: ${new Date(scheduled.slot).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`,
    })
    await demoDelay()

    await log({
      jobId,
      icon: "📎",
      level: "success",
      actor: "scheduler",
      message: `.ics calendar invite generated (${scheduled.icsFile.length} bytes) · HR can download`,
    })

    return {
      scheduled: true,
      panelMember: scheduled.panelMember,
      slot: scheduled.slot,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown autopilot error"
    console.error("autopilotAfterAvailability error:", message)
    return { scheduled: false, error: message }
  }
}

"use client"

import { useState } from "react"
import StatusBadge from "@/components/StatusBadge"
import type { AgentTraceNode } from "@/types"

interface CandidateData {
  id: string
  name: string
  email: string
  resume: string
  linkedinUrl: string
  githubUrl: string
  status: string
  score: number
  reasoning: string
  criteriaBreakdown: { criterion: string; score: number; comment: string }[]
  emailDraft: string
  availabilityToken: string
  availabilitySlots: string[]
  scheduledSlot: string
  scheduledPanel: string
  icsFile: string
  createdAt?: string
}

interface Props {
  candidate: CandidateData
  minScore: number
  actionLoading: string
  traceNodes: AgentTraceNode[]
  onClose: () => void
  onDraftOutreach: (id: string) => void
  onSendEmail: (id: string) => Promise<{ messageId?: string; actualTo?: string; redirected?: boolean } | null>
  onScheduleAll: () => void
}

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-300 bg-emerald-500/15 border-emerald-500/25"
  if (score >= 70) return "text-blue-300 bg-blue-500/15 border-blue-500/25"
  if (score >= 50) return "text-amber-300 bg-amber-500/15 border-amber-500/25"
  return "text-red-300 bg-red-500/15 border-red-500/25"
}

function formatSlot(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "long", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    })
  } catch { return iso }
}

function downloadIcs(icsContent: string, candidateName: string) {
  const blob = new Blob([icsContent], { type: "text/calendar" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `interview-${candidateName.replace(/\s+/g, "-")}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Build a candidate-specific activity log from their data + matching agent traces
interface LogEntry {
  icon: string
  label: string
  detail: string
  agent?: string
  type: "status" | "agent" | "data"
  color: string
}

function buildCandidateLogs(c: CandidateData, traceNodes: AgentTraceNode[], minScore: number): LogEntry[] {
  const logs: LogEntry[] = []
  const name = c.name.split(" ")[0].toLowerCase()

  // 1. Application received
  logs.push({
    icon: "1", label: "Application Received",
    detail: `${c.name} submitted their application with resume, email, and profile links.`,
    type: "status", color: "bg-slate-400",
  })

  // 2. Scoring
  if (c.score > 0) {
    const scoreTrace = traceNodes.find(
      (n) => n.nodeName === "score_resume" && (n.outputSummary?.toLowerCase().includes(name) || n.message?.toLowerCase().includes(name))
    )
    logs.push({
      icon: "2", label: "AI Resume Screening",
      detail: `Resume Scorer agent evaluated the candidate against the job description and assigned a score of ${c.score}/100.`,
      agent: "score_resume",
      type: "agent",
      color: "bg-blue-400",
    })
    if (scoreTrace) {
      logs.push({
        icon: "", label: "Scoring Trace",
        detail: scoreTrace.outputSummary || scoreTrace.message || "",
        agent: "score_resume",
        type: "data",
        color: "bg-blue-400",
      })
    }

    // Rank result
    const rankTrace = traceNodes.find((n) => n.nodeName === "rank_and_shortlist")
    const eligible = c.score >= minScore
    logs.push({
      icon: "3", label: "Rank & Shortlist",
      detail: eligible
        ? `Score ${c.score} meets the threshold (${minScore}). Candidate is eligible for outreach.`
        : `Score ${c.score} is below the threshold (${minScore}). Candidate is not eligible for outreach.`,
      agent: "rank_and_shortlist",
      type: "agent",
      color: eligible ? "bg-amber-400" : "bg-red-400",
    })
    if (rankTrace) {
      logs.push({
        icon: "", label: "Shortlist Trace",
        detail: rankTrace.outputSummary || rankTrace.message || "",
        agent: "rank_and_shortlist",
        type: "data",
        color: "bg-amber-400",
      })
    }
  }

  // 3. Outreach drafted
  if (c.emailDraft) {
    const outreachTrace = traceNodes.find(
      (n) => n.nodeName === "draft_outreach" && (n.outputSummary?.toLowerCase().includes(name) || n.message?.toLowerCase().includes(name))
    )
    logs.push({
      icon: "4", label: "Outreach Email Drafted",
      detail: `Outreach Drafter agent composed a personalized email for ${c.name} with an availability link.`,
      agent: "draft_outreach",
      type: "agent",
      color: "bg-violet-400",
    })
    if (outreachTrace) {
      logs.push({
        icon: "", label: "Outreach Trace",
        detail: outreachTrace.outputSummary || outreachTrace.message || "",
        agent: "draft_outreach",
        type: "data",
        color: "bg-violet-400",
      })
    }
  }

  // 4. Email sent
  if (["outreach_sent", "availability_received", "scheduled"].includes(c.status)) {
    logs.push({
      icon: "5", label: "Outreach Email Sent",
      detail: `Email was sent to ${c.email} via Resend with an interview availability link.`,
      type: "status",
      color: "bg-violet-400",
    })
  }

  // 5. Availability received
  if (c.availabilitySlots && c.availabilitySlots.length > 0) {
    logs.push({
      icon: "6", label: "Availability Submitted",
      detail: `Candidate confirmed ${c.availabilitySlots.length} available time slot${c.availabilitySlots.length === 1 ? "" : "s"} for interview.`,
      type: "status",
      color: "bg-cyan-400",
    })
  }

  // 6. Scheduled
  if (c.status === "scheduled" && c.scheduledSlot) {
    const schedTrace = traceNodes.find((n) => n.nodeName === "assign_slots")
    logs.push({
      icon: "7", label: "Interview Scheduled",
      detail: `Slot Scheduler assigned ${c.name} to ${c.scheduledPanel} at ${formatSlot(c.scheduledSlot)}. Calendar invite (.ics) generated.`,
      agent: "assign_slots",
      type: "agent",
      color: "bg-emerald-400",
    })
    if (schedTrace) {
      logs.push({
        icon: "", label: "Scheduling Trace",
        detail: schedTrace.outputSummary || schedTrace.message || "",
        agent: "assign_slots",
        type: "data",
        color: "bg-emerald-400",
      })
    }
  }

  return logs
}

export default function CandidateModal({
  candidate,
  minScore,
  actionLoading,
  traceNodes,
  onClose,
  onDraftOutreach,
  onSendEmail,
  onScheduleAll,
}: Props) {
  const [tab, setTab] = useState<"overview" | "resume" | "outreach" | "logs">("overview")
  const [copied, setCopied] = useState(false)
  const [messageId, setMessageId] = useState<string | null>(null)
  const [deliveryInfo, setDeliveryInfo] = useState<{ actualTo: string; redirected: boolean } | null>(null)
  const [sendError, setSendError] = useState("")

  const c = candidate
  const isEligible = c.score >= minScore
  const availabilityUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/availability/${c.availabilityToken}`
      : `/availability/${c.availabilityToken}`

  const renderedDraft = c.emailDraft
    ? c.emailDraft.replace(/\[AVAILABILITY_LINK\]/g, availabilityUrl)
    : ""

  function copyLink() {
    navigator.clipboard.writeText(availabilityUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSend() {
    setSendError("")
    const result = await onSendEmail(c.id)
    if (result) {
      setMessageId(result.messageId ?? null)
      if (result.actualTo) {
        setDeliveryInfo({ actualTo: result.actualTo, redirected: Boolean(result.redirected) })
      }
    } else {
      setSendError("Failed to send email. Check the server logs.")
    }
  }

  const breakdown = Array.isArray(c.criteriaBreakdown) ? c.criteriaBreakdown : []
  const emailSent = c.status === "outreach_sent" || c.status === "availability_received" || c.status === "scheduled" || !!messageId
  const logs = buildCandidateLogs(c, traceNodes, minScore)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-cardborder bg-card shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-fg">{c.name}</h2>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-sm text-muted">{c.email}</p>
            <div className="flex gap-3 mt-1 text-xs text-muted">
              {c.linkedinUrl && (
                <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accentlt transition">LinkedIn</a>
              )}
              {c.githubUrl && (
                <a href={c.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accentlt transition">GitHub</a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {c.score > 0 && (
              <div className={`rounded-xl border px-4 py-2 text-center ${scoreColor(c.score)}`}>
                <div className="text-2xl font-bold leading-none">{c.score}</div>
                <div className="text-[10px] uppercase tracking-wider mt-0.5 opacity-70">Score</div>
              </div>
            )}
            <button onClick={onClose} className="text-muted hover:text-fg transition p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4 pb-0">
          {(["overview", "resume", "outreach", "logs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                tab === t
                  ? "bg-accent/20 text-accentlt"
                  : "text-muted hover:text-fg hover:bg-cardhover"
              }`}
            >
              {t === "overview" ? "Overview" : t === "resume" ? "Resume" : t === "outreach" ? "Outreach" : `Logs (${logs.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* OVERVIEW TAB */}
          {tab === "overview" && (
            <>
              {c.reasoning && (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">AI Assessment</h4>
                  <p className="text-sm text-fg/80 leading-relaxed">{c.reasoning}</p>
                </div>
              )}
              {breakdown.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Criteria Breakdown</h4>
                  <div className="rounded-xl bg-surface border border-cardborder p-3 space-y-2">
                    {breakdown.map((cr, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-fg/80">{cr.criterion}</span>
                          <span className={`text-xs font-bold ${scoreColor(cr.score).split(" ")[0]}`}>{cr.score}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-cardborder overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              cr.score >= 85 ? "bg-emerald-400" : cr.score >= 70 ? "bg-blue-400" : cr.score >= 50 ? "bg-amber-400" : "bg-red-400"
                            }`}
                            style={{ width: `${cr.score}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted mt-0.5">{cr.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {c.status === "scored" && (
                <div className={`rounded-xl border p-3 text-xs ${isEligible ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
                  {isEligible ? `Score ${c.score} meets the threshold (${minScore}). Eligible for outreach.` : `Score ${c.score} is below the threshold (${minScore}). Not eligible for outreach.`}
                </div>
              )}
              {c.status === "scheduled" && c.scheduledSlot && (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Interview Details</h4>
                  <div className="rounded-xl bg-surface border border-cardborder p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Time</span>
                      <span className="text-fg font-medium">{formatSlot(c.scheduledSlot)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Panel</span>
                      <span className="text-fg font-medium">{c.scheduledPanel}</span>
                    </div>
                  </div>
                </div>
              )}
              {c.availabilitySlots && c.availabilitySlots.length > 0 && c.status !== "scheduled" && (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Submitted Availability ({c.availabilitySlots.length} slots)</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {c.availabilitySlots.map((slot, i) => (
                      <span key={i} className="text-[10px] bg-surface border border-cardborder rounded-lg px-2 py-1 text-muted">{formatSlot(slot)}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* RESUME TAB */}
          {tab === "resume" && (
            <div>
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Full Resume</h4>
              {c.resume ? (
                <div className="rounded-xl bg-surface border border-cardborder p-4 max-h-[50vh] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs text-fg/70 font-sans leading-relaxed">{c.resume}</pre>
                </div>
              ) : (
                <p className="text-sm text-muted">No resume text available.</p>
              )}
            </div>
          )}

          {/* OUTREACH TAB */}
          {tab === "outreach" && (
            <>
              {c.emailDraft ? (
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Drafted Email <span className="text-muted/50 normal-case font-normal">&rarr; {c.email}</span>
                  </h4>
                  <div className="rounded-xl bg-surface border border-cardborder p-4 mb-3">
                    <pre className="whitespace-pre-wrap text-xs text-fg/80 font-sans leading-relaxed">{renderedDraft}</pre>
                  </div>
                  {messageId && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 mb-3 text-xs text-emerald-300">
                      <div className="font-medium">Delivered via Resend</div>
                      <div className="font-mono text-[11px] mt-0.5 text-emerald-400/70">Message ID: {messageId}</div>
                      {deliveryInfo?.redirected && (
                        <div className="mt-1.5 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1">
                          Test mode: rerouted to <span className="font-mono">{deliveryInfo.actualTo}</span> (original: {c.email})
                        </div>
                      )}
                    </div>
                  )}
                  {sendError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 mb-3 text-xs text-red-300">{sendError}</div>
                  )}
                  {c.availabilityToken && (
                    <div className="flex items-center gap-2 mb-3">
                      <button onClick={copyLink} className="rounded-lg border border-cardborder px-3 py-1.5 text-xs font-medium text-muted hover:text-fg hover:bg-cardhover transition">
                        {copied ? "Copied!" : "Copy Availability Link"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-cardborder p-6 text-center">
                  <p className="text-xs text-muted mb-2">No outreach email drafted yet.</p>
                  {c.status === "scored" && isEligible && (
                    <p className="text-[10px] text-accentlt/70">Use the &ldquo;Draft Outreach&rdquo; action to generate an email for this candidate.</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* LOGS TAB */}
          {tab === "logs" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Activity Log
                </h4>
                <span className="text-[10px] text-muted font-mono">{logs.length} events</span>
              </div>

              {logs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-cardborder p-6 text-center">
                  <p className="text-xs text-muted">No activity recorded yet for this candidate.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-cardborder" />

                  <div className="space-y-4">
                    {logs.map((log, i) => (
                      <div key={i} className="relative pl-8">
                        {/* Timeline node */}
                        {log.icon ? (
                          <div className={`absolute left-0 top-0.5 h-6 w-6 rounded-full ${log.color} flex items-center justify-center`}>
                            <span className="text-[9px] font-bold text-white">{log.icon}</span>
                          </div>
                        ) : (
                          <div className="absolute left-[7px] top-1.5 h-3 w-3 rounded-full bg-cardborder ring-2 ring-card" />
                        )}

                        {/* Content */}
                        <div className={`${log.type === "data" ? "ml-0" : ""}`}>
                          {log.type !== "data" && (
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-semibold text-fg">{log.label}</span>
                              {log.agent && (
                                <span className="text-[9px] font-mono text-accentlt bg-accent/15 rounded px-1.5 py-0.5">
                                  {log.agent}
                                </span>
                              )}
                            </div>
                          )}
                          <p className={`text-[11px] leading-relaxed ${log.type === "data" ? "text-muted/70 font-mono bg-surface border border-cardborder rounded-lg px-3 py-2" : "text-muted"}`}>
                            {log.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-cardborder px-5 py-3 flex items-center gap-2 shrink-0 bg-card">
          {c.status === "scored" && isEligible && !c.emailDraft && (
            <button onClick={() => onDraftOutreach(c.id)} disabled={actionLoading === "drafting"}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50 transition">
              {actionLoading === "drafting" ? "Drafting..." : "Draft Outreach Email"}
            </button>
          )}
          {c.status === "shortlisted" && c.emailDraft && !emailSent && (
            <button onClick={handleSend} disabled={actionLoading === "sending"}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition">
              {actionLoading === "sending" ? "Sending..." : "Send Email"}
            </button>
          )}
          {emailSent && c.emailDraft && c.status === "shortlisted" && (
            <span className="text-xs text-emerald-400 font-medium">Email sent</span>
          )}
          {c.status === "availability_received" && (
            <button onClick={onScheduleAll} disabled={actionLoading === "scheduling"}
              className="rounded-lg bg-ctext/80 px-4 py-2 text-xs font-medium text-white hover:bg-ctext/90 disabled:opacity-50 transition">
              {actionLoading === "scheduling" ? "Scheduling..." : "Schedule Interview"}
            </button>
          )}
          {c.status === "scheduled" && c.icsFile && (
            <button onClick={() => downloadIcs(c.icsFile, c.name)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition">
              Download .ics
            </button>
          )}
          <button onClick={onClose}
            className="ml-auto rounded-lg border border-cardborder px-4 py-2 text-xs font-medium text-muted hover:text-fg hover:bg-cardhover transition">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

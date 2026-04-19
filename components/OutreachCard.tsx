"use client"

import { useState } from "react"

interface Props {
  candidateId: string
  candidateName: string
  candidateEmail: string
  emailDraft: string
  availabilityToken: string
  alreadySent: boolean
  onSent: () => void
}

export default function OutreachCard({
  candidateId,
  candidateName,
  candidateEmail,
  emailDraft,
  availabilityToken,
  alreadySent,
  onSent,
}: Props) {
  const [sent, setSent] = useState(alreadySent)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [messageId, setMessageId] = useState<string | null>(null)
  const [deliveryInfo, setDeliveryInfo] = useState<{ actualTo: string; redirected: boolean } | null>(null)
  const [error, setError] = useState("")

  const availabilityUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/availability/${availabilityToken}`
      : `/availability/${availabilityToken}`

  const renderedDraft = emailDraft.replace(/\[AVAILABILITY_LINK\]/g, availabilityUrl)

  async function handleSendEmail() {
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Send failed")
      setSent(true)
      setMessageId(data.messageId)
      setDeliveryInfo({ actualTo: data.actualTo, redirected: Boolean(data.redirected) })
      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed")
    } finally {
      setSending(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(availabilityUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-cardborder bg-card/70 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-fg">{candidateName}</h3>
          <p className="text-xs text-muted mt-0.5">&rarr; {candidateEmail}</p>
        </div>
        {sent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-violet-500/20">
            Email Sent
          </span>
        )}
      </div>

      <div className="rounded-xl bg-surface border border-cardborder p-4 mb-3">
        <pre className="whitespace-pre-wrap text-sm text-fg/80 font-sans leading-relaxed">
          {renderedDraft}
        </pre>
      </div>

      {messageId && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 mb-3 text-xs text-emerald-300">
          <div className="font-medium">Delivered via Resend</div>
          <div className="font-mono text-[11px] mt-0.5 text-emerald-400/70">Message ID: {messageId}</div>
          {deliveryInfo?.redirected && (
            <div className="mt-1.5 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1">
              Test mode: rerouted to <span className="font-mono">{deliveryInfo.actualTo}</span> (original: {candidateEmail})
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 mb-3 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSendEmail}
          disabled={sent || sending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {sent ? "Sent" : sending ? "Sending..." : "Send Email"}
        </button>
        <button
          onClick={copyLink}
          className="rounded-lg border border-cardborder px-4 py-2 text-sm font-medium text-muted hover:text-fg hover:bg-cardhover transition"
        >
          {copied ? "Copied!" : "Copy Availability Link"}
        </button>
      </div>
    </div>
  )
}

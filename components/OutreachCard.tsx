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
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold">{candidateName}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">→ {candidateEmail}</p>
        </div>
        {sent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
            ✓ Email Sent
          </span>
        )}
      </div>

      <div className="rounded-md bg-neutral-50 border border-neutral-200 p-4 mb-3">
        <pre className="whitespace-pre-wrap text-sm text-neutral-800 font-sans leading-relaxed">
          {renderedDraft}
        </pre>
      </div>

      {messageId && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 mb-3 text-xs text-green-800">
          <div className="font-medium">✓ Delivered via Resend</div>
          <div className="font-mono text-[11px] mt-0.5 text-green-700">Message ID: {messageId}</div>
          {deliveryInfo?.redirected && (
            <div className="mt-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              Test mode: rerouted to <span className="font-mono">{deliveryInfo.actualTo}</span> (original recipient: {candidateEmail})
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 mb-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSendEmail}
          disabled={sent || sending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition"
        >
          {sent ? "✓ Sent" : sending ? "Sending..." : "Send Email"}
        </button>
        <button
          onClick={copyLink}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
        >
          {copied ? "✓ Copied" : "Copy Availability Link"}
        </button>
      </div>
    </div>
  )
}

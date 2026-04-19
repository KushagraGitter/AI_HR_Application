"use client"

import { useState } from "react"

interface Props {
  candidateId: string
  candidateName: string
  emailDraft: string
  availabilityToken: string
  alreadySent: boolean
  onSent: () => void
}

export default function OutreachCard({
  candidateId,
  candidateName,
  emailDraft,
  availabilityToken,
  alreadySent,
  onSent,
}: Props) {
  const [sent, setSent] = useState(alreadySent)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)

  const availabilityUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/availability/${availabilityToken}`
      : `/availability/${availabilityToken}`

  const renderedDraft = emailDraft.replace(/\[AVAILABILITY_LINK\]/g, availabilityUrl)

  async function handleMarkSent() {
    setSending(true)
    try {
      await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "outreach_sent" }),
      })
      setSent(true)
      onSent()
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
        <h3 className="font-semibold">{candidateName}</h3>
        {sent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
            ✓ Outreach Sent
          </span>
        )}
      </div>

      <div className="rounded-md bg-neutral-50 border border-neutral-200 p-4 mb-3">
        <pre className="whitespace-pre-wrap text-sm text-neutral-800 font-sans leading-relaxed">
          {renderedDraft}
        </pre>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleMarkSent}
          disabled={sent || sending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition"
        >
          {sent ? "Sent" : sending ? "Sending..." : "Mark as Sent"}
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

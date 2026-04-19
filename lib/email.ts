import { Resend } from "resend"

let cached: Resend | null = null
function getResend(): Resend {
  if (cached) return cached
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY is not set in .env.local")
  cached = new Resend(apiKey)
  return cached
}

interface SendOutreachArgs {
  to: string
  candidateName: string
  jobTitle: string
  bodyText: string
}

interface SendResult {
  id: string
  to: string
  subject: string
}

function plainTextToHtml(text: string): string {
  // Simple: preserve line breaks, escape HTML, and keep availability link clickable
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  const withLinks = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#1d4ed8;text-decoration:underline">$1</a>'
  )
  return `<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;line-height:1.6;color:#1f2937;max-width:640px;padding:24px">${withLinks.replace(/\n/g, "<br/>")}</div>`
}

export async function sendOutreachEmail({
  to,
  candidateName,
  jobTitle,
  bodyText,
}: SendOutreachArgs): Promise<SendResult> {
  const resend = getResend()
  const from = process.env.RESEND_FROM_EMAIL ?? "AI HR Agent <onboarding@resend.dev>"

  // Free-tier Resend only permits sending to the account owner email.
  // If RESEND_TEST_REDIRECT_TO is set, reroute all mail there and surface the intended recipient.
  const redirectTo = process.env.RESEND_TEST_REDIRECT_TO?.trim()
  const redirected = Boolean(redirectTo && redirectTo.toLowerCase() !== to.toLowerCase())
  const actualTo = redirected ? redirectTo! : to

  const subject = redirected
    ? `[TEST → ${to}] Interview Availability — ${jobTitle}`
    : `Interview Availability — ${jobTitle}`

  const finalBody = redirected
    ? `⚠️ TEST MODE: This email was originally intended for ${candidateName} <${to}>.\n` +
      `Rerouted here because the Resend account has no verified domain.\n` +
      `────────────────────────────────────────────────\n\n${bodyText}`
    : bodyText

  const result = await resend.emails.send({
    from,
    to: actualTo,
    subject,
    text: finalBody,
    html: plainTextToHtml(finalBody),
    headers: {
      "X-AI-HR-Agent-Candidate": candidateName,
      "X-AI-HR-Agent-Intended-To": to,
    },
  })

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`)
  }
  if (!result.data?.id) {
    throw new Error("Resend did not return a message ID")
  }

  return {
    id: result.data.id,
    to: actualTo,
    subject,
  }
}

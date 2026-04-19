import { getLLM } from "../llm"
import type { HRAgentState } from "../state"
import type { AgentTraceNode, OutreachDraft } from "@/types"
import { v4 as uuidv4 } from "uuid"

export async function draftOutreachNode(state: HRAgentState): Promise<Partial<HRAgentState>> {
  const start = Date.now()
  const llm = getLLM()

  const drafts: OutreachDraft[] = []

  for (const candidate of state.shortlist) {
    const availabilityToken = uuidv4()

    const prompt = `You are an HR professional reaching out to a shortlisted candidate. Write a concise, warm email asking for their availability for an interview.

Role: ${state.jobTitle}
Candidate Name: ${candidate.name}
Availability Form Link: [AVAILABILITY_LINK]

Write ONLY the email body (no subject line, no "Subject:", just the email body starting with the greeting). 
Keep it under 120 words. Be warm, professional, and specific about the role.
End with instructions to click [AVAILABILITY_LINK] to share available slots.`

    const response = await llm.invoke(prompt)
    const emailDraft = (response.content as string).trim()

    drafts.push({
      candidateId: candidate.id,
      emailDraft,
      availabilityToken,
    })
  }

  const traceNode: AgentTraceNode = {
    nodeName: "draft_outreach",
    inputSummary: `Drafting for ${state.shortlist.length} shortlisted candidates`,
    outputSummary: `Drafted ${drafts.length} emails with availability tokens`,
    durationMs: Date.now() - start,
  }

  return { outreachDrafts: drafts, trace: [traceNode] }
}

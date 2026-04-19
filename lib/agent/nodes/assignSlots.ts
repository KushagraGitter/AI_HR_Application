import type { HRAgentState } from "../state"
import type { AgentTraceNode, ScheduledSlot } from "@/types"
import { PANEL_MEMBERS } from "../panelData"
import { generateIcs } from "@/lib/ics"

export async function assignSlotsNode(state: HRAgentState): Promise<Partial<HRAgentState>> {
  const start = Date.now()

  const scheduledSlots: ScheduledSlot[] = []
  const usedSlots = new Set<string>() // "panelName|slot"

  for (const response of state.availabilityResponses) {
    const candidate = state.candidates.find(c => c.id === response.candidateId)
    if (!candidate) continue

    let matched = false

    for (const candidateSlot of response.slots) {
      for (const panelMember of PANEL_MEMBERS) {
        const key = `${panelMember.name}|${candidateSlot}`
        if (usedSlots.has(key)) continue

        if (panelMember.slots.includes(candidateSlot)) {
          usedSlots.add(key)

          const icsFile = generateIcs({
            title: `Interview: ${candidate.name} for ${state.jobTitle}`,
            start: candidateSlot,
            durationMinutes: 60,
            organizer: panelMember.name,
            attendee: candidate.name,
            attendeeEmail: candidate.email,
          })

          scheduledSlots.push({
            candidateId: candidate.id,
            candidateName: candidate.name,
            panelMember: panelMember.name,
            slot: candidateSlot,
            icsFile,
          })

          matched = true
          break
        }
      }
      if (matched) break
    }

    // If no overlap found, assign the first available panel slot
    if (!matched && response.slots.length > 0) {
      const fallbackPanel = PANEL_MEMBERS[0]
      const fallbackSlot = fallbackPanel.slots[scheduledSlots.length % fallbackPanel.slots.length]

      const icsFile = generateIcs({
        title: `Interview: ${candidate.name} for ${state.jobTitle}`,
        start: fallbackSlot,
        durationMinutes: 60,
        organizer: fallbackPanel.name,
        attendee: candidate.name,
        attendeeEmail: candidate.email,
      })

      scheduledSlots.push({
        candidateId: candidate.id,
        candidateName: candidate.name,
        panelMember: fallbackPanel.name,
        slot: fallbackSlot,
        icsFile,
      })
    }
  }

  const traceNode: AgentTraceNode = {
    nodeName: "assign_slots",
    inputSummary: `${state.availabilityResponses.length} availability responses`,
    outputSummary: `Scheduled ${scheduledSlots.length} interviews: ${scheduledSlots.map(s => `${s.candidateName} → ${s.panelMember}`).join(", ")}`,
    durationMs: Date.now() - start,
  }

  return { scheduledSlots, trace: [traceNode] }
}

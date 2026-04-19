import type { HRAgentState } from "../state"
import type { AgentTraceNode } from "@/types"

const SHORTLIST_THRESHOLD = 70
const MAX_SHORTLIST = 5

export async function rankAndShortlistNode(state: HRAgentState): Promise<Partial<HRAgentState>> {
  const start = Date.now()

  const sorted = [...state.candidates].sort((a, b) => b.score - a.score)
  const shortlist = sorted
    .filter(c => c.score >= SHORTLIST_THRESHOLD)
    .slice(0, MAX_SHORTLIST)
    .map(c => ({ ...c, status: "shortlisted" as const }))

  const traceNode: AgentTraceNode = {
    nodeName: "rank_and_shortlist",
    inputSummary: `${state.candidates.length} scored candidates | Threshold: ${SHORTLIST_THRESHOLD}`,
    outputSummary: `Shortlisted ${shortlist.length} candidates: ${shortlist.map(c => `${c.name}(${c.score})`).join(", ")}`,
    durationMs: Date.now() - start,
  }

  return { shortlist, trace: [traceNode] }
}

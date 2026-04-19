import { getLLM } from "../llm"
import type { HRAgentState } from "../state"
import type { AgentTraceNode, ScoredCandidate, CriterionScore } from "@/types"

export async function scoreResumeNode(state: HRAgentState): Promise<Partial<HRAgentState>> {
  const start = Date.now()
  const llm = getLLM()

  const scoredCandidates: ScoredCandidate[] = []

  for (const candidate of state.candidates) {
    const prompt = `You are an expert technical recruiter. Score this candidate's resume against the job description.

JOB DESCRIPTION:
${state.jd}

CANDIDATE RESUME:
${candidate.resume}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "score": <number 0-100>,
  "reasoning": "<2-3 sentence summary of fit>",
  "criteriaBreakdown": [
    { "criterion": "<criterion name>", "score": <0-100>, "comment": "<one sentence>" },
    { "criterion": "<criterion name>", "score": <0-100>, "comment": "<one sentence>" },
    { "criterion": "<criterion name>", "score": <0-100>, "comment": "<one sentence>" },
    { "criterion": "<criterion name>", "score": <0-100>, "comment": "<one sentence>" }
  ]
}`

    try {
      const response = await llm.invoke(prompt)
      const raw = (response.content as string).trim()
      const cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim()
      const parsed = JSON.parse(cleaned) as {
        score: number
        reasoning: string
        criteriaBreakdown: CriterionScore[]
      }

      scoredCandidates.push({
        ...candidate,
        score: parsed.score,
        reasoning: parsed.reasoning,
        criteriaBreakdown: parsed.criteriaBreakdown,
        status: "scored",
      })
    } catch {
      // If parsing fails, give a default score
      scoredCandidates.push({
        ...candidate,
        score: 50,
        reasoning: "Could not parse AI response. Manual review required.",
        criteriaBreakdown: [],
        status: "scored",
      })
    }
  }

  const avgScore = Math.round(scoredCandidates.reduce((s, c) => s + c.score, 0) / scoredCandidates.length)

  const traceNode: AgentTraceNode = {
    nodeName: "score_resume",
    inputSummary: `${state.candidates.length} candidates scored against JD`,
    outputSummary: `Scores: ${scoredCandidates.map(c => `${c.name}=${c.score}`).join(", ")} | Avg: ${avgScore}`,
    durationMs: Date.now() - start,
  }

  return { candidates: scoredCandidates, trace: [traceNode] }
}

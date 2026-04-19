import { getLLM } from "../llm"
import type { HRAgentState } from "../state"
import type { AgentTraceNode } from "@/types"

export async function generateJdNode(state: HRAgentState): Promise<Partial<HRAgentState>> {
  const start = Date.now()
  const llm = getLLM()

  const prompt = `You are an expert HR professional. Write a detailed, professional job description.

Job Title: ${state.jobTitle}
Key Requirements: ${state.requirements}

Write a job description with these sections:
1. About the Role (2-3 sentences)
2. Responsibilities (5-6 bullet points)
3. Requirements (must-haves, 4-5 bullet points)
4. Nice to Have (2-3 bullet points)

Be specific and professional. Do not add salary or location.`

  const response = await llm.invoke(prompt)
  const jd = response.content as string

  const traceNode: AgentTraceNode = {
    nodeName: "generate_jd",
    inputSummary: `Title: ${state.jobTitle} | Requirements: ${state.requirements.slice(0, 80)}...`,
    outputSummary: `Generated JD (${jd.length} chars)`,
    durationMs: Date.now() - start,
  }

  return { jd, trace: [traceNode] }
}

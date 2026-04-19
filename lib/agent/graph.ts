import { StateGraph, END } from "@langchain/langgraph"
import { HRAgentAnnotation } from "./state"
import { generateJdNode } from "./nodes/generateJd"
import { scoreResumeNode } from "./nodes/scoreResume"
import { rankAndShortlistNode } from "./nodes/rankAndShortlist"
import { draftOutreachNode } from "./nodes/draftOutreach"
import { assignSlotsNode } from "./nodes/assignSlots"

// Full pipeline graph: JD → Score → Rank → Outreach
export function buildFullGraph() {
  const graph = new StateGraph(HRAgentAnnotation)
    .addNode("generate_jd", generateJdNode)
    .addNode("score_resume", scoreResumeNode)
    .addNode("rank_and_shortlist", rankAndShortlistNode)
    .addNode("draft_outreach", draftOutreachNode)
    .addEdge("__start__", "generate_jd")
    .addEdge("generate_jd", "score_resume")
    .addEdge("score_resume", "rank_and_shortlist")
    .addEdge("rank_and_shortlist", "draft_outreach")
    .addEdge("draft_outreach", END)

  return graph.compile()
}

// JD-only graph: just generate the JD
export function buildJdGraph() {
  const graph = new StateGraph(HRAgentAnnotation)
    .addNode("generate_jd", generateJdNode)
    .addEdge("__start__", "generate_jd")
    .addEdge("generate_jd", END)

  return graph.compile()
}

// Scoring graph: score new candidates and rank them
export function buildScoringGraph() {
  const graph = new StateGraph(HRAgentAnnotation)
    .addNode("score_resume", scoreResumeNode)
    .addNode("rank_and_shortlist", rankAndShortlistNode)
    .addEdge("__start__", "score_resume")
    .addEdge("score_resume", "rank_and_shortlist")
    .addEdge("rank_and_shortlist", END)

  return graph.compile()
}

// Outreach graph: draft emails for shortlisted candidates
export function buildOutreachGraph() {
  const graph = new StateGraph(HRAgentAnnotation)
    .addNode("draft_outreach", draftOutreachNode)
    .addEdge("__start__", "draft_outreach")
    .addEdge("draft_outreach", END)

  return graph.compile()
}

// Scheduling graph: assign slots from availability responses
export function buildSchedulingGraph() {
  const graph = new StateGraph(HRAgentAnnotation)
    .addNode("assign_slots", assignSlotsNode)
    .addEdge("__start__", "assign_slots")
    .addEdge("assign_slots", END)

  return graph.compile()
}

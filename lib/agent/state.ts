import { Annotation } from "@langchain/langgraph"
import type { ScoredCandidate, OutreachDraft, AvailabilityResponse, ScheduledSlot, AgentTraceNode } from "@/types"

export const HRAgentAnnotation = Annotation.Root({
  jobId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  jobTitle: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  requirements: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  jd: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  candidates: Annotation<ScoredCandidate[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  shortlist: Annotation<ScoredCandidate[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  outreachDrafts: Annotation<OutreachDraft[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  availabilityResponses: Annotation<AvailabilityResponse[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  scheduledSlots: Annotation<ScheduledSlot[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  trace: Annotation<AgentTraceNode[]>({
    reducer: (existing, next) => [...existing, ...next],
    default: () => [],
  }),
})

export type HRAgentState = typeof HRAgentAnnotation.State

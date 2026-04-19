export interface Job {
  id: string
  title: string
  requirements: string
  jd: string
  createdAt: string
}

export interface Candidate {
  id: string
  jobId: string
  name: string
  email: string
  resume: string
  linkedinUrl: string
  githubUrl: string
  status: 'applied' | 'scored' | 'shortlisted' | 'outreach_sent' | 'availability_received' | 'scheduled'
}

export interface CriterionScore {
  criterion: string
  score: number
  comment: string
}

export interface ScoredCandidate extends Candidate {
  score: number
  reasoning: string
  criteriaBreakdown: CriterionScore[]
}

export interface OutreachDraft {
  candidateId: string
  emailDraft: string
  availabilityToken: string
}

export interface AvailabilityResponse {
  candidateId: string
  slots: string[]
}

export interface PanelMember {
  name: string
  slots: string[]
}

export interface ScheduledSlot {
  candidateId: string
  candidateName: string
  panelMember: string
  slot: string
  icsFile: string
}

export interface AgentTraceNode {
  nodeName: string
  inputSummary: string
  outputSummary: string
  durationMs: number
  // Demo enrichment fields (optional for backwards compat with old records)
  timestamp?: string  // ISO
  level?: "info" | "action" | "success" | "warn" | "error"
  icon?: string       // emoji
  message?: string    // short human-readable message (preferred for display)
  actor?: "system" | "screener" | "outreacher" | "scheduler" | "candidate" | "hr"
}

export interface HRAgentState {
  jobId: string
  jobTitle: string
  requirements: string
  jd: string
  candidates: ScoredCandidate[]
  shortlist: ScoredCandidate[]
  outreachDrafts: OutreachDraft[]
  availabilityResponses: AvailabilityResponse[]
  scheduledSlots: ScheduledSlot[]
  trace: AgentTraceNode[]
}

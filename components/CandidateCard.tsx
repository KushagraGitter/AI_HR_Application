"use client"

import { useState } from "react"
import type { ScoredCandidate, CriterionScore } from "@/types"
import StatusBadge from "./StatusBadge"

interface Props {
  candidate: ScoredCandidate
  checked: boolean
  onToggle: () => void
  disableCheckbox?: boolean
}

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-300 bg-emerald-500/15 border-emerald-500/25"
  if (score >= 70) return "text-blue-300 bg-blue-500/15 border-blue-500/25"
  if (score >= 50) return "text-amber-300 bg-amber-500/15 border-amber-500/25"
  return "text-red-300 bg-red-500/15 border-red-500/25"
}

export default function CandidateCard({ candidate, checked, onToggle, disableCheckbox }: Props) {
  const [showResume, setShowResume] = useState(false)

  const breakdown = Array.isArray(candidate.criteriaBreakdown)
    ? candidate.criteriaBreakdown
    : (JSON.parse((candidate.criteriaBreakdown as unknown as string) || "[]") as CriterionScore[])

  return (
    <div className={`rounded-2xl border bg-card/70 p-5 transition-all duration-200 ${checked ? "border-accent/50 ring-1 ring-accent/30 bg-accentglow" : "border-cardborder hover:border-cardborder/80"}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            disabled={disableCheckbox}
            className="mt-1 h-4 w-4 rounded border-cardborder"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-fg">{candidate.name}</h3>
              <StatusBadge status={candidate.status} />
            </div>
            <p className="text-sm text-muted">{candidate.email}</p>
            <div className="flex gap-3 mt-1 text-xs text-muted">
              {candidate.linkedinUrl && (
                <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accentlt transition">LinkedIn</a>
              )}
              {candidate.githubUrl && (
                <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accentlt transition">GitHub</a>
              )}
            </div>
          </div>
        </div>
        <div className={`rounded-xl border px-3 py-2 text-center min-w-[72px] ${scoreColor(candidate.score)}`}>
          <div className="text-2xl font-bold leading-none">{candidate.score}</div>
          <div className="text-[10px] uppercase tracking-wider mt-0.5 opacity-70">Score</div>
        </div>
      </div>

      <p className="text-sm text-muted leading-relaxed mb-3">{candidate.reasoning}</p>

      {breakdown.length > 0 && (
        <div className="pt-3 border-t border-cardborder space-y-1.5">
          {breakdown.map((c, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="font-mono w-10 text-right text-muted">{c.score}</span>
              <div className="flex-1">
                <span className="font-medium text-fg/80">{c.criterion}</span>
                <span className="text-muted"> — {c.comment}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {candidate.resume && (
        <div className="mt-3 pt-3 border-t border-cardborder">
          <button
            onClick={() => setShowResume(!showResume)}
            className="text-xs font-medium text-accentlt hover:text-accentlt/80 transition"
          >
            {showResume ? "Hide Resume" : "View Resume"}
          </button>
          {showResume && (
            <div className="mt-3 rounded-xl bg-surface border border-cardborder p-4 max-h-80 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs text-fg/70 font-sans leading-relaxed">
                {candidate.resume}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import type { ScoredCandidate, CriterionScore } from "@/types"
import StatusBadge from "./StatusBadge"

interface Props {
  candidate: ScoredCandidate
  checked: boolean
  onToggle: () => void
  disableCheckbox?: boolean
}

function scoreColor(score: number) {
  if (score >= 85) return "text-green-700 bg-green-50 border-green-200"
  if (score >= 70) return "text-blue-700 bg-blue-50 border-blue-200"
  if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200"
  return "text-red-700 bg-red-50 border-red-200"
}

export default function CandidateCard({ candidate, checked, onToggle, disableCheckbox }: Props) {
  const breakdown = Array.isArray(candidate.criteriaBreakdown)
    ? candidate.criteriaBreakdown
    : (JSON.parse((candidate.criteriaBreakdown as unknown as string) || "[]") as CriterionScore[])

  return (
    <div className={`rounded-lg border bg-white p-5 transition ${checked ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200"}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            disabled={disableCheckbox}
            className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{candidate.name}</h3>
              <StatusBadge status={candidate.status} />
            </div>
            <p className="text-sm text-neutral-500">{candidate.email}</p>
            <div className="flex gap-3 mt-1 text-xs text-neutral-500">
              {candidate.linkedinUrl && (
                <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900">LinkedIn ↗</a>
              )}
              {candidate.githubUrl && (
                <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900">GitHub ↗</a>
              )}
            </div>
          </div>
        </div>
        <div className={`rounded-md border px-3 py-2 text-center min-w-[72px] ${scoreColor(candidate.score)}`}>
          <div className="text-2xl font-bold leading-none">{candidate.score}</div>
          <div className="text-[10px] uppercase tracking-wider mt-0.5">Score</div>
        </div>
      </div>

      <p className="text-sm text-neutral-700 leading-relaxed mb-3">{candidate.reasoning}</p>

      {breakdown.length > 0 && (
        <div className="pt-3 border-t border-neutral-100 space-y-1.5">
          {breakdown.map((c, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="font-mono w-10 text-right text-neutral-500">{c.score}</span>
              <div className="flex-1">
                <span className="font-medium text-neutral-900">{c.criterion}</span>
                <span className="text-neutral-500"> — {c.comment}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

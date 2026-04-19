interface Props {
  status: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string; ring: string; label: string }> = {
  applied:                { bg: "bg-slate-500/15",    text: "text-slate-300",   ring: "ring-slate-500/20",   label: "Applied" },
  scored:                 { bg: "bg-blue-500/15",     text: "text-blue-300",    ring: "ring-blue-500/20",    label: "Scored" },
  shortlisted:            { bg: "bg-amber-500/15",    text: "text-amber-300",   ring: "ring-amber-500/20",   label: "Shortlisted" },
  outreach_sent:          { bg: "bg-violet-500/15",   text: "text-violet-300",  ring: "ring-violet-500/20",  label: "Outreach Sent" },
  availability_received:  { bg: "bg-cyan-500/15",     text: "text-cyan-300",    ring: "ring-cyan-500/20",    label: "Availability In" },
  scheduled:              { bg: "bg-emerald-500/15",  text: "text-emerald-300", ring: "ring-emerald-500/20", label: "Scheduled" },
}

export default function StatusBadge({ status }: Props) {
  const style = STATUS_STYLES[status] ?? { bg: "bg-slate-500/15", text: "text-slate-300", ring: "ring-slate-500/20", label: status }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${style.bg} ${style.text} ${style.ring}`}>
      {style.label}
    </span>
  )
}

interface Props {
  status: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  applied:                { bg: "bg-neutral-100",  text: "text-neutral-700", label: "Applied" },
  scored:                 { bg: "bg-blue-100",     text: "text-blue-800",    label: "Scored" },
  shortlisted:            { bg: "bg-amber-100",    text: "text-amber-800",   label: "Shortlisted" },
  outreach_sent:          { bg: "bg-purple-100",   text: "text-purple-800",  label: "Outreach Sent" },
  availability_received:  { bg: "bg-teal-100",     text: "text-teal-800",    label: "Availability In" },
  scheduled:              { bg: "bg-green-100",    text: "text-green-800",   label: "Scheduled" },
}

export default function StatusBadge({ status }: Props) {
  const style = STATUS_STYLES[status] ?? { bg: "bg-neutral-100", text: "text-neutral-700", label: status }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}

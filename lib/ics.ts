interface IcsOptions {
  title: string
  start: string         // ISO datetime string e.g. "2026-04-22T10:00:00"
  durationMinutes: number
  organizer: string
  attendee: string
  attendeeEmail: string
}

function toIcsDate(iso: string): string {
  // Convert "2026-04-22T10:00:00" to "20260422T100000Z"
  return iso.replace(/[-:]/g, "").replace("T", "T").split(".")[0] + "Z"
}

function addMinutes(iso: string, minutes: number): string {
  const date = new Date(iso)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

export function generateIcs(options: IcsOptions): string {
  const { title, start, durationMinutes, organizer, attendee, attendeeEmail } = options
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@siftly.local`
  const now = toIcsDate(new Date().toISOString())
  const dtStart = toIcsDate(start)
  const dtEnd = addMinutes(start, durationMinutes)

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Siftly//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `ORGANIZER;CN=${organizer}:mailto:hr@company.com`,
    `ATTENDEE;CN=${attendee};RSVP=TRUE:mailto:${attendeeEmail}`,
    "DESCRIPTION:Interview scheduled via Siftly",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

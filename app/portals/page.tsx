import Link from "next/link"

export const metadata = {
  title: "Live Demo — Siftly",
  description: "Try Siftly live. Pick a portal to see the autonomous hiring agents at work.",
}

export default function PortalsPage() {
  return (
    <div className="mesh-bg min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="absolute top-6 left-6">
        <Link href="/" className="text-sm text-muted hover:text-fg transition">
          ← Landing
        </Link>
      </div>

      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live demo — no signup required
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-fg mb-3">
          Choose Your Portal
        </h1>
        <p className="text-muted text-lg max-w-md mx-auto">
          Pick the view you want to experience.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link
          href="/hr"
          className="group glass-card rounded-2xl p-8 hover:bg-cardhover hover:border-accent/40 hover:shadow-[0_0_40px_rgba(108,92,231,0.1)] transition-all duration-300"
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accentlt text-lg font-bold mb-4 group-hover:scale-110 transition-transform duration-300">
            M
          </div>
          <h2 className="text-xl font-semibold text-fg mb-2">HR Manager</h2>
          <p className="text-sm text-muted leading-relaxed">
            Create job postings, watch agents score candidates live, review outreach drafts, and schedule interviews.
          </p>
          <span className="inline-block mt-4 text-sm font-medium text-accentlt group-hover:text-accentlt/90">
            Open Dashboard →
          </span>
        </Link>

        <Link
          href="/candidates"
          className="group glass-card rounded-2xl p-8 hover:bg-cardhover hover:border-ctext/40 hover:shadow-[0_0_40px_rgba(45,212,191,0.1)] transition-all duration-300"
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ctext/15 text-ctext text-lg font-bold mb-4 group-hover:scale-110 transition-transform duration-300">
            C
          </div>
          <h2 className="text-xl font-semibold text-fg mb-2">Candidate</h2>
          <p className="text-sm text-muted leading-relaxed">
            Browse open positions, view AI-generated job descriptions, and submit your application.
          </p>
          <span className="inline-block mt-4 text-sm font-medium text-ctext group-hover:text-ctext/90">
            Browse Jobs →
          </span>
        </Link>
      </div>
    </div>
  )
}

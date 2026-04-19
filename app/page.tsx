import Link from "next/link"

export default function HomePage() {
  return (
    <div className="mesh-bg min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center mb-14">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 text-accentlt text-2xl font-bold mb-6 ring-1 ring-accent/30">
          HR
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-fg mb-3">
          AI HR Platform
        </h1>
        <p className="text-muted text-lg max-w-md mx-auto">
          AI-powered recruitment pipeline. Choose your portal to get started.
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
            Create job postings, review ranked candidates, draft outreach emails, and schedule interviews.
          </p>
          <span className="inline-block mt-4 text-sm font-medium text-accentlt group-hover:text-accentlt/90">
            Open Dashboard &rarr;
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
            Browse open positions, view job descriptions, and submit your application with resume and profiles.
          </p>
          <span className="inline-block mt-4 text-sm font-medium text-ctext group-hover:text-ctext/90">
            Browse Jobs &rarr;
          </span>
        </Link>
      </div>
    </div>
  )
}

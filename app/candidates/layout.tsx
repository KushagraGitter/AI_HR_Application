import Link from "next/link"

export default function CandidateLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="mesh-bg min-h-screen flex flex-col">
      <nav className="border-b border-cardborder bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted hover:text-fg transition">
              &larr; Home
            </Link>
            <Link href="/candidates" className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ctext/15 text-ctext text-sm font-bold ring-1 ring-ctext/30">
                C
              </span>
              <span className="font-semibold tracking-tight text-fg">Careers Portal</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/candidates"
              className="text-sm text-muted hover:text-fg px-3 py-2 rounded-lg hover:bg-cardhover transition"
            >
              All Jobs
            </Link>
            <Link
              href="/candidates/applications"
              className="rounded-lg bg-accent/15 text-accentlt px-3 py-2 text-sm font-medium hover:bg-accent/25 ring-1 ring-accent/20 transition"
            >
              My Applications
            </Link>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

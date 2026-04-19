import Link from "next/link"

export default function HRLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="mesh-bg min-h-screen flex flex-col">
      <nav className="border-b border-cardborder bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted hover:text-fg transition">
              &larr; Home
            </Link>
            <Link href="/hr" className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accentlt text-sm font-bold ring-1 ring-accent/30">
                HR
              </span>
              <span className="font-semibold tracking-tight text-fg">HR Manager</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/hr"
              className="text-sm text-muted hover:text-fg px-3 py-2 rounded-lg hover:bg-cardhover transition"
            >
              Dashboard
            </Link>
            <Link
              href="/hr/jobs/new"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition shadow-[0_0_20px_rgba(108,92,231,0.2)]"
            >
              + New Job
            </Link>
          </div>
        </div>
      </nav>
      <main className="flex-1 w-full px-6 py-8 flex flex-col min-h-0">
        {children}
      </main>
    </div>
  )
}

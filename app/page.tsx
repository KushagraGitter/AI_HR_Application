import Link from "next/link"
import type { Metadata } from "next"
import WaitlistForm from "./WaitlistForm"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Siftly — Your HR team, on autopilot",
  description:
    "Siftly is the autonomous hiring platform. AI agents score resumes, send outreach, and schedule interviews end-to-end — with zero manual clicks.",
  openGraph: {
    title: "Siftly — Your HR team, on autopilot",
    description:
      "The autonomous hiring platform. AI agents handle screening, outreach, and scheduling end-to-end.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Siftly — Your HR team, on autopilot",
    description:
      "The autonomous hiring platform. AI agents handle screening, outreach, and scheduling end-to-end.",
  },
}

async function getWaitlistCount(): Promise<number> {
  try {
    return await prisma.waitlist.count()
  } catch {
    return 0
  }
}

const FEATURES = [
  {
    icon: "🎯",
    title: "AI Job Description Writer",
    body: "Type a title and bullet points. The agent generates a full, structured JD with sections in 2 seconds.",
  },
  {
    icon: "🧠",
    title: "Resume Scoring Agent",
    body: "Every candidate is evaluated against the JD. Returns a 0–100 score with reasoning and per-criterion breakdown.",
  },
  {
    icon: "✉️",
    title: "Autonomous Outreach",
    body: "When a candidate clears the threshold, the Outreach agent drafts a personalized email and sends it via Resend. Zero human intervention.",
  },
  {
    icon: "📅",
    title: "Smart Scheduling",
    body: "Candidate picks a slot. The Scheduling agent matches it against panel availability and confirms on the spot.",
  },
  {
    icon: "📆",
    title: "Real Calendar Invites",
    body: "Every confirmed interview ships with a valid RFC 5545 .ics file. Opens in Google Calendar, Outlook, Apple Calendar.",
  },
  {
    icon: "📊",
    title: "Live Activity Logs",
    body: "Every agent decision streams to a terminal-style panel. Audit what the agents did, when, and how long each step took.",
  },
]

const PIPELINE_STEPS = [
  {
    num: "01",
    actor: "HR",
    title: "Create a job in 30 seconds",
    body: "Paste a title, paste requirements, click submit. The JD-writer agent generates a full structured job description.",
  },
  {
    num: "02",
    actor: "Autopilot",
    title: "Candidate applies, agent handles it",
    body: "Scorer evaluates the resume. If above threshold, Outreach agent writes a personalized email and sends it. All within 15 seconds.",
  },
  {
    num: "03",
    actor: "Autopilot",
    title: "Scheduling confirms itself",
    body: "Candidate clicks the availability link, picks a slot. The Scheduler assigns a panel member and generates the calendar invite.",
  },
]

const STATS = [
  { value: "~15s", label: "End-to-end per candidate" },
  { value: "0", label: "Manual clicks required" },
  { value: "$0.001", label: "Cost per candidate scored" },
  { value: "5", label: "AI agents collaborating" },
]

export default async function LandingPage() {
  const waitlistCount = await getWaitlistCount()
  const socialProofCount = Math.max(waitlistCount, 0)

  return (
    <div className="mesh-bg min-h-screen">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 border-b border-cardborder bg-card/60 backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accentlt text-sm font-bold ring-1 ring-accent/30">
              S
            </span>
            <span className="font-semibold tracking-tight text-fg text-lg">Siftly</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#waitlist"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition shadow-[0_0_20px_rgba(108,92,231,0.2)]"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accentlt mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Early access · Live now
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-fg mb-6">
            Your HR team,
            <br />
            <span className="bg-gradient-to-r from-accent via-accentlt to-ctext bg-clip-text text-transparent">
              on autopilot.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Siftly is the autonomous hiring platform. AI agents handle{" "}
            <span className="text-fg font-medium">screening</span>,{" "}
            <span className="text-fg font-medium">outreach</span>, and{" "}
            <span className="text-fg font-medium">scheduling</span> end-to-end — from application to confirmed interview
            in seconds, with zero manual clicks.
          </p>

          <div id="waitlist" className="mb-6">
            <WaitlistForm source="hero" />
          </div>

          {socialProofCount > 0 && (
            <p className="text-xs text-muted">
              <span className="text-fg font-semibold">{socialProofCount}</span> already on the waitlist
            </p>
          )}
        </div>

        {/* Glow ring behind hero */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px]" />
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-cardborder bg-card/30">
        <div className="w-full max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent to-ctext bg-clip-text text-transparent mb-1">
                {s.value}
              </div>
              <div className="text-xs uppercase tracking-wider text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="w-full max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-wider text-accentlt mb-3 font-semibold">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-fg">Hire without lifting a finger</h2>
          <p className="text-muted mt-3 max-w-2xl mx-auto">
            Post the job. Share the apply link. The agents do the rest.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PIPELINE_STEPS.map((step) => (
            <div
              key={step.num}
              className="rounded-2xl border border-cardborder bg-card/50 p-6 hover:bg-cardhover hover:border-accent/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl font-bold text-accent/40 tabular-nums">{step.num}</span>
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded ${
                  step.actor === "HR"
                    ? "bg-accent/15 text-accentlt ring-1 ring-accent/20"
                    : "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20"
                }`}>
                  {step.actor}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-fg mb-2">{step.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="border-y border-cardborder bg-card/20">
        <div className="w-full max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-wider text-accentlt mb-3 font-semibold">What's inside</p>
            <h2 className="text-3xl md:text-4xl font-bold text-fg">5 agents. One seamless pipeline.</h2>
            <p className="text-muted mt-3 max-w-2xl mx-auto">
              Each agent has a single job. They coordinate via LangGraph, and every handoff is observable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-cardborder bg-card/60 p-6 hover:bg-cardhover hover:border-accent/30 transition-all duration-300"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-semibold text-fg mb-2">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal log showcase */}
      <section className="w-full max-w-6xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-wider text-accentlt mb-3 font-semibold">Observability</p>
            <h2 className="text-3xl md:text-4xl font-bold text-fg mb-4">
              Watch the agents work in real-time
            </h2>
            <p className="text-muted leading-relaxed mb-6">
              Every decision streams to a live terminal-style log. Timestamp, actor, action, duration.
              Nothing happens in the dark.
            </p>
            <ul className="space-y-3 text-sm">
              {[
                "Color-coded per agent — Screener, Outreach, Scheduler",
                "Timestamped per event to the second",
                "Auto-scrolling with pause control",
                "Persistent — replayable after the demo",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-[0_0_60px_rgba(108,92,231,0.15)]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-800 bg-neutral-900">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-xs font-mono text-neutral-400 ml-2">agent_activity.log</span>
              <span className="ml-auto flex items-center gap-1.5 text-[11px] font-mono text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <div className="p-4 font-mono text-[12px] leading-relaxed space-y-1.5">
              <div className="flex gap-2"><span className="text-neutral-600">14:22:08</span><span className="text-neutral-400 font-semibold w-20">[HR]</span><span>🎯</span><span className="text-green-300">New job created: "Senior Frontend Engineer"</span></div>
              <div className="flex gap-2"><span className="text-neutral-600">14:22:10</span><span className="text-sky-400 font-semibold w-20">[SYSTEM]</span><span>✓</span><span className="text-green-300">JD ready (687 chars) · 1842ms</span></div>
              <div className="flex gap-2"><span className="text-neutral-600">14:22:34</span><span className="text-green-400 font-semibold w-20">[CANDIDATE]</span><span>📥</span><span className="text-green-300">New application from Vikram Singh</span></div>
              <div className="flex gap-2"><span className="text-neutral-600">14:22:37</span><span className="text-blue-400 font-semibold w-20">[SCREENER]</span><span>🧠</span><span className="text-neutral-100">Analyzing resume against job description...</span></div>
              <div className="flex gap-2"><span className="text-neutral-600">14:22:40</span><span className="text-blue-400 font-semibold w-20">[SCREENER]</span><span>🌟</span><span className="text-green-300">Scored 94/100 — Excellent match. Exceeds experience...</span></div>
              <div className="flex gap-2"><span className="text-neutral-600">14:22:45</span><span className="text-purple-400 font-semibold w-20">[OUTREACH]</span><span>✍️</span><span className="text-neutral-100">Drafting personalized email...</span></div>
              <div className="flex gap-2"><span className="text-neutral-600">14:22:50</span><span className="text-purple-400 font-semibold w-20">[OUTREACH]</span><span>✉️</span><span className="text-green-300">Email delivered · Resend id: a3f4b2c9d1e6...</span></div>
              <div className="flex gap-2"><span className="text-neutral-600">14:23:23</span><span className="text-amber-400 font-semibold w-20">[SCHEDULER]</span><span>✓</span><span className="text-green-300">Matched Vikram Singh ↔ Priya Sharma</span></div>
              <div className="flex gap-2"><span className="text-neutral-600">14:23:24</span><span className="text-amber-400 font-semibold w-20">[SCHEDULER]</span><span>📆</span><span className="text-green-300">Interview confirmed: Wed, Apr 22 at 10am</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="border-y border-cardborder bg-card/20">
        <div className="w-full max-w-6xl mx-auto px-6 py-16 text-center">
          <p className="text-xs uppercase tracking-wider text-muted mb-6 font-semibold">Built on</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {["LangGraph", "OpenRouter", "Resend", "Prisma", "Next.js 16", "Tailwind v4", "TypeScript"].map((tech) => (
              <span key={tech} className="text-sm font-medium text-fg">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-fg mb-4">Stop clicking. Start hiring.</h2>
        <p className="text-lg text-muted mb-10 max-w-2xl mx-auto">
          Join the waitlist and be first in line when early access opens. No spam, just one email when it is ready.
        </p>
        <WaitlistForm source="footer-cta" variant="footer" />
      </section>

      {/* Footer */}
      <footer className="border-t border-cardborder">
        <div className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-accent/20 text-accentlt text-[10px] font-bold">S</span>
            <span className="font-medium text-fg">Siftly</span>
            <span className="text-muted">· The autonomous hiring platform</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#waitlist" className="hover:text-fg transition">Waitlist</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

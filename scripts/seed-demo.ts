/**
 * Demo seed script.
 * Creates 1 job + 3 pre-scored candidates so judges have immediate content.
 *
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-demo.ts
 * Safe to run multiple times — it deletes existing demo data before reseeding.
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const DEMO_JOB_TITLE = "Senior Frontend Engineer (Demo)"

async function main() {
  console.log("=== Seeding demo data ===\n")

  // Remove any previous demo job + its candidates
  const existing = await prisma.job.findFirst({ where: { title: DEMO_JOB_TITLE } })
  if (existing) {
    await prisma.candidate.deleteMany({ where: { jobId: existing.id } })
    await prisma.agentTrace.deleteMany({ where: { jobId: existing.id } })
    await prisma.job.delete({ where: { id: existing.id } })
    console.log("Removed previous demo data.")
  }

  const job = await prisma.job.create({
    data: {
      title: DEMO_JOB_TITLE,
      requirements:
        "React, TypeScript, 4+ years experience, system design knowledge, strong communication",
      jd: `About the Role
We are looking for a Senior Frontend Engineer to lead critical user-facing surfaces of our product.

Responsibilities
- Architect and build React applications with TypeScript
- Lead frontend architecture decisions and mentor junior engineers
- Collaborate with design and backend teams on cross-functional features
- Drive performance, accessibility, and quality improvements
- Conduct thorough code reviews

Requirements
- 4+ years of production React experience
- Strong TypeScript skills in production codebases
- Experience with system design for user-facing products
- Clear written and verbal communication

Nice to Have
- Open source contributions
- Experience with Next.js App Router
- GraphQL knowledge`,
    },
  })

  console.log(`Created job: ${job.title} (${job.id})`)

  const candidates = [
    {
      name: "Vikram Singh",
      email: "vikram.demo@example.com",
      resume:
        "6 years building React and TypeScript applications. Led frontend team of 8 at Series B SaaS startup. Migrated monolith to micro-frontends with 40% load time improvement. Regular open source contributor to React libraries. Spoke at JSConf India 2024 on TypeScript design patterns. Skills: React, TypeScript, Next.js, Tailwind CSS, GraphQL, Node.js.",
      linkedinUrl: "https://linkedin.com/in/vikramsingh-demo",
      githubUrl: "https://github.com/vikramsingh-demo",
      status: "scored" as const,
      score: 94,
      reasoning:
        "Excellent match. Exceeds experience requirement at 6 years with explicit team leadership. Strong open source profile and public speaking signal deep expertise and communication strength.",
      criteriaBreakdown: [
        { criterion: "React experience", score: 96, comment: "6 years, led frontend team of 8" },
        { criterion: "TypeScript", score: 95, comment: "Production use, conference speaker" },
        { criterion: "System design", score: 92, comment: "Architected micro-frontend migration" },
        { criterion: "Communication", score: 94, comment: "JSConf speaker, leadership track record" },
      ],
    },
    {
      name: "Arjun Verma",
      email: "arjun.demo@example.com",
      resume:
        "5 years of React experience. Led frontend team of 3 at early-stage fintech. Built design system from scratch adopted by 12 engineers. Strong TypeScript usage. Mentored 2 junior developers through promotion. Skills: React, TypeScript, Next.js, Tailwind.",
      linkedinUrl: "https://linkedin.com/in/arjunverma-demo",
      githubUrl: "https://github.com/arjunverma-demo",
      status: "scored" as const,
      score: 85,
      reasoning:
        "Strong match. 5 years React exceeds requirement. Design system work demonstrates architectural thinking. Team leadership at smaller scale than ideal but direction is right.",
      criteriaBreakdown: [
        { criterion: "React experience", score: 90, comment: "5 years with leadership" },
        { criterion: "TypeScript", score: 88, comment: "Strong production usage" },
        { criterion: "System design", score: 82, comment: "Built design system from scratch" },
        { criterion: "Communication", score: 80, comment: "Mentored juniors, no public profile" },
      ],
    },
    {
      name: "Neha Patel",
      email: "neha.demo@example.com",
      resume:
        "2 years React experience, mostly internal tools. Limited TypeScript exposure (started 6 months ago). Worked at small agency on client projects. Good at UI animations. Skills: React, JavaScript, CSS.",
      linkedinUrl: "https://linkedin.com/in/nehapatel-demo",
      githubUrl: "",
      status: "scored" as const,
      score: 52,
      reasoning:
        "Below threshold. Experience is 2 years versus 4+ required. TypeScript exposure is minimal. No evidence of system design or leadership experience at this stage.",
      criteriaBreakdown: [
        { criterion: "React experience", score: 50, comment: "2 years, below 4-year bar" },
        { criterion: "TypeScript", score: 45, comment: "6 months exposure, not primary language" },
        { criterion: "System design", score: 50, comment: "No architectural signals in resume" },
        { criterion: "Communication", score: 62, comment: "No leadership or public profile signals" },
      ],
    },
  ]

  for (const c of candidates) {
    const created = await prisma.candidate.create({
      data: {
        jobId: job.id,
        name: c.name,
        email: c.email,
        resume: c.resume,
        linkedinUrl: c.linkedinUrl,
        githubUrl: c.githubUrl,
        status: c.status,
        score: c.score,
        reasoning: c.reasoning,
        criteriaBreakdown: JSON.stringify(c.criteriaBreakdown),
      },
    })
    console.log(`  + ${c.name} (score: ${c.score})`)
  }

  // Pre-populate a sample trace so the trace panel has content
  await prisma.agentTrace.create({
    data: {
      jobId: job.id,
      nodes: JSON.stringify([
        {
          nodeName: "generate_jd",
          inputSummary: "Title: Senior Frontend Engineer | Requirements: React, TypeScript, 4+ years...",
          outputSummary: "Generated JD (687 chars)",
          durationMs: 1842,
        },
        {
          nodeName: "score_resume",
          inputSummary: "3 candidates scored against JD",
          outputSummary: "Scores: Vikram=94, Arjun=85, Neha=52 | Avg: 77",
          durationMs: 4721,
        },
        {
          nodeName: "rank_and_shortlist",
          inputSummary: "3 scored candidates | Threshold: 70",
          outputSummary: "Shortlisted 2 candidates: Vikram(94), Arjun(85)",
          durationMs: 2,
        },
      ]),
    },
  })

  console.log(`\n✓ Demo ready.`)
  console.log(`Open: http://localhost:3000/jobs/${job.id}/ranking`)
}

main()
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

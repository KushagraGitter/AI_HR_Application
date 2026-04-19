/**
 * ITERATION 0 TEST SCRIPT
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/test-scorer.ts
 *
 * This script tests the score_resume node directly with hardcoded data.
 * If this outputs a score + reasoning, the LLM connection is working.
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { ChatOpenAI } from "@langchain/openai"

const SAMPLE_JD = `
Senior Frontend Engineer

About the Role:
We are looking for a Senior Frontend Engineer to lead our web application development.

Responsibilities:
- Build and maintain React applications with TypeScript
- Lead frontend architecture decisions
- Collaborate with design and backend teams
- Mentor junior developers
- Conduct code reviews

Requirements:
- 4+ years of React experience
- Strong TypeScript skills
- Experience with system design
- Good communication skills
- Experience with modern CSS and Tailwind

Nice to Have:
- Open source contributions
- Experience with Next.js
- GraphQL knowledge
`

const SAMPLE_RESUME = `
Vikram Singh — Senior Frontend Developer

Experience:
- 6 years building React and TypeScript applications
- Led frontend team at a Series B SaaS startup (30-person engineering org)
- Migrated monolith to micro-frontends, improving load time by 40%
- Regular contributor to open source React libraries
- Spoke at JSConf India 2024 on TypeScript patterns

Skills: React, TypeScript, Next.js, Tailwind CSS, GraphQL, Node.js

Education: B.Tech Computer Science, IIT Delhi
`

async function main() {
  console.log("=== Siftly — Iteration 0 Test ===\n")
  console.log("Testing LLM connection via OpenRouter...")
  console.log(`Model: ${process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"}\n`)

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error("✗ OPENROUTER_API_KEY is empty in .env.local")
    process.exit(1)
  }
  console.log(`API key loaded: ${apiKey.slice(0, 10)}...${apiKey.slice(-4)}\n`)

  const llm = new ChatOpenAI({
    model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
    apiKey,
    temperature: 0.3,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Siftly",
      },
    },
  })

  const prompt = `You are an expert technical recruiter. Score this candidate's resume against the job description.

JOB DESCRIPTION:
${SAMPLE_JD}

CANDIDATE RESUME:
${SAMPLE_RESUME}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "score": <number 0-100>,
  "reasoning": "<2-3 sentence summary of fit>",
  "criteriaBreakdown": [
    { "criterion": "<criterion name>", "score": <0-100>, "comment": "<one sentence>" },
    { "criterion": "<criterion name>", "score": <0-100>, "comment": "<one sentence>" },
    { "criterion": "<criterion name>", "score": <0-100>, "comment": "<one sentence>" },
    { "criterion": "<criterion name>", "score": <0-100>, "comment": "<one sentence>" }
  ]
}`

  const start = Date.now()
  const response = await llm.invoke(prompt)
  const durationMs = Date.now() - start

  const raw = (response.content as string).trim()
  const cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim()

  console.log("--- RAW RESPONSE ---")
  console.log(raw)
  console.log("\n--- PARSED ---")

  const parsed = JSON.parse(cleaned)
  console.log(`Score: ${parsed.score}/100`)
  console.log(`Reasoning: ${parsed.reasoning}`)
  console.log("\nCriteria Breakdown:")
  for (const c of parsed.criteriaBreakdown) {
    console.log(`  [${c.score}] ${c.criterion}: ${c.comment}`)
  }
  console.log(`\nDuration: ${durationMs}ms`)
  console.log("\n✓ LLM connection working. You are clear to start Iteration 1.")
}

main().catch((err) => {
  console.error("\n✗ Test failed:", err.message)
  console.error("Check your OPENROUTER_API_KEY in .env.local")
  process.exit(1)
})

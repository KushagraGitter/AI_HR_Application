/**
 * Real-time agent logger.
 *
 * Writes each log entry immediately to the AgentTrace record for the job,
 * so a client polling GET /api/trace/[jobId] sees entries appear in real-time
 * as the autopilot progresses.
 */

import { prisma } from "@/lib/prisma"
import type { AgentTraceNode } from "@/types"

export type LogLevel = "info" | "action" | "success" | "warn" | "error"
export type Actor = "system" | "screener" | "outreacher" | "scheduler" | "candidate" | "hr"

interface LogArgs {
  jobId: string
  level?: LogLevel
  icon?: string
  actor?: Actor
  message: string
  nodeName?: string
  inputSummary?: string
  outputSummary?: string
  durationMs?: number
}

export async function log({
  jobId,
  level = "info",
  icon,
  actor = "system",
  message,
  nodeName,
  inputSummary,
  outputSummary,
  durationMs = 0,
}: LogArgs) {
  const entry: AgentTraceNode = {
    nodeName: nodeName ?? actor,
    inputSummary: inputSummary ?? "",
    outputSummary: outputSummary ?? message,
    durationMs,
    timestamp: new Date().toISOString(),
    level,
    icon,
    message,
    actor,
  }

  const existing = await prisma.agentTrace.findFirst({ where: { jobId } })
  if (existing) {
    const nodes = JSON.parse(existing.nodes || "[]") as AgentTraceNode[]
    nodes.push(entry)
    await prisma.agentTrace.update({
      where: { id: existing.id },
      data: { nodes: JSON.stringify(nodes) },
    })
  } else {
    await prisma.agentTrace.create({
      data: { jobId, nodes: JSON.stringify([entry]) },
    })
  }
}

export async function demoDelay() {
  const ms = Number(process.env.AGENT_DEMO_DELAY_MS ?? 0)
  if (ms > 0) await new Promise((r) => setTimeout(r, ms))
}

// Helper for appending a batch of existing trace nodes at once.
export async function appendTrace(jobId: string, newNodes: AgentTraceNode[]) {
  if (!newNodes?.length) return
  const existing = await prisma.agentTrace.findFirst({ where: { jobId } })
  if (existing) {
    const nodes = JSON.parse(existing.nodes || "[]") as AgentTraceNode[]
    await prisma.agentTrace.update({
      where: { id: existing.id },
      data: { nodes: JSON.stringify([...nodes, ...newNodes]) },
    })
  } else {
    await prisma.agentTrace.create({
      data: { jobId, nodes: JSON.stringify(newNodes) },
    })
  }
}

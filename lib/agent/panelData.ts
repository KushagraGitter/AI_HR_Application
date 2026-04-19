import type { PanelMember } from "@/types"

// Hardcoded panel availability — fake for demo
// Slots are ISO datetime strings
export const PANEL_MEMBERS: PanelMember[] = [
  {
    name: "Priya Sharma",
    slots: [
      "2026-04-22T10:00:00",
      "2026-04-22T14:00:00",
      "2026-04-23T11:00:00",
      "2026-04-24T10:00:00",
      "2026-04-24T15:00:00",
    ],
  },
  {
    name: "Rahul Mehta",
    slots: [
      "2026-04-22T10:00:00",
      "2026-04-22T15:00:00",
      "2026-04-23T14:00:00",
      "2026-04-24T11:00:00",
      "2026-04-25T10:00:00",
    ],
  },
  {
    name: "Ananya Rao",
    slots: [
      "2026-04-22T11:00:00",
      "2026-04-23T10:00:00",
      "2026-04-23T14:00:00",
      "2026-04-25T11:00:00",
      "2026-04-25T14:00:00",
    ],
  },
]

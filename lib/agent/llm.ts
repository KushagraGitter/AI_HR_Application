import { ChatOpenAI } from "@langchain/openai"

export function getLLM() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set in .env.local")
  }

  return new ChatOpenAI({
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
}

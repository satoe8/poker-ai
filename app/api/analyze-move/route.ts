import { generateText } from "ai"

export async function POST(req: Request) {
  const { playerCards, communityCards, stage, action, pot, position } = await req.json()

  const prompt = `You are an expert poker coach analyzing a player's move in real-time. Be encouraging and educational.

Game Context:
- Stage: ${stage}
- Player Cards: ${playerCards.join(", ")}
- Community Cards: ${communityCards.length > 0 ? communityCards.join(", ") : "None yet (pre-flop)"}
- Action Taken: ${action}
- Current Pot: $${pot}
- Position: ${position || "Unknown"}

Analyze this move and provide:
1. A brief assessment (2-3 sentences) - was this a good move or not?
2. Why it was good/bad based on hand strength, position, and pot odds
3. If it was suboptimal, what would have been better and why?
4. One key learning point to remember

Keep your response conversational, encouraging, and under 150 words. Avoid jargon - explain concepts simply.`

  const { text } = await generateText({
    model: "openai/gpt-5-mini",
    prompt,
    maxOutputTokens: 300,
    temperature: 0.7,
  })

  return Response.json({ analysis: text })
}

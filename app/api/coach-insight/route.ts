import { generateText } from "ai"

export async function POST(req: Request) {
  const { playerCards, communityCards, stage, pot } = await req.json()

  const prompt = `You are a friendly poker coach providing a strategic hint during a hand.

Current Situation:
- Stage: ${stage}
- Player Cards: ${playerCards.join(", ")}
- Community Cards: ${communityCards.length > 0 ? communityCards.join(", ") : "None yet (pre-flop)"}
- Current Pot: $${pot}

Provide a helpful hint about what to consider for the next action. Focus on:
- Hand strength at this stage
- What to watch for in the community cards
- General strategic advice for this situation

Keep it brief (2-3 sentences), encouraging, and avoid giving away the exact answer. Help them think strategically.`

  const { text } = await generateText({
    model: "openai/gpt-5-mini",
    prompt,
    maxOutputTokens: 200,
    temperature: 0.8,
  })

  return Response.json({ insight: text })
}

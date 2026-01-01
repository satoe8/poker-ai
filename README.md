# PokerMind - Learn Poker with AI

A Duolingo-style poker learning app with a specialized AI coach that teaches you poker fundamentals through interactive lessons and real-time game analysis.

## Features

- **Interactive Tutorials**: Learn hand rankings and table positions step-by-step
- **Practice Mode**: Test your pre-flop skills with instant feedback
- **Full Game Mode**: Play complete poker hands with AI coaching at every decision
- **Specialized AI Coach**: Get real-time recommendations and detailed analysis on every move
- **Progress Tracking**: Level up, earn XP, and build streaks
- **Gamification**: Hearts system, streaks, skill tree, and achievement tracking

## How to Run Locally

### Quick Start

1. **Download the code**: Click the three dots (•••) at the top right → Download ZIP

2. **Extract and open terminal** in the project folder

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the app**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and go to: `http://localhost:3000`

That's it! The AI coach runs completely locally with no external API needed.

## How the AI Coach Works

The PokerMind AI Coach is a **specialized poker strategy engine** built right into the app. No external API calls, no configuration needed.

### What It Does:

- **Real-time Recommendations**: Before you act, ask the AI what it recommends and why
- **Move Analysis**: After each decision, get detailed feedback on whether it was optimal
- **Strategic Insights**: Learn about hand strength, position value, and pot odds
- **Recovery Advice**: When you make suboptimal plays, the AI explains what would have been better

### How It Works:

The AI evaluates:
1. **Hand Strength** - Pocket pairs, high cards, suited connectors, board texture
2. **Position** - Button (best) to UTG (worst) and how it affects playability
3. **Game Stage** - Pre-flop vs post-flop strategy adjustments
4. **Pot Odds** - Whether the math supports your decision

All analysis happens **locally in your browser** - fast, private, and reliable.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Full type safety
- **Framer Motion** - Smooth animations
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS v4** - Modern styling
- **Local AI Engine** - Specialized poker strategy analyzer (no external dependencies)

## Game Modes

### 1. Tutorials
Learn the fundamentals:
- **Hand Rankings**: Royal Flush to High Card
- **Table Positions**: Button, Cut-off, Middle, UTG, Blinds

### 2. Quick Practice
Test your pre-flop decision-making with instant feedback on Fold/Call/Raise decisions.

### 3. Full Game Mode (AI-Powered)
Play through complete hands from pre-flop to showdown:
- **Ask AI Coach**: Get recommendations before you act ("I'd recommend you RAISE...")
- **Make Your Move**: Choose Fold, Call, Raise, or Check
- **Get Analysis**: Detailed feedback on whether your move was optimal
- **Learn & Improve**: Understand why certain plays are better than others

## Learning Philosophy

PokerMind teaches **tight-aggressive** (TAG) poker strategy:
- Play strong hands aggressively
- Fold weak hands without hesitation  
- Use position to your advantage
- Understand the "why" behind every decision

No jargon, no poker slang - just clear explanations that help you improve.

## Future Enhancements

Want to connect external AI models? You can modify `lib/poker-ai-coach.ts` to:
- Call external APIs like OpenAI or Claude
- Use local LLMs via Ollama
- Integrate with the Vercel AI SDK for streaming responses

The current specialized AI is highly effective for teaching fundamental poker strategy.

## License

MIT

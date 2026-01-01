"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Flame,
  Heart,
  Zap,
  ChevronLeft,
  User,
  Trophy,
  Target,
  CheckCircle2,
  Lightbulb,
  Brain,
  BookOpen,
  PlayCircle,
  Menu,
  Lock,
} from "lucide-react"
import { PokerAICoach } from "@/lib/poker-ai-coach"

// Poker hand evaluator
class PokerEvaluator {
  private handRankings = {
    AA: 10,
    KK: 10,
    QQ: 9,
    JJ: 9,
    TT: 8,
    AK: 9,
    AQ: 8,
    AJ: 7,
    AT: 7,
    KQ: 7,
    KJ: 6,
    KT: 6,
    QJ: 6,
    QT: 5,
    JT: 5,
    A9: 5,
    A8: 4,
    A7: 4,
    "99": 7,
    "88": 6,
    "77": 5,
    "66": 4,
    "55": 3,
  }

  evaluate(hand: string, position: string, action: string): { correct: boolean; explanation: string; xp: number } {
    const handStrength = this.handRankings[hand] || 2
    const isEarlyPosition = position === "UTG" || position === "MP"
    const isLatePosition = position === "Button" || position === "CO"

    let correct = false
    let explanation = ""
    let xp = 0

    // Basic strategy rules
    if (action === "Fold") {
      if (handStrength < 4) {
        correct = true
        explanation = `Perfect fold! ${hand} is weak and should be folded from ${position}. Save your chips for better spots! 💪`
        xp = 10
      } else {
        correct = false
        explanation = `Not quite! ${hand} is strong enough to play from ${position}. Missing opportunities costs you money long-term. 🤔`
        xp = 5
      }
    } else if (action === "Call") {
      if (handStrength >= 5 && handStrength < 8) {
        correct = true
        explanation = `Good call! ${hand} from ${position} is worth seeing a flop. You have decent equity and position helps! 🎯`
        xp = 15
      } else {
        correct = false
        explanation = `Think bigger! With ${hand}, you should either fold (if too weak) or raise (if strong). Calling is often the worst option. 📚`
        xp = 5
      }
    } else if (action === "Raise") {
      if (handStrength >= 8 || (handStrength >= 6 && isLatePosition)) {
        correct = true
        explanation = `Excellent raise! ${hand} from ${position} is premium. You're taking control and building the pot with a strong hand! 🔥`
        xp = 20
      } else {
        correct = false
        explanation = `Too aggressive! ${hand} from ${position} isn't strong enough to raise. Play tight and disciplined for long-term wins. 🎲`
        xp = 5
      }
    }

    return { correct, explanation, xp }
  }

  generateRandomHand(): { hand: string; position: string } {
    const hands = [
      "AA",
      "KK",
      "QQ",
      "JJ",
      "TT",
      "99",
      "88",
      "77",
      "66",
      "55",
      "AK",
      "AQ",
      "AJ",
      "AT",
      "A9",
      "A8",
      "KQ",
      "KJ",
      "KT",
      "QJ",
      "QT",
      "JT",
      "54",
      "72",
      "83",
      "95",
      "J3",
      "Q4",
    ]
    const positions = ["UTG", "MP", "CO", "Button"]

    return {
      hand: hands[Math.floor(Math.random() * hands.length)],
      position: positions[Math.floor(Math.random() * positions.length)],
    }
  }
}

class FullGameEngine {
  private deck: string[] = []

  generateDeck() {
    const suits = ["♠", "♥", "♦", "♣"]
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"]
    this.deck = []
    for (const suit of suits) {
      for (const rank of ranks) {
        this.deck.push(rank + suit)
      }
    }
    // Shuffle
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]]
    }
  }

  dealCards(count: number): string[] {
    return this.deck.splice(0, count)
  }

  dealCommunityCards(count: number): string[] {
    return this.deck.splice(0, count)
  }

  dealPlayerHand(): string[] {
    // Ensure enough cards are left in the deck for player and community cards
    if (this.deck.length < 2) {
      this.generateDeck() // Regenerate and shuffle if deck is too small
    }
    return this.dealCards(2)
  }

  getInsight(stage: string, playerHand: string[], communityCards: string[], pot: number): string {
    if (stage === "preflop") {
      const hand = playerHand.map((c) => c[0]).join("")
      if (hand.includes("A") && hand.includes("K")) {
        return "Strong starting hand! AK is worth playing aggressively. Consider raising."
      } else if (hand[0] === hand[1]) {
        return "Pocket pair! These are strong hands. Higher pairs should raise, lower pairs can call."
      } else {
        return "Think about your position. Can you afford to see a flop with this hand?"
      }
    } else if (stage === "flop") {
      return "Look at what the flop connects with your hand. Do you have a pair? A draw? Position matters more now."
    } else if (stage === "turn") {
      return "One more card to come. Think about pot odds if you're drawing. Consider your opponent's possible hands."
    } else {
      return "This is it! Make your final decision based on your hand strength and the betting action."
    }
  }

  evaluateHand(cards: string[]): string {
    // Simple evaluation for now
    const ranks = cards.map((c) => c[0])
    const suits = cards.map((c) => c.slice(1))

    // Check for flush
    const suitCounts: { [key: string]: number } = {}
    suits.forEach((s) => (suitCounts[s] = (suitCounts[s] || 0) + 1))
    const hasFlush = Object.values(suitCounts).some((count) => count >= 5)

    // Check for pairs
    const rankCounts: { [key: string]: number } = {}
    ranks.forEach((r) => (rankCounts[r] = (rankCounts[r] || 0) + 1))
    const pairs = Object.values(rankCounts).filter((count) => count >= 2).length
    const trips = Object.values(rankCounts).some((count) => count >= 3)
    const quads = Object.values(rankCounts).some((count) => count >= 4)

    if (quads) return "Four of a Kind"
    if (hasFlush) return "Flush"
    if (trips && pairs > 1) return "Full House"
    if (trips) return "Three of a Kind"
    if (pairs >= 2) return "Two Pair"
    if (pairs === 1) return "One Pair"

    return "High Card"
  }

  // Mock function for determining winner - replace with actual logic
  determineWinner(playerHand: string[], communityCards: string[]): string {
    const allPlayerCards = [...playerHand, ...communityCards]
    const playerHandStrength = this.evaluateHand(allPlayerCards)

    // Simulate AI hand and evaluation (replace with actual AI logic)
    const aiHand = this.dealCards(2)
    const allAICards = [...aiHand, ...communityCards]
    const aiHandStrength = this.evaluateHand(allAICards)

    // Simple win/loss simulation for now
    const won = Math.random() > 0.4 // 60% win rate for learning

    if (won) {
      return `You won with ${playerHandStrength}! The AI had ${aiHandStrength}.`
    } else {
      return `You lost this hand. The AI had ${aiHandStrength} and you had ${playerHandStrength}.`
    }
  }
}

const lessons = {
  hands: [
    {
      title: "Hand Rankings",
      description: "Learn what makes a poker hand strong",
      cards: [
        {
          name: "Royal Flush",
          rank: 1,
          example: "A♠ K♠ Q♠ J♠ 10♠",
          description: "The best hand! All cards in sequence, same suit, starting with Ace.",
        },
        {
          name: "Straight Flush",
          rank: 2,
          example: "9♥ 8♥ 7♥ 6♥ 5♥",
          description: "Five cards in sequence, all the same suit.",
        },
        {
          name: "Four of a Kind",
          rank: 3,
          example: "K♣ K♦ K♥ K♠ 3♣",
          description: "Four cards of the same rank. Very powerful!",
        },
        {
          name: "Full House",
          rank: 4,
          example: "Q♠ Q♥ Q♦ 7♣ 7♠",
          description: "Three of one rank, two of another. Strong hand!",
        },
        {
          name: "Flush",
          rank: 5,
          example: "A♦ J♦ 9♦ 5♦ 3♦",
          description: "Five cards of the same suit, not in sequence.",
        },
        {
          name: "Straight",
          rank: 6,
          example: "10♠ 9♣ 8♥ 7♦ 6♠",
          description: "Five cards in sequence, different suits.",
        },
        { name: "Three of a Kind", rank: 7, example: "8♣ 8♠ K♥ 4♣", description: "Three cards of the same rank." },
        { name: "Two Pair", rank: 8, example: "J♥ J♣ 6♠ A♣", description: "Two different pairs of cards." },
        { name: "One Pair", rank: 9, example: "10♠ 10♦ A♥ 7♣ 4♠", description: "Two cards of the same rank." },
        { name: "High Card", rank: 10, example: "A♠ K♦ 9♥ 7♣ 3♠", description: "Nothing special. Highest card wins." },
      ],
    },
  ],
  positions: [
    {
      title: "Table Positions",
      description: "Where you sit matters in poker",
      cards: [
        {
          name: "Button (BTN)",
          position: "best",
          description:
            "The best seat! You act last on every betting round after the flop. You see what everyone else does before deciding. Play more hands here.",
        },
        {
          name: "Cut-Off (CO)",
          position: "great",
          description:
            "Second best position, right before the Button. You act second-to-last post-flop. Great for stealing the blinds when the Button folds.",
        },
        {
          name: "Middle Position (MP)",
          position: "okay",
          description:
            "The middle seats at the table. You have some players behind you who act after. Play decent hands only.",
        },
        {
          name: "Under the Gun (UTG)",
          position: "worst",
          description:
            "First to act! Everyone gets to see what you do before deciding. This is tough. Only play your strongest hands from here.",
        },
        {
          name: "Small Blind (SB)",
          position: "tricky",
          description:
            "You post a forced half-bet before seeing cards. You act first after the flop. Difficult position - be careful!",
        },
        {
          name: "Big Blind (BB)",
          position: "tricky",
          description:
            "You post a forced full bet before seeing cards. You act last pre-flop but first post-flop. Defend with decent hands.",
        },
      ],
    },
  ],
}

type GameState =
  | "menu"
  | "tutorial"
  | "playing"
  | "feedback"
  | "progress"
  | "fullgame"
  | "fullgame-action"
  | "fullgame-result"
  | "fullgame-analysis" // Added new state for AI analysis
type TutorialMode = "hands" | "positions" | null
type FullGameStage = "preflop" | "flop" | "turn" | "river" | "showdown"

export default function PokerMind() {
  const [gameState, setGameState] = useState<GameState>("menu")
  const [tutorialMode, setTutorialMode] = useState<TutorialMode>(null)
  const [lessonIndex, setLessonIndex] = useState(0)

  const [streak, setStreak] = useState(3)
  const [hearts, setHearts] = useState(5)
  const [xp, setXp] = useState(340)
  const [level, setLevel] = useState(4)
  const [currentHand, setCurrentHand] = useState({ hand: "AK", position: "Button" })
  const [feedback, setFeedback] = useState({ correct: false, explanation: "", xp: 0 })
  const [handsPlayed, setHandsPlayed] = useState(12)

  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set())

  const [fullGameStage, setFullGameStage] = useState<FullGameStage>("preflop")
  const [playerCards, setPlayerCards] = useState<string[]>([])
  const [communityCards, setCommunityCards] = useState<string[]>([])
  const [pot, setPot] = useState(100)
  const [playerChips, setPlayerChips] = useState(1000)
  const [aiChips, setAiChips] = useState(1000)
  const [showInsight, setShowInsight] = useState(false)
  const [gameEngine] = useState(new FullGameEngine())
  const [fullGameResult, setFullGameResult] = useState("")
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [aiInsight, setAiInsight] = useState("")
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const [isLoadingInsight, setIsLoadingInsight] = useState(false)
  const [lastAction, setLastAction] = useState("")

  const [aiCoach] = useState(new PokerAICoach())
  const [showRecommendation, setShowRecommendation] = useState(false)
  const [currentRecommendation, setCurrentRecommendation] = useState("")

  const evaluator = new PokerEvaluator()

  const handleAction = (action: string) => {
    const result = evaluator.evaluate(currentHand.hand, currentHand.position, action)
    setFeedback(result)
    setGameState("feedback")

    if (!result.correct && hearts > 0) {
      setHearts(hearts - 1)
    }

    setXp(xp + result.xp)
    setHandsPlayed(handsPlayed + 1)

    // Level up logic
    if (xp + result.xp >= level * 100) {
      setLevel(level + 1)
    }
  }

  const handleNext = () => {
    setCurrentHand(evaluator.generateRandomHand())
    setGameState("playing")
  }

  const startTutorial = (mode: TutorialMode) => {
    setTutorialMode(mode)
    setLessonIndex(0)
    setGameState("tutorial")
  }

  const nextLesson = () => {
    const currentLesson = tutorialMode === "hands" ? lessons.hands[0] : lessons.positions[0]
    if (lessonIndex < currentLesson.cards.length - 1) {
      setLessonIndex(lessonIndex + 1)
    } else {
      if (tutorialMode) {
        const newCompleted = new Set(completedTutorials)
        newCompleted.add(tutorialMode)
        setCompletedTutorials(newCompleted)
      }
      setGameState("menu")
      setXp(xp + 50)
    }
  }

  const prevLesson = () => {
    if (lessonIndex > 0) {
      setLessonIndex(lessonIndex - 1)
    }
  }

  const getAIInsight = async () => {
    setIsLoadingInsight(true)
    try {
      const response = await fetch("/api/coach-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerCards,
          communityCards,
          stage: fullGameStage,
          pot,
        }),
      })
      const data = await response.json()
      setAiInsight(data.insight)
      setShowInsight(true)
    } catch (error) {
      console.error("Error getting AI insight:", error)
      setAiInsight("Think about your hand strength and the pot size. What would a tight-aggressive player do here?")
      setShowInsight(true)
    } finally {
      setIsLoadingInsight(false)
    }
  }

  const getAIAnalysis = (action: string) => {
    setIsLoadingAnalysis(true)
    try {
      const analysis = aiCoach.analyzeMoveAfterAction(
        {
          playerCards,
          communityCards,
          stage: fullGameStage,
          pot,
          position: "Button", // Assuming Button for now, would need to be dynamic
          playerChips,
          lastAction: action,
        },
        action,
      )

      const fullAnalysis = `${analysis.wasGoodMove ? "✅ Good move!" : "⚠️ Could be better"}\n\n${analysis.explanation}\n\n${analysis.betterMove ? `💡 Better play: ${analysis.betterMove.toUpperCase()}\n\n` : ""}🎯 Key Takeaway: ${analysis.learningPoint}`

      setAiAnalysis(fullAnalysis)
    } catch (error) {
      console.error("Error getting AI analysis:", error)
      setAiAnalysis(
        `You chose to ${action}. Consider the strength of your hand and the pot odds. Keep learning and you'll improve!`,
      )
    } finally {
      setIsLoadingAnalysis(false)
    }
  }

  const getRealtimeRecommendation = () => {
    const insight = aiCoach.getInsightBeforeAction({
      playerCards,
      communityCards,
      stage: fullGameStage,
      pot,
      position: "Button", // Assuming Button for now, would need to be dynamic
      playerChips,
    })
    setCurrentRecommendation(insight)
    setShowRecommendation(true)
  }

  const startFullGame = () => {
    gameEngine.generateDeck()
    const cards = gameEngine.dealPlayerHand()
    setPlayerCards(cards)
    setCommunityCards([])
    setFullGameStage("preflop")
    setPot(30) // Blinds
    setShowInsight(false)
    setAiInsight("")
    setAiAnalysis("")
    setGameState("fullgame")
  }

  const handleFullGameAction = (action: string) => {
    setLastAction(action)
    let nextStage = fullGameStage
    let nextPot = pot
    let nextPlayerChips = playerChips
    const nextAiChips = aiChips

    switch (action) {
      case "Fold":
        // Player folds, AI wins the pot - hand is over
        setFullGameResult(`You folded. The AI wins $${pot}.`)
        setPot(0) // Reset pot
        setAiChips(aiChips + pot) // AI gets the pot
        setFullGameStage("showdown") // Mark as completed
        setGameState("fullgame-analysis")
        getAIAnalysis(action)
        return
      case "Call":
        nextPot += 50 // Assuming a call amount
        nextPlayerChips -= 50
        break
      case "Raise":
        nextPot += 100 // Assuming a raise amount
        nextPlayerChips -= 100
        break
      case "Check":
        // No change in pot or chips, just moving to the next stage if possible
        break
      default:
        break
    }

    setPot(nextPot)
    setPlayerChips(nextPlayerChips)
    setAiChips(nextAiChips)

    // Determine next stage
    if (fullGameStage === "preflop") {
      nextStage = "flop"
    } else if (fullGameStage === "flop") {
      nextStage = "turn"
    } else if (fullGameStage === "turn") {
      nextStage = "river"
    } else if (fullGameStage === "river") {
      nextStage = "showdown"
      // Deal community cards if not already done for flop, turn, river
      if (communityCards.length === 0) {
        setCommunityCards(gameEngine.dealCommunityCards(3)) // Flop
      } else if (communityCards.length === 3) {
        setCommunityCards([...communityCards, ...gameEngine.dealCommunityCards(1)]) // Turn
      } else if (communityCards.length === 4) {
        setCommunityCards([...communityCards, ...gameEngine.dealCommunityCards(1)]) // River
      }
    } else if (fullGameStage === "showdown") {
      // This case should ideally be handled after determining winner, or before showing result
    }

    // Update state based on progression
    if (nextStage !== fullGameStage) {
      setFullGameStage(nextStage)
      if (nextStage === "flop" && communityCards.length === 0) {
        setCommunityCards(gameEngine.dealCommunityCards(3))
      } else if (nextStage === "turn" && communityCards.length === 3) {
        setCommunityCards([...communityCards, ...gameEngine.dealCommunityCards(1)])
      } else if (nextStage === "river" && communityCards.length === 4) {
        setCommunityCards([...communityCards, ...gameEngine.dealCommunityCards(1)])
      } else if (nextStage === "showdown") {
        // When we reach showdown, get the result
        const result = gameEngine.determineWinner(playerCards, communityCards)
        setFullGameResult(result)
        setGameState("fullgame-analysis") // Move to analysis after showdown
        getAIAnalysis(action) // Analyze the last action
        return // Stop further progression in this step
      }
    }

    // Get AI analysis for the action taken
    getAIAnalysis(action)
    setGameState("fullgame-analysis")
  }

  const startNewHand = () => {
    // Reset for new hand
    gameEngine.generateDeck() // Ensure deck is fresh for new hand
    setFullGameStage("preflop")
    setCommunityCards([])
    setPot(30) // Blinds
    setPlayerCards(gameEngine.dealPlayerHand())
    setFullGameResult("")
    setAiAnalysis("")
    setCurrentRecommendation("")
    setShowRecommendation(false)
    setLastAction("")
    setHandsPlayed(handsPlayed + 1) // Increment hand count
    setGameState("fullgame")
  }

  const skillTree = [
    { name: "Pre-flop Basics", unlocked: true, level: 1 },
    { name: "Position Play", unlocked: true, level: 2 },
    { name: "Hand Ranges", unlocked: true, level: 3 },
    { name: "Pot Odds", unlocked: true, level: 4 },
    { name: "Post-flop Play", unlocked: false, level: 5 },
    { name: "Bluffing", unlocked: false, level: 6 },
    { name: "Tournament Strategy", unlocked: false, level: 7 },
    { name: "GTO Fundamentals", unlocked: false, level: 8 },
  ]

  if (gameState === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-yellow-50 flex flex-col">
        <header className="bg-white border-b-4 border-emerald-400 shadow-md px-4 py-4">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-emerald-700 text-center">PokerMind</h1>
            <p className="text-center text-emerald-600 text-sm mt-1">Learn poker the fun way</p>
          </div>
        </header>

        <main className="flex-1 max-w-md mx-auto w-full px-4 py-6">
          <div className="space-y-4">
            {/* Profile Card */}
            <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 border-0 p-6 shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                  <User className="w-10 h-10 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">Level {level}</h2>
                  <p className="text-emerald-100">Poker Student</p>
                  <p className="text-emerald-200 text-sm mt-1">{completedTutorials.size}/2 Tutorials Completed</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <Flame className="w-6 h-6 text-orange-300 mx-auto mb-1" />
                  <p className="text-white font-bold text-xl">{streak}</p>
                  <p className="text-emerald-100 text-xs">Streak</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <Heart className="w-6 h-6 text-red-300 mx-auto mb-1" />
                  <p className="text-white font-bold text-xl">{hearts}</p>
                  <p className="text-emerald-100 text-xs">Hearts</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <Zap className="w-6 h-6 text-yellow-300 mx-auto mb-1" />
                  <p className="text-white font-bold text-xl">{xp}</p>
                  <p className="text-emerald-100 text-xs">Total XP</p>
                </div>
              </div>
            </Card>

            {/* Learn Section */}
            <div>
              <h3 className="text-lg font-bold text-emerald-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Learn the Basics
              </h3>
              <div className="space-y-3">
                <Card
                  className={`p-4 border-2 cursor-pointer hover:shadow-lg transition-shadow ${
                    completedTutorials.has("hands") ? "bg-emerald-50 border-emerald-400" : "border-emerald-300"
                  }`}
                  onClick={() => startTutorial("hands")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-emerald-800">Hand Rankings</h4>
                        {completedTutorials.has("hands") && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      </div>
                      <p className="text-sm text-gray-600">What beats what?</p>
                      {completedTutorials.has("hands") && (
                        <p className="text-xs text-emerald-600 mt-1">Completed - Review anytime</p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-yellow-400 flex items-center justify-center">
                      <span className="text-2xl">🃏</span>
                    </div>
                  </div>
                </Card>
                <Card
                  className={`p-4 border-2 cursor-pointer hover:shadow-lg transition-shadow ${
                    completedTutorials.has("positions") ? "bg-emerald-50 border-emerald-400" : "border-emerald-300"
                  }`}
                  onClick={() => startTutorial("positions")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-emerald-800">Table Positions</h4>
                        {completedTutorials.has("positions") && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      </div>
                      <p className="text-sm text-gray-600">Where you sit matters</p>
                      {completedTutorials.has("positions") && (
                        <p className="text-xs text-emerald-600 mt-1">Completed - Review anytime</p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-yellow-400 flex items-center justify-center">
                      <span className="text-2xl">📍</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Practice Section */}
            <div>
              <h3 className="text-lg font-bold text-emerald-800 mb-3 flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Practice & Play
              </h3>
              <div className="space-y-3">
                <Card
                  className="p-4 border-2 border-yellow-300 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setCurrentHand(evaluator.generateRandomHand())
                    setGameState("playing")
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-emerald-800">Quick Practice</h4>
                      <p className="text-sm text-gray-600">Test your pre-flop skills</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
                <Card
                  className="p-4 border-2 border-blue-300 cursor-pointer hover:shadow-lg transition-shadow bg-blue-50"
                  onClick={startFullGame}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-blue-800">Full Game Mode</h4>
                      <p className="text-sm text-gray-600">Play with AI insights</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-2xl">🎮</span>
                    </div>
                  </div>
                </Card>
                <Card
                  className="p-4 border-2 border-purple-300 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setGameState("progress")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-purple-800">Skill Tree</h4>
                      <p className="text-sm text-gray-600">Track your progress</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Full Game Mode View
  if (gameState === "fullgame" || gameState === "fullgame-analysis") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-yellow-50 p-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => setGameState("menu")}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Button>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="font-bold">{streak}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="font-bold">{hearts}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Table */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-to-br from-green-700 to-green-900 text-white">
            {/* Pot and Stage */}
            <div className="text-center mb-8">
              <div className="text-sm opacity-80 mb-1">
                {fullGameStage.charAt(0).toUpperCase() + fullGameStage.slice(1)}
              </div>
              <div className="text-3xl font-bold">Pot: ${pot}</div>
            </div>

            {/* Community Cards */}
            <div className="flex justify-center gap-3 mb-12">
              {communityCards.length > 0 ? (
                communityCards.map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ delay: i * 0.2 }}
                    className="w-20 h-28 bg-white rounded-lg shadow-xl flex items-center justify-center text-4xl font-bold text-gray-800"
                  >
                    {card}
                  </motion.div>
                ))
              ) : (
                <div className="text-center text-white/60 py-8">Community cards will appear here</div>
              )}
            </div>

            {/* Player Cards */}
            <div className="flex justify-center gap-4 mb-8">
              {playerCards.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-24 h-32 bg-white rounded-lg shadow-2xl flex items-center justify-center text-5xl font-bold text-gray-800 border-4 border-yellow-400"
                >
                  {card}
                </motion.div>
              ))}
            </div>

            {/* Chips */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-lg">
                <div className="text-white/80 text-sm">Your Chips</div>
                <div className="font-bold text-2xl">${playerChips}</div>
              </div>
              <div className="text-lg text-right">
                <div className="text-white/80 text-sm">AI Chips</div>
                <div className="font-bold text-2xl">${aiChips}</div>
              </div>
            </div>

            {/* AI Recommendation Section - Added recommendation display */}
            {showRecommendation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-600/90 rounded-lg p-4 mb-6 border-2 border-blue-400"
              >
                <div className="flex items-start gap-3">
                  <Brain className="h-6 w-6 flex-shrink-0 mt-1" />
                  <div className="text-sm leading-relaxed whitespace-pre-line">{currentRecommendation}</div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            {gameState === "fullgame" && (
              <div className="space-y-3">
                <Button
                  onClick={getRealtimeRecommendation}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6"
                >
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Ask AI Coach - What Should I Do?
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleFullGameAction("Fold")}
                    className="bg-red-600 hover:bg-red-700 text-white text-lg py-6"
                  >
                    Fold
                  </Button>
                  <Button
                    onClick={() => handleFullGameAction("Call")}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-lg py-6"
                  >
                    Call ($50)
                  </Button>
                  <Button
                    onClick={() => handleFullGameAction("Raise")}
                    className="bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                  >
                    Raise ($100)
                  </Button>
                  <Button
                    onClick={() => handleFullGameAction("Check")}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-lg py-6"
                  >
                    Check
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Analysis Bottom Sheet - Updated styling */}
        <AnimatePresence>
          {gameState === "fullgame-analysis" && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="max-w-2xl mx-auto">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

                <h3 className="text-2xl font-bold mb-4 text-gray-900">AI Analysis - {lastAction}</h3>

                {isLoadingAnalysis ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-600">Analyzing your move...</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-yellow-50 rounded-xl p-6 whitespace-pre-line leading-relaxed text-gray-800">
                      {aiAnalysis}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      if (fullGameStage === "showdown" || fullGameResult) {
                        // Check if hand is truly over
                        startNewHand()
                      } else {
                        setGameState("fullgame") // If not finished, continue playing the current hand
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg py-6"
                  >
                    {fullGameStage === "showdown" || fullGameResult ? "Play Next Hand" : "Continue Hand"}
                  </Button>
                  <Button
                    onClick={() => {
                      setGameState("menu")
                      setFullGameStage("preflop")
                      setCommunityCards([])
                      setPot(30)
                    }}
                    variant="outline"
                    className="px-6 py-6 border-2"
                  >
                    Exit
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Tutorial Mode View
  if (gameState === "tutorial" && tutorialMode) {
    const currentLesson = tutorialMode === "hands" ? lessons.hands[0] : lessons.positions[0]
    const currentCard = currentLesson.cards[lessonIndex]

    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-yellow-50 flex flex-col">
        <header className="bg-white border-b-4 border-emerald-400 shadow-md px-4 py-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <Button onClick={() => setGameState("menu")} variant="ghost" className="text-emerald-700">
              ← Menu
            </Button>
            <div>
              <h2 className="font-bold text-emerald-800">{currentLesson.title}</h2>
              <p className="text-xs text-gray-600 text-center">
                {lessonIndex + 1} / {currentLesson.cards.length}
              </p>
            </div>
            <div className="w-16"></div>
          </div>
        </header>

        <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              key={lessonIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 border-4 border-emerald-400 shadow-2xl bg-white">
                <div className="text-center mb-6">
                  <div className="inline-block bg-gradient-to-r from-emerald-500 to-yellow-500 text-white font-bold text-xl px-6 py-3 rounded-full mb-4">
                    {tutorialMode === "hands" ? currentCard.name : currentCard.name}
                  </div>
                  {tutorialMode === "hands" && (
                    <div className="text-3xl font-mono bg-gray-100 py-4 px-6 rounded-lg mb-4">
                      {currentCard.example}
                    </div>
                  )}
                  {tutorialMode === "positions" && (
                    <div
                      className={`text-4xl mb-4 ${
                        currentCard.position === "best"
                          ? "text-green-600"
                          : currentCard.position === "great"
                            ? "text-blue-600"
                            : currentCard.position === "okay"
                              ? "text-yellow-600"
                              : currentCard.position === "worst"
                                ? "text-red-600"
                                : "text-orange-600"
                      }`}
                    >
                      {currentCard.position === "best"
                        ? "⭐⭐⭐"
                        : currentCard.position === "great"
                          ? "⭐⭐"
                          : currentCard.position === "okay"
                            ? "⭐"
                            : currentCard.position === "worst"
                              ? "⚠️"
                              : "⚡"}
                    </div>
                  )}
                </div>
                <p className="text-gray-800 text-lg leading-relaxed text-center">{currentCard.description}</p>
              </Card>
            </motion.div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={prevLesson}
              disabled={lessonIndex === 0}
              className="flex-1 h-14 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 font-bold rounded-2xl"
            >
              Previous
            </Button>
            <Button
              onClick={nextLesson}
              className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl"
            >
              {lessonIndex === currentLesson.cards.length - 1 ? "Finish (+50 XP)" : "Next"}
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Practice/Progress View
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-yellow-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-4 border-emerald-400 shadow-md px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Button onClick={() => setGameState("menu")} variant="ghost" size="icon" className="text-emerald-700">
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-orange-100 px-3 py-1.5 rounded-full">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-orange-700">{streak}</span>
            </div>
            <div className="flex items-center gap-1 bg-red-100 px-3 py-1.5 rounded-full">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-bold text-red-700">{hearts}</span>
            </div>
          </div>
          <button
            onClick={() => setGameState(gameState === "progress" ? "playing" : "progress")}
            className="bg-emerald-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-emerald-600 transition-colors"
          >
            {gameState === "progress" ? "Play" : "Progress"}
          </button>
        </div>

        {/* XP Bar */}
        <div className="max-w-md mx-auto mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-emerald-700">Level {level}</span>
            <span className="text-sm font-semibold text-emerald-700">
              {xp % 100}/{level * 100} XP
            </span>
          </div>
          <div className="relative h-3 bg-emerald-200 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-yellow-400"
              initial={{ width: 0 }}
              animate={{ width: `${((xp % 100) / (level * 100)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6">
        {gameState === "progress" ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-emerald-800 mb-4">Your Skill Tree</h2>
            <div className="space-y-3">
              {skillTree.map((skill, idx) => (
                <Card
                  key={idx}
                  className={`p-4 ${skill.unlocked ? "bg-white border-emerald-300 border-2" : "bg-gray-100 border-gray-300"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {skill.unlocked ? (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-yellow-400 flex items-center justify-center">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                          <Lock className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className={`font-bold ${skill.unlocked ? "text-emerald-800" : "text-gray-500"}`}>
                          {skill.name}
                        </h3>
                        <p className="text-sm text-gray-600">Level {skill.level}</p>
                      </div>
                    </div>
                    {skill.unlocked && <Trophy className="w-6 h-6 text-yellow-500" />}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Poker Table */}
            <div className="bg-emerald-700 rounded-3xl p-6 mb-6 shadow-2xl border-4 border-emerald-800">
              <div className="text-center mb-6">
                <div className="inline-block bg-yellow-400 px-4 py-2 rounded-full mb-4 shadow-md">
                  <span className="font-bold text-emerald-900">{currentHand.position}</span>
                </div>
                <div className="flex justify-center gap-3">
                  {/* Poker Cards */}
                  <motion.div
                    initial={{ rotateY: 180, scale: 0.8 }}
                    animate={{ rotateY: 0, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-20 h-28 bg-white rounded-lg shadow-xl flex items-center justify-center border-2 border-gray-300"
                  >
                    <span className="text-4xl font-bold text-red-600">{currentHand.hand[0]}</span>
                  </motion.div>
                  <motion.div
                    initial={{ rotateY: 180, scale: 0.8 }}
                    animate={{ rotateY: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-20 h-28 bg-white rounded-lg shadow-xl flex items-center justify-center border-2 border-gray-300"
                  >
                    <span className="text-4xl font-bold text-gray-800">{currentHand.hand[1]}</span>
                  </motion.div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-white text-lg font-semibold mb-2">What should you do?</p>
                <p className="text-emerald-200 text-sm">Hand #{handsPlayed + 1}</p>
              </div>
            </div>

            {/* Action Buttons */}
            {gameState === "playing" && (
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => handleAction("Fold")}
                  className="h-16 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-2xl shadow-lg"
                >
                  Fold
                </Button>
                <Button
                  onClick={() => handleAction("Call")}
                  className="h-16 bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-lg rounded-2xl shadow-lg"
                >
                  Call
                </Button>
                <Button
                  onClick={() => handleAction("Raise")}
                  className="h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-2xl shadow-lg"
                >
                  Raise
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Feedback Bottom Sheet */}
      <AnimatePresence>
        {gameState === "feedback" && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={handleNext}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`fixed bottom-0 left-0 right-0 ${
                feedback.correct
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-500"
                  : "bg-gradient-to-br from-red-400 to-red-500"
              } rounded-t-3xl shadow-2xl z-50 p-6 max-w-md mx-auto`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-16 h-16 rounded-full ${
                    feedback.correct ? "bg-emerald-600" : "bg-red-600"
                  } flex items-center justify-center text-4xl flex-shrink-0`}
                >
                  {feedback.correct ? "🎉" : "🤔"}
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">{feedback.correct ? "Awesome!" : "Not Quite!"}</h3>
                  <p className="text-white text-base leading-relaxed">{feedback.explanation}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 bg-white/20 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-300" />
                  <span className="text-white font-bold text-lg">+{feedback.xp} XP</span>
                </div>
                {!feedback.correct && (
                  <div className="flex items-center gap-2">
                    <Heart className="w-6 h-6 text-red-200" />
                    <span className="text-white font-bold text-lg">-1 Heart</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleNext}
                className="w-full h-14 bg-white text-emerald-700 hover:bg-gray-100 font-bold text-lg rounded-2xl shadow-lg"
              >
                Next Hand
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

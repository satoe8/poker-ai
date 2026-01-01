// Specialized AI Poker Coach - Local, no external API needed
type Card = string
type Stage = "preflop" | "flop" | "turn" | "river" | "showdown"
type Action = "fold" | "call" | "raise" | "check" | "bet"
type Position = "Button" | "Cut-off" | "Middle" | "UTG" | "Small Blind" | "Big Blind"

interface GameContext {
  playerCards: Card[]
  communityCards: Card[]
  stage: Stage
  pot: number
  position: Position
  playerChips: number
  lastAction?: string
}

interface Analysis {
  recommendation: Action
  reasoning: string
  handStrength: "strong" | "medium" | "weak"
  shouldPlay: boolean
}

interface MoveAnalysis {
  wasGoodMove: boolean
  explanation: string
  betterMove?: string
  learningPoint: string
}

export class PokerAICoach {
  // Hand strength evaluation
  private evaluateHandStrength(cards: Card[], communityCards: Card[]): number {
    // Simplified hand strength (0-10 scale)
    if (cards.length < 2) return 0

    const [card1, card2] = cards
    const rank1 = this.getCardRank(card1)
    const rank2 = this.getCardRank(card2)
    const suit1 = card1.slice(-1)
    const suit2 = card2.slice(-1)

    let strength = 0

    // Pocket pairs
    if (rank1 === rank2) {
      if (rank1 >= 12)
        strength = 10 // AA, KK
      else if (rank1 >= 10)
        strength = 9 // QQ, JJ
      else if (rank1 >= 8)
        strength = 7 // TT, 99
      else strength = 5
    }
    // High cards
    else if (rank1 >= 12 || rank2 >= 12) {
      if (rank1 + rank2 >= 24)
        strength = 9 // AK
      else if (rank1 + rank2 >= 22)
        strength = 8 // AQ, AJ
      else strength = 6
    }
    // Suited connectors
    else if (suit1 === suit2) {
      strength = 5
      if (Math.abs(rank1 - rank2) === 1) strength = 6 // Suited connectors
    }
    // Connectors
    else if (Math.abs(rank1 - rank2) === 1 && rank1 + rank2 >= 18) {
      strength = 5
    }
    // Weak hands
    else {
      strength = 2
    }

    // Adjust for community cards
    if (communityCards.length > 0) {
      strength = this.evaluateWithCommunityCards(cards, communityCards, strength)
    }

    return strength
  }

  private getCardRank(card: string): number {
    const rankStr = card.slice(0, -1)
    const rankMap: Record<string, number> = {
      "2": 2,
      "3": 3,
      "4": 4,
      "5": 5,
      "6": 6,
      "7": 7,
      "8": 8,
      "9": 9,
      T: 10,
      J: 11,
      Q: 12,
      K: 13,
      A: 14,
    }
    return rankMap[rankStr] || 0
  }

  private evaluateWithCommunityCards(playerCards: Card[], communityCards: Card[], baseStrength: number): number {
    let strength = baseStrength
    const allCards = [...playerCards, ...communityCards]
    const ranks = allCards.map((c) => this.getCardRank(c))
    const suits = allCards.map((c) => c.slice(-1))

    // Check for pairs, trips, etc.
    const rankCounts = new Map<number, number>()
    ranks.forEach((r) => rankCounts.set(r, (rankCounts.get(r) || 0) + 1))

    const maxCount = Math.max(...rankCounts.values())
    if (maxCount === 4)
      strength = 10 // Four of a kind
    else if (maxCount === 3)
      strength = Math.max(strength, 8) // Three of a kind
    else if (maxCount === 2) {
      const pairs = Array.from(rankCounts.values()).filter((v) => v === 2).length
      if (pairs === 2)
        strength = Math.max(strength, 7) // Two pair
      else strength = Math.max(strength, 6) // One pair
    }

    // Check for flush potential
    const suitCounts = new Map<string, number>()
    suits.forEach((s) => suitCounts.set(s, (suitCounts.get(s) || 0) + 1))
    const maxSuitCount = Math.max(...suitCounts.values())
    if (maxSuitCount >= 5)
      strength = 10 // Flush
    else if (maxSuitCount === 4) strength = Math.max(strength, 7) // Flush draw

    return Math.min(strength, 10)
  }

  private getPositionValue(position: Position): number {
    const positionMap: Record<Position, number> = {
      Button: 5,
      "Cut-off": 4,
      Middle: 3,
      UTG: 2,
      "Small Blind": 1,
      "Big Blind": 1,
    }
    return positionMap[position] || 3
  }

  // Generate real-time recommendation
  public getRecommendation(context: GameContext): Analysis {
    const handStrength = this.evaluateHandStrength(context.playerCards, context.communityCards)
    const positionValue = this.getPositionValue(context.position)
    const potOdds = context.pot / (context.playerChips + context.pot)

    let recommendation: Action = "fold"
    let reasoning = ""
    let shouldPlay = false

    // Pre-flop strategy
    if (context.stage === "preflop") {
      if (handStrength >= 8) {
        recommendation = "raise"
        reasoning = `You have a strong hand! With ${context.playerCards.join("-")}, you should raise to build the pot and narrow the field. Position: ${context.position}.`
        shouldPlay = true
      } else if (handStrength >= 6) {
        if (positionValue >= 4) {
          recommendation = "call"
          reasoning = `Decent hand in good position. ${context.playerCards.join("-")} is playable from ${context.position}. Call to see the flop.`
          shouldPlay = true
        } else {
          recommendation = "fold"
          reasoning = `${context.playerCards.join("-")} is marginal in early position (${context.position}). Safer to fold and wait for a better spot.`
        }
      } else if (handStrength >= 4 && positionValue >= 4) {
        recommendation = "call"
        reasoning = `Speculative hand in late position. You can call and see if the flop improves your hand. Position: ${context.position}.`
        shouldPlay = true
      } else {
        recommendation = "fold"
        reasoning = `${context.playerCards.join("-")} is too weak to play. Folding saves your chips for better opportunities.`
      }
    }
    // Post-flop strategy
    else {
      if (handStrength >= 8) {
        recommendation = "bet"
        reasoning = `Strong hand! Bet to build the pot and protect your hand. The board shows ${context.communityCards.join(", ")}.`
        shouldPlay = true
      } else if (handStrength >= 6) {
        recommendation = potOdds < 0.3 ? "call" : "check"
        reasoning = `Medium strength. ${potOdds < 0.3 ? "Call to see the next card" : "Check to see a free card"}. Community: ${context.communityCards.join(", ")}.`
        shouldPlay = true
      } else {
        recommendation = "fold"
        reasoning = `Your hand didn't improve enough. With ${context.communityCards.join(", ")} on board, it's better to fold and preserve chips.`
      }
    }

    const handStrengthCategory = handStrength >= 7 ? "strong" : handStrength >= 5 ? "medium" : "weak"

    return {
      recommendation,
      reasoning,
      handStrength: handStrengthCategory,
      shouldPlay,
    }
  }

  // Analyze a move that was already made
  public analyzeMoveAfterAction(context: GameContext, actionTaken: string): MoveAnalysis {
    const recommendation = this.getRecommendation(context)
    const actionLower = actionTaken.toLowerCase()

    let wasGoodMove = false
    let explanation = ""
    let betterMove: string | undefined
    let learningPoint = ""

    // Compare action taken vs recommendation
    if (actionLower === recommendation.recommendation) {
      wasGoodMove = true
      explanation = `Great decision! ${recommendation.reasoning} You made the right play here.`
      learningPoint = `Remember: ${recommendation.handStrength} hands from ${context.position} position should be played ${actionLower === "fold" ? "cautiously" : "aggressively"}.`
    } else {
      wasGoodMove = false
      betterMove = recommendation.recommendation

      if (actionLower === "fold" && recommendation.shouldPlay) {
        explanation = `You folded, but this was actually a playable hand. ${recommendation.reasoning}`
        learningPoint = `Don't be too tight! ${context.playerCards.join("-")} from ${context.position} is worth playing.`
      } else if (actionLower !== "fold" && !recommendation.shouldPlay) {
        explanation = `You chose to ${actionTaken}, but with a ${recommendation.handStrength} hand, it might have been better to ${betterMove}. ${recommendation.reasoning}`
        learningPoint = `Playing too many weak hands costs chips. Focus on strong starting hands and good position.`
      } else if (actionLower === "call" && recommendation.recommendation === "raise") {
        explanation = `You called, which is okay, but raising would be stronger here. ${recommendation.reasoning}`
        learningPoint = `With strong hands, raise to build the pot and take control of the hand.`
        wasGoodMove = true // Not terrible, just not optimal
      } else if (actionLower === "raise" && recommendation.recommendation === "call") {
        explanation = `You raised, which is aggressive! ${recommendation.reasoning} A call might have been safer.`
        learningPoint = `Balance aggression with hand strength. Raising with medium hands can be risky.`
      } else {
        explanation = `You chose to ${actionTaken}. ${recommendation.reasoning}`
        learningPoint = `Think about hand strength, position, and pot size before each decision.`
      }
    }

    return {
      wasGoodMove,
      explanation,
      betterMove: wasGoodMove ? undefined : betterMove,
      learningPoint,
    }
  }

  // Get insight before action (what AI recommends you do)
  public getInsightBeforeAction(context: GameContext): string {
    const rec = this.getRecommendation(context)

    const stageMessages: Record<Stage, string> = {
      preflop: "before seeing the flop",
      flop: "with these community cards",
      turn: "on the turn",
      river: "on the river",
      showdown: "at showdown",
    }

    return `💡 AI Coach says: I'd recommend you **${rec.recommendation.toUpperCase()}** ${stageMessages[context.stage]}. ${rec.reasoning}`
  }
}

import { type Card } from '@pazaak-web/shared'
import { type MatchAction } from './actions'

const KOTOR_DROID_NAMES = ['HK-47', 'T3-M4', 'G0-T0', 'HK-50', 'T3-H8', 'HK-77']

function randomDroidName(): string {
  return KOTOR_DROID_NAMES[Math.floor(Math.random() * KOTOR_DROID_NAMES.length)]!
}

const AI_HAND_DECK: Omit<Card, 'id'>[] = [
  { type: 'add', value: 1 },
  { type: 'add', value: 2 },
  { type: 'add', value: 3 },
  { type: 'add', value: 4 },
  { type: 'add', value: 5 },
  { type: 'subtract', value: 1 },
  { type: 'subtract', value: 2 },
  { type: 'subtract', value: 3 },
  { type: 'subtract', value: 4 },
  { type: 'subtract', value: 5 },
]

function buildAiHandDeck(): Card[] {
  return AI_HAND_DECK.map((card) => ({ ...card, id: crypto.randomUUID() }) as Card)
}

type AiGameView = {
  myTotal: number
  opponentTotal: number
  hand: Card[]
}

/**
 * Decides the AI's next single action given the current game state.
 * Call repeatedly until the returned action is 'end' or 'stand'.
 */
function decideNextAction(view: AiGameView): MatchAction {
  const { myTotal, opponentTotal, hand } = view

  // If already busted, try to fix it with a subtract card
  if (myTotal > 20) {
    // Find the largest subtract card that gets us to <= 20
    const fixCard = hand
      .filter((c): c is Extract<Card, { type: 'subtract' }> => c.type === 'subtract')
      .sort((a, b) => b.value - a.value)
      .find((c) => myTotal - c.value <= 20)

    if (fixCard) {
      return { type: 'play', card: fixCard }
    }

    // Can't fix bust — end turn (we'll be marked busted)
    return { type: 'end' }
  }

  const distance = 20 - myTotal

  // Perfect score — stand immediately
  if (distance === 0) {
    return { type: 'stand' }
  }

  // Check if any hand card hits exactly 20
  const exactCard = hand.find((c) => {
    if (c.type === 'add') return myTotal + (c.value as number) === 20
    if (c.type === 'subtract') return myTotal - (c.value as number) === 20
    return false
  })
  if (exactCard) {
    return { type: 'play', card: exactCard }
  }

  // Check if any hand card brings us closer to 20 without busting
  const improvingCard = hand
    .filter((c): c is Extract<Card, { type: 'add' | 'subtract' }> => {
      if (c.type === 'add') return myTotal + (c.value as number) <= 20
      if (c.type === 'subtract') return myTotal - (c.value as number) > 0 && myTotal - (c.value as number) <= 20
      return false
    })
    .sort((a, b) => {
      const distA = a.type === 'add' ? distance - (a.value as number) : distance + (a.value as number)
      const distB = b.type === 'add' ? distance - (b.value as number) : distance + (b.value as number)
      return distA - distB // prefer card that gets us closest to 20
    })[0]

  // Play improving card only if it gets us to 17+ or we're clearly behind
  if (improvingCard) {
    const newTotal =
      improvingCard.type === 'add'
        ? myTotal + (improvingCard.value as number)
        : myTotal - (improvingCard.value as number)

    const newDistance = 20 - newTotal

    if (newDistance <= 3 || (opponentTotal >= myTotal && newTotal > myTotal)) {
      return { type: 'play', card: improvingCard }
    }
  }

  // Stand if we're close enough and not clearly behind the opponent
  if (distance <= 3 && myTotal >= opponentTotal) {
    return { type: 'stand' }
  }

  // Otherwise end the turn
  return { type: 'end' }
}

export { decideNextAction, buildAiHandDeck, randomDroidName, type AiGameView }

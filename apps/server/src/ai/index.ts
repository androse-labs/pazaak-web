import type { Card, PlayerView } from '@pazaak-web/shared'
import type { MatchAction } from '../models/actions'
import { processCardEffects } from '../models/card'
import { boardTotal } from '../models/game'

export function decideBotAction(gameState: PlayerView): MatchAction {
  const board = gameState.games.at(-1)?.boards.yourBoard.cards
  if (!board) {
    throw new Error('No game found in game state')
  }

  const hand = gameState.yourHand
  const total = boardTotal(board)
  const handCardsPlayed = board.filter((card) => card.type !== 'none').length

  // 1. Stand if you're at 20
  if (total === 20) {
    return { type: 'stand' }
  }

  // 3. Try to play a hand card that helps you get closer to 20, but never bust
  let bestCard: Card | undefined
  let bestScore = total

  for (const card of hand) {
    let candidateTotals: { total: number; card: Card }[] = []

    if (card.type === 'flip') {
      candidateTotals.push({
        total: total + card.value,
        card: { ...card, magnitude: 'add' },
      })

      candidateTotals.push({
        total: total - card.value,
        card: { ...card, magnitude: 'subtract' },
      })
    } else if (card.type === 'tiebreaker') {
      candidateTotals.push({
        total: total + card.value,
        card: { ...card, magnitude: 'add' },
      })

      candidateTotals.push({
        total: total - card.value,
        card: { ...card, magnitude: 'subtract' },
      })
    } else if (card.type === 'subtract') {
      candidateTotals.push({ total: total - card.value, card })
    } else if (card.type === 'invert') {
      candidateTotals.push({
        total: boardTotal(processCardEffects(card, board)),
        card,
      })
    } else if (card.type === 'double') {
      // Double cards require a valid previous card to copy
      candidateTotals.push({
        total: boardTotal(processCardEffects(card, board)),
        card,
      })
    } else {
      // none, add, special
      candidateTotals.push({ total: total + card.value, card })
    }

    for (const candidateEndState of candidateTotals) {
      if (
        candidateEndState.total <= 20 &&
        candidateEndState.total > bestScore
      ) {
        bestScore = candidateEndState.total
        bestCard = card
      }
    }
  }

  if (bestCard) {
    return { type: 'play', card: bestCard }
  }

  return { type: 'end' }
}

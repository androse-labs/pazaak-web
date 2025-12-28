import type { Card } from '@pazaak-web/shared'
import { collectionCards } from '@pazaak-web/shared'

const deckToCode = (deck: Card[]): string => {
  return deck.map(cardToCode).join('-')
}

const codeToDeck = (
  code: string,
): { success: true; result: Card[] } | { success: false; error: string } => {
  const cards: Card[] = []

  for (const cardCode of code.split('-')) {
    const type = codeToCardTypeMap[cardCode[0]]

    if (!type) {
      return {
        success: false,
        error: `Invalid card type code: ${cardCode[0]}`,
      }
    }

    const id = crypto.randomUUID()

    if (type === 'double') {
      cards.push({
        id,
        type,
        value: 'D',
      } as Extract<Card, { type: 'double' }>)
      continue
    }

    const value = cardCode.slice(1)

    if (type === 'invert') {
      cards.push({
        id,
        type,
        value,
      } as Extract<Card, { type: 'invert' }>)
      continue
    }

    const numericValue = parseInt(value, 10)
    if (isNaN(numericValue)) {
      return {
        success: false,
        error: `Invalid numeric value for card: ${cardCode}`,
      }
    }

    if (type === 'tiebreaker' || type === 'flip') {
      cards.push({
        id,
        type,
        value: numericValue,
        magnitude: 'add',
      } as Extract<Card, { type: 'tiebreaker' | 'flip' }>)
      continue
    }

    // add, subtract, none
    cards.push({
      id,
      type,
      value: numericValue,
    } as Extract<Card, { type: 'add' | 'subtract' | 'none' }>)
  }

  // Check each card for validity
  for (const card of cards) {
    if (
      !collectionCards.some(
        (c) => c.type === card.type && c.value === card.value,
      )
    ) {
      return {
        success: false,
        error: `Card not found in collection`,
      }
    }
  }

  return {
    success: true,
    result: cards,
  }
}

const cardTypeMap: Record<Exclude<Card['type'], 'special'>, string> = {
  add: 'A',
  subtract: 'S',
  double: 'D',
  none: 'N',
  flip: 'F',
  invert: 'I',
  tiebreaker: 'T',
}

const codeToCardTypeMap: Record<string, Card['type']> = Object.fromEntries(
  Object.entries(cardTypeMap).map(([type, code]) => [
    code,
    type as Card['type'],
  ]),
)

const cardToCode = (card: Card): string => {
  if (card.type === 'special') {
    throw new Error('Special cards cannot be serialized')
  }

  return `${cardTypeMap[card.type]}${card.value}`
}

export { deckToCode, codeToDeck }

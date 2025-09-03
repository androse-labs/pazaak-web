import type { Card } from '@pazaak-web/shared'

// Expect card to already be on the board
export function processCardEffects(cardToPlay: Card, board: Card[]) {
  if (cardToPlay.type === 'double') {
    // If the card is a double, copy it's value and set this card's
    // value to be the same as the last card on the board
    const lastCard = board.at(-2)

    if (lastCard && lastCard.type !== 'double' && lastCard.type !== 'invert') {
      let value

      switch (lastCard.type) {
        case 'flip':
        case 'tiebreaker':
          value =
            lastCard.magnitude === 'subtract'
              ? lastCard.value * -1
              : lastCard.value
          break
        case 'none':
        case 'special':
        case 'add':
          value = lastCard.value
          break
        case 'subtract':
          value = lastCard.value * -1
          break
      }

      const specialDouble: Card = {
        id: cardToPlay.id,
        type: 'special',
        value,
      }

      board.splice(-1, 1, specialDouble)

      return
    }

    throw new Error(
      'Cannot play double card after another double or invert card',
    )
  }

  if (cardToPlay.type === 'invert') {
    // If the card is an invert, replace all cards on the board
    // matching the 2 numbers with their inverted values
    const invertedValues = cardToPlay.value.split('&').map(Number)

    board.map((card) => {
      if (card.type === 'double' || card.type === 'invert') {
        return
      }
      if (
        (card.type === 'flip' || card.type === 'tiebreaker') &&
        invertedValues.includes(card.value)
      ) {
        card.magnitude = card.magnitude === 'subtract' ? 'add' : 'subtract'
        return
      }
      if (invertedValues.includes(Math.abs(card.value))) {
        card.value = card.value * -1
      }
    })
  }
}

import { expect, describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card as CardComponent } from './Card'
import type { Card as CardType } from '@pazaak-web/shared'

describe('Card', () => {
  it('shows value for add card', () => {
    const card: CardType = {
      id: crypto.randomUUID(),
      type: 'add',
      value: 5,
    }
    render(<CardComponent card={card} id={card.id} />)

    expect(screen.getByText('+5')).toBeInTheDocument()
  })

  it('shows inverted value of add card', () => {
    const card: CardType = {
      id: crypto.randomUUID(),
      type: 'add',
      value: -5,
    }
    render(<CardComponent card={card} id={card.id} />)

    expect(screen.getByText('-5')).toBeInTheDocument()
  })

  it('shows value for subtract card', () => {
    const card: CardType = {
      id: crypto.randomUUID(),
      type: 'subtract',
      value: 3,
    }
    render(<CardComponent card={card} id={card.id} />)

    expect(screen.getByText('-3')).toBeInTheDocument()
  })

  it('shows inverted value of subtract card', () => {
    const card: CardType = {
      id: crypto.randomUUID(),
      type: 'subtract',
      value: -3,
    }
    render(<CardComponent card={card} id={card.id} />)

    expect(screen.getByText('+3')).toBeInTheDocument()
  })

  it.each<{ magnitude: 'subtract' | 'add'; expectedText: string }>([
    { magnitude: 'subtract', expectedText: '-4' },
    { magnitude: 'add', expectedText: '+4' },
  ])('shows inverted value for flip card', ({ magnitude, expectedText }) => {
    const card: CardType = {
      id: crypto.randomUUID(),
      type: 'flip',
      value: 4,
      magnitude,
    }

    render(<CardComponent card={card} id={card.id} />)

    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it.each<{ magnitude: 'subtract' | 'add'; expectedText: string }>([
    { magnitude: 'subtract', expectedText: '-4T' },
    { magnitude: 'add', expectedText: '+4T' },
  ])(
    'shows inverted value for tiebreaker card',
    ({ magnitude, expectedText }) => {
      const card: CardType = {
        id: crypto.randomUUID(),
        type: 'tiebreaker',
        value: 4,
        magnitude,
      }

      render(<CardComponent card={card} id={card.id} />)

      expect(screen.getByText(expectedText)).toBeInTheDocument()
    },
  )

  it('shows value for double card', () => {
    const card: CardType = {
      id: crypto.randomUUID(),
      type: 'double',
      value: 'D',
    }
    render(<CardComponent card={card} id={card.id} />)

    expect(screen.getByText('D')).toBeInTheDocument()
  })
})

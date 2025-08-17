import { expect, describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CardPresentation } from './CardPresentation'
import type { Card as CardType } from '@pazaak-web/shared'

describe('CardPresentation', () => {
  it('shows value for add card', () => {
    const card: CardType = {
      id: crypto.randomUUID(),
      type: 'add',
      value: 5,
    }
    render(<CardPresentation card={card} />)

    expect(screen.getByText('+5')).toBeInTheDocument()
  })

  it('shows inverted value of add card', () => {
    const card: CardType = {
      id: crypto.randomUUID(),
      type: 'add',
      value: -5,
    }
    render(<CardPresentation card={card} />)

    expect(screen.getByText('-5')).toBeInTheDocument()
  })

  it('shows value for subtract card', () => {
    const card: CardType = {
      id: crypto.randomUUID(),
      type: 'subtract',
      value: 3,
    }
    render(<CardPresentation card={card} />)

    expect(screen.getByText('-3')).toBeInTheDocument()
  })

  it('shows inverted value of subtract card', () => {
    const card: CardType = {
      id: crypto.randomUUID(),
      type: 'subtract',
      value: -3,
    }
    render(<CardPresentation card={card} />)

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

    render(<CardPresentation card={card} />)

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

      render(<CardPresentation card={card} />)

      expect(screen.getByText(expectedText)).toBeInTheDocument()
    },
  )

  it('shows value for double card', () => {
    const card: CardType = {
      id: crypto.randomUUID(),
      type: 'double',
      value: 'D',
    }
    render(<CardPresentation card={card} />)

    expect(screen.getByText('D')).toBeInTheDocument()
  })
})

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { DeckBuilder } from './DeckBuilder'
import { useDeckStore } from '../../stores/deckStore'
import type { Card } from '@pazaak-web/shared'

const emptyDeck = { name: 'My Deck', cards: [] }

describe('DeckBuilder', () => {
  beforeEach(() => {
    useDeckStore.setState({ decks: [] })
  })

  it('renders the deck name input with the initial name', () => {
    render(<DeckBuilder initialDeck={emptyDeck} />)

    expect(screen.getByPlaceholderText('Deck Name')).toHaveValue('My Deck')
  })

  it('disables save when the deck has not changed', () => {
    render(<DeckBuilder initialDeck={emptyDeck} />)

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('shows "Deck must have exactly 10 cards" when saving with fewer than 10 cards', async () => {
    const partialDeck = {
      name: 'My Deck',
      cards: [{ id: crypto.randomUUID(), type: 'add' as const, value: 1 }],
    }
    const user = userEvent.setup()
    render(<DeckBuilder initialDeck={partialDeck} />)

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(
      screen.getByText('Deck must have exactly 10 cards'),
    ).toBeInTheDocument()
  })

  it('saves the deck when it has exactly 10 valid cards', async () => {
    const cards: Card[] = Array.from({ length: 10 }, (_, i) => ({
      id: crypto.randomUUID(),
      type: 'add',
      value: i + 1,
    }))

    const user = userEvent.setup()
    render(<DeckBuilder initialDeck={{ name: 'Full Deck', cards }} />)

    await user.click(screen.getByRole('button', { name: /save/i }))

    const savedDecks = useDeckStore.getState().decks

    expect(savedDecks).toHaveLength(1)
    expect(savedDecks[0]).toMatchObject({ name: 'Full Deck', cards })
  })

  it('rejects adding more than 2 copies of the same card', async () => {
    const duplicateCards: Card[] = Array.from({ length: 10 }, () => ({
      id: crypto.randomUUID(),
      type: 'add',
      value: 1,
    }))

    const user = userEvent.setup()
    render(
      <DeckBuilder
        initialDeck={{ name: 'Duplicate Card Deck', cards: duplicateCards }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(
      screen.getByText('Deck must have a maximum of 2 any card type'),
    ).toBeInTheDocument()
  })

  it('rejects adding more than 10 cards total', async () => {
    const tooManyCards: Card[] = Array.from({ length: 11 }, (_, i) => ({
      id: crypto.randomUUID(),
      type: 'add',
      value: i + 1,
    }))

    const user = userEvent.setup()
    render(
      <DeckBuilder
        initialDeck={{ name: 'Too Many Cards Deck', cards: tooManyCards }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(
      screen.getByText('Deck must have exactly 10 cards'),
    ).toBeInTheDocument()
  })
})

import { createFileRoute } from '@tanstack/react-router'
import { DeckBuilder } from '../../components/deck-builder/DeckBuilder'

export const Route = createFileRoute('/decks/new')({
  component: RouteComponent,
})

const initialDeck = { name: '', cards: [] }

function RouteComponent() {
  return <DeckBuilder initialDeck={initialDeck} />
}

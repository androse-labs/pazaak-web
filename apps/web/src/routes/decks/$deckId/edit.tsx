import { createFileRoute } from '@tanstack/react-router'
import { DeckBuilder } from '../../../components/deck-builder/DeckBuilder'
import { useDeckStore } from '../../../stores/deckStore'

export const Route = createFileRoute('/decks/$deckId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  const { deckId } = Route.useParams()

  const deck = useDeckStore((s) => s.getDeck(deckId))

  if (!deck) {
    return <div>Deck not found</div>
  }

  return <DeckBuilder initialDeck={deck} />
}

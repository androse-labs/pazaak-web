import { createFileRoute } from '@tanstack/react-router'
import { DeckBuilder } from '../../components/DeckBuilder/DeckBuilder'

export const Route = createFileRoute('/deck-builder/')({
  component: DeckBuilder,
})

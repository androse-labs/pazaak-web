import { createFileRoute } from '@tanstack/react-router'
import { DeckBuilder } from '../../components/deck-builder/DeckBuilder'

export const Route = createFileRoute('/deck-builder/')({
  component: DeckBuilder,
})

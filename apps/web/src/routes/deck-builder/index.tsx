import { createFileRoute } from '@tanstack/react-router'
import { useDeckStore } from '../../stores/deckStore'
import { Card as CardComponent } from '../../components/game-elements/Card'
import { collectionCards } from './-cardCollection'
import { DndContext, useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import type { Card } from '@pazaak-web/shared'
import clsx from 'clsx'

export const Route = createFileRoute('/deck-builder/')({
  component: RouteComponent,
})

const Collection = ({ cards }: { cards: Card[] }) => {
  return (
    <>
      <h1 className="text-2xl font-bold">Collection</h1>
      <div className="flex p-4">
        <div className="flex flex-wrap gap-4">
          {cards.map((card) => (
            <CardComponent key={card.id} card={card} id={card.id} draggable />
          ))}
        </div>
      </div>
    </>
  )
}

interface DeckPanelProps {
  draftDeck: Card[]
  onSave: () => void
}

export function DeckPanel({ draftDeck, onSave }: DeckPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'your-deck' })

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between p-4">
        <h1 className="text-2xl font-bold">Deck</h1>
      </div>
      <div className="flex w-full p-4">
        <div
          ref={setNodeRef}
          className={clsx(
            'border-3 w-full rounded-lg border-dashed border-gray-500 p-4',
            draftDeck.length === 0
              ? 'flex min-h-[120px] flex-col items-center justify-center'
              : 'flex flex-wrap gap-4',
          )}
        >
          {draftDeck.length === 0 ? (
            <h3 className="text-center text-lg">Drag cards to your deck</h3>
          ) : (
            draftDeck.map((card) => (
              <CardComponent key={card.id} card={card} id={card.id} draggable />
            ))
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between p-4">
        <h2 className="text-xl">{draftDeck.length}/10 cards</h2>
        <button className="btn btn-primary" onClick={onSave}>
          Save
        </button>
      </div>
    </div>
  )
}

function RouteComponent() {
  const userDeck = useDeckStore((s) => s.deck)
  const setUserDeck = useDeckStore((s) => s.setDeck)

  const [draftDeck, setDraftDeck] = useState<Card[]>(userDeck)

  return (
    <div className="flex flex-1">
      <DndContext
        onDragEnd={(event) => {
          const { active, over } = event
          if (active.data.current && over) {
            if (over.id === 'your-deck' && active.data.current.card) {
              const card = active.data.current.card as Card
              setDraftDeck((prevDeck) => {
                if (
                  prevDeck.length < 10 &&
                  !prevDeck.some((c) => c.id === card.id)
                ) {
                  return [
                    ...prevDeck,
                    {
                      ...card,
                      id: crypto.randomUUID(),
                    },
                  ]
                }
                return prevDeck
              })
            }
          }
        }}
      >
        <div className="bg-base-200 w-2/3 p-4">
          <Collection cards={collectionCards} />
        </div>
        <div className="bg-base-100 flex h-auto w-1/3 flex-col p-4">
          <DeckPanel
            draftDeck={draftDeck}
            onSave={() => {
              setUserDeck(draftDeck)
              console.log('Draft deck updated:', draftDeck)
            }}
          />
        </div>
      </DndContext>
    </div>
  )
}

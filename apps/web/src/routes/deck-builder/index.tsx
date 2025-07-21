import { createFileRoute } from '@tanstack/react-router'
import { deckSchema, useDeckStore } from '../../stores/deckStore'
import { Card as CardComponent } from '../../components/game-elements/Card'
import { collectionCards } from './-cardCollection'
import { DndContext, useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import type { Card } from '@pazaak-web/shared'
import clsx from 'clsx'
import { DropOverlay } from '../../components/game-elements/DropOverlay'

export const Route = createFileRoute('/deck-builder/')({
  component: RouteComponent,
})

const Collection = ({
  cards,
  showDropOverlay,
}: {
  cards: Card[]
  showDropOverlay: boolean
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'collection' })

  return (
    <>
      <h1 className="text-2xl font-bold">Collection</h1>
      <div
        ref={setNodeRef}
        className="border-3 border-neutral relative flex h-full flex-wrap content-start items-start gap-4 rounded-lg border-dashed p-4"
      >
        {cards.map((card) => (
          <CardComponent key={card.id} card={card} id={card.id} draggable />
        ))}
        {showDropOverlay && (
          <DropOverlay
            isOver={isOver}
            text="Drop cards here to remove them from your deck"
          />
        )}
      </div>
    </>
  )
}

interface DeckPanelProps {
  draftDeck: Card[]
  validationMessage: string | null
  showDropOverlay: boolean
  onSave: () => void
}

const decksAreEqual = (a: Card[], b: Card[]) =>
  a.length === b.length &&
  a.every(
    (card, idx) => card.type === b[idx].type && card.value === b[idx].value,
  )

export function DeckPanel({
  draftDeck,
  validationMessage,
  showDropOverlay,
  onSave,
}: DeckPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'your-deck' })
  const userDeck = useDeckStore((s) => s.deck)

  const deckUpToDate = decksAreEqual(userDeck, draftDeck)

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex shrink-0 items-center justify-between">
        <h1 className="text-2xl font-bold">Deck</h1>
        <h2 className="text-xl">{draftDeck.length}/10 cards</h2>
      </div>
      <div className="flex w-full grow">
        <div
          ref={setNodeRef}
          className={clsx(
            'border-3 border-neutral relative w-full rounded-lg border-dashed p-4',
            draftDeck.length === 0
              ? 'flex min-h-[120px] flex-col justify-center'
              : 'flex flex-wrap content-start items-start gap-4',
          )}
        >
          {draftDeck.length === 0 ? (
            <h3 className="text-center text-lg">Drag cards to your deck</h3>
          ) : (
            draftDeck.map((card) => (
              <CardComponent key={card.id} card={card} id={card.id} draggable />
            ))
          )}
          {showDropOverlay && (
            <DropOverlay
              isOver={isOver}
              text="Drop cards here to add them to your deck"
            />
          )}
        </div>
      </div>
      <p className="text-center text-red-500">{validationMessage || ' '}</p>
      <div className="flex shrink-0 items-center justify-between">
        <button
          className="btn btn-primary btn-block"
          onClick={onSave}
          disabled={deckUpToDate}
        >
          Save
        </button>
      </div>
    </div>
  )
}

function RouteComponent() {
  const userDeck = useDeckStore((s) => s.deck)
  const setUserDeck = useDeckStore((s) => s.setDeck)
  const [deckValidationMessage, setDeckValidationMessage] = useState<
    string | null
  >(null)

  const [dragSourceZone, setDragSourceZone] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [draftDeck, setDraftDeck] = useState<Card[]>(userDeck)

  return (
    <div className="flex flex-1">
      <DndContext
        onDragStart={(event) => {
          setIsDragging(true)
          const card = event.active.data.current?.card as Card | undefined
          // Determine where the drag started by card id
          if (card) {
            // If card is in draftDeck, zone is "your-deck"
            if (draftDeck.some((c) => c.id === card.id)) {
              setDragSourceZone('your-deck')
            } else {
              setDragSourceZone('collection')
            }
          }
        }}
        onDragEnd={(event) => {
          setIsDragging(false)
          setDragSourceZone(null)
          const { active, over } = event
          if (active.data.current && over) {
            if (over.id === 'your-deck' && active.data.current.card) {
              const card = active.data.current.card as Card
              setDeckValidationMessage(null)
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
            } else if (over.id === 'collection' && active.data.current.card) {
              const card = active.data.current.card as Card
              setDeckValidationMessage(null)
              setDraftDeck((prevDeck) =>
                prevDeck.filter((c) => c.id !== card.id),
              )
            }
          }
        }}
        onDragCancel={() => {
          setIsDragging(false)
          setDragSourceZone(null)
        }}
      >
        <div className="bg-base-200 flex w-2/3 flex-col gap-2 p-4">
          <Collection
            cards={collectionCards}
            showDropOverlay={isDragging && dragSourceZone !== 'collection'}
          />
        </div>
        <div className="bg-base-100 flex h-auto w-1/3 flex-col p-4">
          <DeckPanel
            draftDeck={draftDeck}
            validationMessage={deckValidationMessage}
            showDropOverlay={isDragging && dragSourceZone !== 'your-deck'}
            onSave={() => {
              const validDeck = deckSchema.safeParse(draftDeck)

              if (!validDeck.success) {
                setDeckValidationMessage(validDeck.error.issues[0].message)
                return
              }

              setUserDeck(validDeck.data)
            }}
          />
        </div>
      </DndContext>
    </div>
  )
}

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Trash2 } from 'lucide-react'
import { DropOverlay } from '../game-elements/DropOverlay'
import type { Card } from '@pazaak-web/shared'
import { useMemo, useState } from 'react'
import { collectionCards } from './card-collection'
import { deckSchema, type Deck } from '../../stores/deckStore'
import { useDeckStore } from '../../stores/deckStore'
import { Card as CardComponent } from '../game-elements/card/Card'
import { CardPresentation } from '../game-elements/card/CardPresentation'
import clsx from 'clsx'
import { useNavigate } from '@tanstack/react-router'

const DeckBuilder = ({
  initialDeck,
}: {
  initialDeck: { name: string; id?: string; cards: Card[] }
}) => {
  const navigate = useNavigate()
  const [draftDeck, setDraftDeck] = useState({
    name: initialDeck.name,
    id: initialDeck.id || crypto.randomUUID(),
    cards: initialDeck.cards,
  })
  const setUserDeck = useDeckStore((s) => s.setDeck)
  const [deckValidationMessage, setDeckValidationMessage] = useState<
    string | null
  >(null)

  const [dragSourceZone, setDragSourceZone] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedCard, setDraggedCard] = useState<Card | null>(null)

  const [isShaking, setIsShaking] = useState(false)

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(MouseSensor),
  )

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col md:flex-row lg:flex-1">
      <DndContext
        sensors={sensors}
        onDragStart={(event) => {
          setIsDragging(true)
          const card = event.active.data.current?.card as Card | undefined
          // Determine where the drag started by card id
          if (card) {
            // If card is in draftDeck, zone is "your-deck"
            if (draftDeck.cards.some((c) => c.id === card.id)) {
              setDragSourceZone('your-deck')
            } else {
              setDragSourceZone('collection')
            }
            setDraggedCard(card)
          }
        }}
        onDragOver={(event) => {
          const { active, over } = event
          if (active.data.current && over) {
            const card = active.data.current.card as Card | undefined
            if (card) {
              // If dragging over a zone that is not the source zone, shake the card
              if (
                (dragSourceZone === 'your-deck' && over.id !== 'your-deck') ||
                (dragSourceZone === 'collection' && over.id !== 'collection')
              ) {
                setIsShaking(true)
              } else {
                setIsShaking(false)
              }
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
                  prevDeck.cards.length < 10 &&
                  !prevDeck.cards.some((c) => c.id === card.id)
                ) {
                  return {
                    ...prevDeck,
                    cards: [
                      ...prevDeck.cards,
                      {
                        ...card,
                        id: crypto.randomUUID(),
                      },
                    ],
                  }
                }
                return prevDeck
              })
            } else if (over.id === 'collection' && active.data.current.card) {
              const card = active.data.current.card as Card
              setDeckValidationMessage(null)
              setDraftDeck((prevDeck) => ({
                ...prevDeck,
                cards: prevDeck.cards.filter((c) => c.id !== card.id),
              }))
            }
            // Reset dragged card
            setDraggedCard(null)
          }
        }}
        onDragCancel={() => {
          setIsDragging(false)
          setDragSourceZone(null)
        }}
      >
        <div className="bg-base-200 flex h-3/5 flex-col overflow-hidden md:h-auto md:w-2/3">
          <Collection
            cards={collectionCards}
            showDropOverlay={isDragging && dragSourceZone !== 'collection'}
          />
        </div>
        <div className="bg-base-100 flex h-2/5 flex-col overflow-hidden md:h-auto md:w-1/3">
          <DeckPanel
            draftDeck={draftDeck}
            validationMessage={deckValidationMessage}
            showDropOverlay={isDragging && dragSourceZone !== 'your-deck'}
            setDraftDeck={setDraftDeck}
            onSave={() => {
              const validDeck = deckSchema.safeParse(draftDeck.cards)

              if (!validDeck.success) {
                setDeckValidationMessage(validDeck.error.issues[0].message)
                return
              }

              if (draftDeck.name.trim() === '') {
                setDeckValidationMessage('Deck must have a name')
                return
              }

              // name must be unique
              const allDecks = useDeckStore.getState().decks
              const nameExists = allDecks.some(
                (d) =>
                  d.name === draftDeck.name.trim() &&
                  d.name !== initialDeck.name,
              )
              if (nameExists) {
                setDeckValidationMessage('Deck name must be unique')
                return
              }

              setUserDeck(validDeck.data, draftDeck.name.trim(), draftDeck.id)

              navigate({ to: '/decks' })
            }}
          />
        </div>
        <DragOverlay>
          {draggedCard && (
            <CardPresentation card={draggedCard} isShaking={isShaking} />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

const Collection = ({
  cards,
  showDropOverlay,
}: {
  cards: Card[]
  showDropOverlay: boolean
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'collection' })

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
      <h1 className="shrink-0 text-2xl font-bold">Collection</h1>
      <DropOverlay
        isOver={isOver}
        show={showDropOverlay}
        text="Drop cards here to remove them from your deck"
        className="flex-1 overflow-hidden"
      >
        <div
          ref={setNodeRef}
          className="flex h-full w-full flex-wrap content-start items-start gap-4 overflow-y-auto p-4"
        >
          {cards.map((card) => (
            <CardComponent key={card.id} card={card} draggable cloneable />
          ))}
        </div>
      </DropOverlay>
    </div>
  )
}

interface DeckPanelProps {
  draftDeck: Deck
  validationMessage: string | null
  showDropOverlay: boolean
  setDraftDeck: (deck: Deck) => void
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
  setDraftDeck,
  onSave,
}: DeckPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'your-deck' })
  const allDecks = useDeckStore((s) => s.decks)

  const savedVersion = useMemo(() => {
    return allDecks.find((d) => d.name === draftDeck.name)?.cards || []
  }, [allDecks, draftDeck.name])

  const deckIsChanged = decksAreEqual(savedVersion, draftDeck.cards)

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
      <div className="flex shrink-0 items-center justify-between">
        <input
          className="input input-ghost text-2xl font-bold"
          placeholder="Deck Name"
          value={draftDeck.name}
          onChange={(e) => {
            setDraftDeck({ ...draftDeck, name: e.target.value })
          }}
        />
        <div className="flex gap-2">
          <button
            className="btn btn-accent max-lg:btn-square btn-sm"
            onClick={() => {
              setDraftDeck({ ...draftDeck, cards: [] })
            }}
          >
            <Trash2 />
            <span className="hidden lg:inline">Clear Deck</span>
          </button>
        </div>
      </div>
      <DropOverlay
        isOver={isOver}
        show={showDropOverlay}
        text="Drop cards here to add them to your deck"
        className="flex-1 overflow-hidden"
      >
        <div
          ref={setNodeRef}
          className={clsx(
            'h-full w-full overflow-y-auto p-4',
            draftDeck.cards.length === 0
              ? 'flex min-h-[120px] flex-col justify-center'
              : 'flex flex-wrap content-start items-start gap-4',
          )}
        >
          {draftDeck.cards.length === 0 ? (
            <h3 className="text-center text-lg">Drag cards to your deck</h3>
          ) : (
            draftDeck.cards.map((card) => (
              <CardComponent key={card.id} card={card} draggable />
            ))
          )}
        </div>
      </DropOverlay>
      {validationMessage && (
        <div role="alert" className="alert alert-error alert-soft shrink-0">
          <span>{validationMessage}</span>
        </div>
      )}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="flex-1/6 text-center text-xl">
          {draftDeck.cards.length}/10
        </h2>
        <button
          className="btn btn-primary flex-2/3"
          onClick={onSave}
          disabled={deckIsChanged}
        >
          Save & Close
        </button>
      </div>
    </div>
  )
}

export { DeckBuilder }

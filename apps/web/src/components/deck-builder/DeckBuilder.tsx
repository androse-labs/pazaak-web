import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Trash2, ChevronLeft } from 'lucide-react'
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
    <div className="flex h-full flex-col sm:flex-row">
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
        <div className="bg-base-200 flex h-3/5 flex-col overflow-hidden sm:h-auto sm:w-2/3">
          <Collection
            cards={collectionCards}
            showDropOverlay={isDragging && dragSourceZone !== 'collection'}
          />
        </div>
        <div className="bg-base-100 flex h-2/5 flex-col overflow-hidden sm:h-auto sm:w-1/3">
          <DeckPanel
            draftDeck={draftDeck}
            validationMessage={deckValidationMessage}
            showDropOverlay={isDragging && dragSourceZone !== 'your-deck'}
            setDraftDeck={setDraftDeck}
            onBack={() => {
              const hasUnsavedChanges =
                draftDeck.name !== initialDeck.name ||
                !decksAreEqual(draftDeck.cards, initialDeck.cards)
              if (
                hasUnsavedChanges &&
                !confirm(
                  'You have unsaved changes. Are you sure you want to go back?',
                )
              ) {
                return
              }
              navigate({
                to: '/decks',
                search: { previewId: initialDeck.id ?? undefined },
              })
            }}
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
      <div className="flex shrink-0 items-center gap-2">
        <h1 className="text-2xl font-bold">Collection</h1>
      </div>
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
  onBack: () => void
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
  onBack,
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
          className="input input-ghost h-auto p-0 text-2xl font-bold"
          placeholder="Deck Name"
          value={draftDeck.name}
          onChange={(e) => {
            setDraftDeck({ ...draftDeck, name: e.target.value })
          }}
        />
        <div className="flex gap-2">
          <button
            className="btn btn-accent btn-sm max-lg:btn-square sm:btn-md landscape-short:btn-sm"
            onClick={() => {
              setDraftDeck({ ...draftDeck, cards: [] })
            }}
          >
            <Trash2 className="size-4 sm:size-5" />
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
              ? 'flex min-h-30 flex-col justify-center'
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
      <div className="flex shrink-0 items-center">
        <div className="flex flex-1 justify-start">
          <button
            className="btn btn-ghost btn-sm sm:btn-md landscape-short:btn-sm"
            onClick={onBack}
          >
            <ChevronLeft size={20} />
            Back
            <span className="landscape-short:hidden hidden sm:inline">
              {' '}
              to Decks
            </span>
          </button>
        </div>
        <h2 className="text-md text-center">{draftDeck.cards.length}/10</h2>
        <div className="flex flex-1 justify-end">
          <button
            className="btn btn-primary btn-sm sm:btn-md landscape-short:btn-sm"
            onClick={onSave}
            disabled={deckIsChanged}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export { DeckBuilder }

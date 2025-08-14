import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core'
import { Copy, Import, Trash2 } from 'lucide-react'
import { DropOverlay } from '../game-elements/DropOverlay'
import { Modal } from '../Modal'
import type { Card } from '@pazaak-web/shared'
import { useState } from 'react'
import { collectionCards } from './card-collection'
import { deckSchema } from '../../stores/deckStore'
import { useDeckStore } from '../../stores/deckStore'
import { Card as CardComponent, CardPresentation } from '../game-elements/Card'
import { codeToDeck, deckToCode } from './deck-serializer'
import clsx from 'clsx'

const DeckBuilder = () => {
  const userDeck = useDeckStore((s) => s.deck)
  const setUserDeck = useDeckStore((s) => s.setDeck)
  const [deckValidationMessage, setDeckValidationMessage] = useState<
    string | null
  >(null)

  const [dragSourceZone, setDragSourceZone] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedCard, setDraggedCard] = useState<Card | null>(null)

  const [draftDeck, setDraftDeck] = useState<Card[]>(userDeck)
  const [isShaking, setIsShaking] = useState(false)

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col lg:flex-1 lg:flex-row">
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
            // Reset dragged card
            setDraggedCard(null)
          }
        }}
        onDragCancel={() => {
          setIsDragging(false)
          setDragSourceZone(null)
        }}
      >
        <div className="bg-base-200 flex h-3/5 flex-col overflow-hidden lg:h-auto lg:w-2/3">
          <Collection
            cards={collectionCards}
            showDropOverlay={isDragging && dragSourceZone !== 'collection'}
          />
        </div>
        <div className="bg-base-100 flex h-2/5 flex-col overflow-hidden lg:h-auto lg:w-1/3">
          <DeckPanel
            draftDeck={draftDeck}
            validationMessage={deckValidationMessage}
            showDropOverlay={isDragging && dragSourceZone !== 'your-deck'}
            setDraftDeck={setDraftDeck}
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
        text="Drop cards here to add them to your deck"
        className="flex-1 overflow-hidden"
      >
        <div
          ref={setNodeRef}
          className="flex h-full w-full flex-wrap content-start items-start gap-4 overflow-y-auto p-4"
        >
          {cards.map((card) => (
            <CardComponent key={card.id} card={card} draggable />
          ))}
        </div>
      </DropOverlay>
    </div>
  )
}

interface DeckPanelProps {
  draftDeck: Card[]
  validationMessage: string | null
  showDropOverlay: boolean
  setDraftDeck: (deck: Card[]) => void
  onSave: () => void
}

const decksAreEqual = (a: Card[], b: Card[]) =>
  a.length === b.length &&
  a.every(
    (card, idx) => card.type === b[idx].type && card.value === b[idx].value,
  )

const ImportDeckCodeModal = ({
  setDraftDeck,
}: {
  setDraftDeck: (deck: Card[]) => void
}) => {
  const [deckCode, setDeckCode] = useState<string>('')
  const [deckValidationMessage, setDeckValidationMessage] = useState<
    string | null
  >(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const deckResult = codeToDeck(deckCode)
    if (!deckResult.success) {
      setDeckValidationMessage('Invalid deck code format')
      return
    }

    const validDeck = deckSchema.safeParse(deckResult.result)

    if (!validDeck.success) {
      setDeckValidationMessage('Invalid deck code format')
      return
    }

    setDraftDeck(validDeck.data)
    setDeckCode('')
    setDeckValidationMessage(null)

    const modal = document.getElementById('import-deck-code-modal')
    if (modal instanceof HTMLDialogElement) {
      modal.close()
    }
  }

  return (
    <Modal
      id="import-deck-code-modal"
      withExitButton
      onClose={() => {
        setDeckValidationMessage(null)
      }}
    >
      <h3 className="text-lg font-bold">Import Deck Code</h3>

      {deckValidationMessage && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{deckValidationMessage}</span>
        </div>
      )}
      <div className="flex w-full items-center justify-center gap-2">
        <form className="join w-full" onSubmit={handleSubmit}>
          <input
            id="deck-code-input"
            type="text"
            value={deckCode}
            onChange={(e) => setDeckCode(e.target.value)}
            placeholder="Enter Deck Code"
            className="input join-item input-bordered w-full"
          />
          <button className="btn btn-primary join-item" type="submit">
            Submit
          </button>
        </form>
      </div>
    </Modal>
  )
}

export function DeckPanel({
  draftDeck,
  validationMessage,
  showDropOverlay,
  setDraftDeck,
  onSave,
}: DeckPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'your-deck' })
  const userDeck = useDeckStore((s) => s.deck)

  const deckIsChanged = decksAreEqual(userDeck, draftDeck)

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
      <div className="flex shrink-0 items-center justify-between">
        <h1 className="text-2xl font-bold">Deck</h1>
        <div className="flex gap-2">
          <button
            className="btn btn-accent max-sm:btn-square btn-sm"
            onClick={() => {
              setDraftDeck([])
            }}
          >
            <Trash2 />
            <span className="hidden sm:inline">Clear Deck</span>
          </button>

          <button
            className="btn btn-secondary max-sm:btn-square btn-sm"
            onClick={async () => {
              const modal = document.getElementById('import-deck-code-modal')
              if (modal instanceof HTMLDialogElement) {
                modal.showModal()
              }
            }}
          >
            <Import />
            <span className="hidden sm:inline">Import</span>
          </button>
        </div>
        <ImportDeckCodeModal setDraftDeck={setDraftDeck} />
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
            draftDeck.length === 0
              ? 'flex min-h-[120px] flex-col justify-center'
              : 'flex flex-wrap content-start items-start gap-4',
          )}
        >
          {draftDeck.length === 0 ? (
            <h3 className="text-center text-lg">Drag cards to your deck</h3>
          ) : (
            draftDeck.map((card) => (
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
        <h2 className="flex-1/6 text-center text-xl">{draftDeck.length}/10</h2>
        <button
          className="btn btn-primary flex-2/3"
          onClick={onSave}
          disabled={deckIsChanged}
        >
          Save
        </button>
        <div className="tooltip tooltip-left" data-tip="Copy deck code">
          <button
            className="btn btn-secondary btn-square"
            disabled={!deckIsChanged}
            onClick={() => {
              navigator.clipboard.writeText(deckToCode(draftDeck))
            }}
          >
            <Copy />
          </button>
        </div>
      </div>
    </div>
  )
}

export { DeckBuilder }

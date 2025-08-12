import { createFileRoute } from '@tanstack/react-router'
import { deckSchema, useDeckStore } from '../../stores/deckStore'
import { Card as CardComponent } from '../../components/game-elements/Card'
import { collectionCards } from './-cardCollection'
import { DndContext, useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import type { Card } from '@pazaak-web/shared'
import clsx from 'clsx'
import { DropOverlay } from '../../components/game-elements/DropOverlay'
import { Copy, Import, Trash2 } from 'lucide-react'
import { codeToDeck, deckToCode } from './-deck-serializer'
import { Modal } from '../../components/Modal'

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
        className="border-3 border-neutral relative flex h-full max-h-full flex-wrap content-start items-start gap-4 overflow-y-scroll rounded-lg border-dashed p-4 lg:max-h-full"
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
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between">
        <h1 className="text-2xl font-bold">Deck</h1>
        <div className="flex gap-2">
          <button
            className="btn btn-accent max-sm:btn-square"
            onClick={() => {
              setDraftDeck([])
            }}
          >
            <Trash2 />
            <span className="hidden sm:inline">Clear Deck</span>
          </button>

          <button
            className="btn btn-secondary max-sm:btn-square"
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
      <div
        ref={setNodeRef}
        className={clsx(
          'border-3 border-neutral relative h-full w-full overflow-y-scroll rounded-lg border-dashed p-4',
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
      {validationMessage && (
        <div role="alert" className="alert alert-error alert-soft">
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
        <div className="bg-base-200 flex h-3/5 flex-col gap-2 p-4 lg:h-auto lg:w-2/3">
          <Collection
            cards={collectionCards}
            showDropOverlay={isDragging && dragSourceZone !== 'collection'}
          />
        </div>
        <div className="bg-base-100 flex h-2/5 flex-col gap-4 p-4 lg:h-auto lg:w-1/3">
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
      </DndContext>
    </div>
  )
}

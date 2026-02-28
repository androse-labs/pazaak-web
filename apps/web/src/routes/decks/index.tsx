import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { deckSchema, useDeckStore, type Deck } from '../../stores/deckStore'
import { DeckTile } from '../../components/DeckTile'
import { useState } from 'react'
import { CardPresentation } from '../../components/game-elements/card/CardPresentation'
import clsx from 'clsx'
import { Import, Pencil, Plus, Trash } from 'lucide-react'
import { CopyButton } from '../../components/CopyButton'
import {
  codeToDeck,
  deckToCode,
} from '../../components/deck-builder/deck-serializer'
import { Modal } from '../../components/Modal'

export const Route = createFileRoute('/decks/')({
  validateSearch: (search: Record<string, unknown>) => ({
    previewId:
      typeof search.previewId === 'string' ? search.previewId : undefined,
  }),
  component: RouteComponent,
})

function DeckList({
  decks,
  selectedDeckId,
  previewedDeckId,
  setPreviewId,
  setSelectedDeckId,
}: {
  decks: Deck[]
  selectedDeckId: string | null
  previewedDeckId: string | null
  setPreviewId: (id: string) => void
  setSelectedDeckId: (id: string) => void
}) {
  if (decks.length === 0)
    return <div className="m-4">You have no decks. Create one!</div>
  return (
    <div className="flex min-h-0 flex-wrap gap-8 overflow-auto rounded-lg border-3 border-dashed border-transparent p-4">
      {decks.map((deck) => (
        <div
          key={deck.id}
          className="cursor-pointer"
          onClick={() => setPreviewId(deck.id)}
        >
          <DeckTile
            deck={deck}
            selectedForPreview={deck.id === previewedDeckId}
            selectedForPlay={deck.id === selectedDeckId}
            setSelectedForPlay={setSelectedDeckId}
            setSelectedForPreview={setPreviewId}
          />
        </div>
      ))}
    </div>
  )
}

function DeckPreview({
  deck,
  onEdit,
  onDelete,
}: {
  deck: Deck | undefined
  onEdit: () => void
  onDelete: () => void
}) {
  if (!deck)
    return (
      <>
        <h2 className="text-2xl font-bold">Deck Preview</h2>
        <p>Select a deck to preview it here.</p>
      </>
    )

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate text-2xl font-bold">{deck.name}</h2>
        <div className="flex shrink-0 gap-1">
          <button
            className="btn btn-accent btn-square btn-sm sm:btn-md landscape-short:btn-sm"
            onClick={onEdit}
          >
            <Pencil className="size-4 sm:size-5" />
          </button>
          <button
            className="btn btn-error btn-square btn-sm sm:btn-md landscape-short:btn-sm"
            onClick={onDelete}
          >
            <Trash className="size-4 sm:size-5" />
          </button>
          <CopyButton
            value={deckToCode({ deck: deck.cards, name: deck.name })}
            tooltip="Copy deck code"
            copiedTooltip="Copied!"
            tooltipClassName="tooltip-left"
          />
        </div>
      </div>
      <div
        className={clsx(
          'relative h-full w-full overflow-y-auto rounded-lg border-3 border-dashed border-transparent p-4',
          deck.cards.length === 0
            ? 'flex min-h-30 flex-col justify-center'
            : 'flex flex-wrap content-start items-start gap-4',
        )}
      >
        {deck.cards.length === 0 ? (
          <h3 className="text-center text-lg">Drag cards to your deck</h3>
        ) : (
          deck.cards.map((card) => (
            <CardPresentation key={card.id} card={card} />
          ))
        )}
      </div>
    </>
  )
}

const ImportDeckCodeModal = () => {
  const setDeck = useDeckStore((s) => s.setDeck)
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

    const validDeck = deckSchema.safeParse(deckResult.result.cards)

    if (!validDeck.success) {
      setDeckValidationMessage('Invalid deck code format')
      return
    }

    // Add the deck to the store
    setDeck(validDeck.data, deckResult.result.name, deckResult.result.name)

    // Close the modal
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
          <button
            className="btn btn-primary btn-sm join-item sm:btn-md landscape-short:btn-sm"
            type="submit"
          >
            Submit
          </button>
        </form>
      </div>
    </Modal>
  )
}

export default function RouteComponent() {
  const navigate = useNavigate()
  const userDecks = useDeckStore((s) => s.decks)
  const deleteDeck = useDeckStore((s) => s.deleteDeck)
  const selectedDeckId = useDeckStore((s) => s.selectedDeckId)
  const setSelectedDeckId = useDeckStore((s) => s.setSelectedDeckId)
  const { previewId: previewDeckId } = useSearch({ from: '/decks/' })
  const setPreviewDeckId = (id: string | null) =>
    navigate({
      to: '/decks',
      search: { previewId: id ?? undefined },
      replace: true,
    })
  const previewDeck = previewDeckId
    ? userDecks.find((d) => d.id === previewDeckId)
    : undefined

  return (
    <>
      <ImportDeckCodeModal />
      <div className="flex h-full flex-col sm:flex-row lg:flex-1">
        <div className="bg-base-200 flex h-3/5 flex-col overflow-hidden p-4 sm:h-full sm:w-2/3">
          <div className="flex h-full min-h-0 flex-1 flex-col gap-2 sm:h-auto sm:w-full">
            <div className="flex justify-between">
              <h1 className="text-2xl font-bold">Decks</h1>
              <div className="dropdown dropdown-hover dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-primary btn-sm sm:btn-md landscape-short:btn-sm mb-2"
                >
                  <Plus /> New Deck
                </div>
                <ul
                  tabIndex={-1}
                  className="dropdown-content menu bg-base-100 rounded-box z-1 w-60 p-2 shadow-sm"
                >
                  <li>
                    <a onClick={() => navigate({ to: '/decks/new' })}>
                      <Plus />
                      New Blank Deck
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={async () => {
                        const modal = document.getElementById(
                          'import-deck-code-modal',
                        )
                        if (modal instanceof HTMLDialogElement) {
                          modal.showModal()
                        }
                      }}
                    >
                      <Import />
                      Import Deck from Code
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <DeckList
              decks={userDecks}
              previewedDeckId={previewDeckId ?? null}
              selectedDeckId={selectedDeckId}
              setPreviewId={setPreviewDeckId}
              setSelectedDeckId={setSelectedDeckId}
            />
          </div>
        </div>
        <div className="bg-base-100 flex h-2/5 flex-col overflow-hidden p-4 sm:h-full sm:w-1/3">
          <div className="flex h-full min-h-0 flex-1 flex-col justify-start sm:h-auto sm:w-full">
            <DeckPreview
              deck={previewDeck}
              onEdit={() =>
                previewDeck && navigate({ to: `/decks/${previewDeck.id}/edit` })
              }
              onDelete={() => {
                if (
                  previewDeck &&
                  confirm(
                    `Are you sure you want to delete the deck "${previewDeck.name}"? This action cannot be undone.`,
                  )
                ) {
                  deleteDeck(previewDeck.id)
                  setPreviewDeckId(null)
                  if (selectedDeckId === previewDeck.id) {
                    setSelectedDeckId('')
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}

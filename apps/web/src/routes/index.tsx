import { createFileRoute } from '@tanstack/react-router'
import { RefreshCcw } from 'lucide-react'
import { Modal } from '../components/Modal'

export const Route = createFileRoute('/')({
  component: Index,
})

const JoinMatchModal = () => {
  return (
    <Modal id="join-match-modal">
      <h3 className="text-lg font-bold">Join Match</h3>
      <div className="flex w-full items-center justify-center gap-2">
        <div className="join w-full">
          <input
            type="text"
            placeholder="Enter a Match ID"
            className="input join-item input-bordered form-control w-full"
          />
          <button className="btn btn-primary join-item">Join</button>
        </div>
      </div>
      <div className="divider">o</div>
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <h3 className="text-lg font-bold">Open Matches</h3>
          <button className="btn btn-square btn-sm">
            <RefreshCcw />
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Index() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-24">
      <h1 className="font-mono text-6xl font-semibold uppercase">Pazaak-Web</h1>
      <div className="flex flex-col gap-4">
        <button className="btn btn-primary">Create Match</button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            const modal = document.getElementById('join-match-modal')
            if (modal instanceof HTMLDialogElement) {
              modal.showModal()
            }
          }}
        >
          Join Match
        </button>
        <JoinMatchModal />
      </div>
    </div>
  )
}

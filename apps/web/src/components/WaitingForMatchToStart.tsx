import { Copy } from 'lucide-react'

type WaitingForMatchToStartProps = {
  matchId: string
}

const createMatchURL = (matchId: string) => {
  return `${window.location.origin}/match/${matchId}/join`
}

const WaitingForMatchToStart = ({ matchId }: WaitingForMatchToStartProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-16">
      <div className="text-center text-2xl font-bold">
        Waiting for the game to start...
      </div>
      <div className="flex flex-col gap-2 text-center text-lg">
        Share this match ID with your opponent:{' '}
        <div className="flex items-center justify-center gap-2">
          <strong>
            <a
              href={createMatchURL(matchId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {createMatchURL(matchId)}
            </a>
          </strong>
          <div className="tooltip tooltip-left" data-tip="Copy match url">
            <button
              className="btn btn-secondary btn-square"
              onClick={() => {
                navigator.clipboard.writeText(createMatchURL(matchId))
              }}
            >
              <Copy />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export { WaitingForMatchToStart }

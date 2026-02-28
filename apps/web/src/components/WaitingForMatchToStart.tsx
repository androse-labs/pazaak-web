import { CopyButton } from './CopyButton'

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
          <div className="join">
            <input
              type="text"
              className="input input-bordered join-item w-64"
              value={createMatchURL(matchId)}
              onFocus={(e) => e.target.select()}
              readOnly
            />
            <CopyButton
              value={createMatchURL(matchId)}
              tooltip="Copy match URL"
              copiedTooltip="Copied!"
              className="join-item"
              responsive={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
export { WaitingForMatchToStart }

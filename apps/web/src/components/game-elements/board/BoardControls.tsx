import clsx from 'clsx'
import { OctagonMinus, SkipForward } from 'lucide-react'

export const BoardControls = ({
  yourTurn,
  onEndTurn,
  onStand,
}: {
  yourTurn: boolean
  onEndTurn: () => void
  onStand: () => void
}) => (
  <div className={clsx('flex gap-2')}>
    <button
      className="btn btn-secondary flex w-32 items-center justify-center gap-1.5"
      onClick={onStand}
      disabled={!yourTurn}
    >
      <OctagonMinus size={20} />
      <span>Stand</span>
    </button>
    <button
      className="btn btn-primary flex w-32 items-center justify-center gap-1.5"
      onClick={onEndTurn}
      disabled={!yourTurn}
    >
      <SkipForward size={20} />
      <span>End Turn</span>
    </button>
  </div>
)

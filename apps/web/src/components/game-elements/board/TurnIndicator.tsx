import { MoveLeft, MoveRight, MoveDown, MoveUp } from 'lucide-react'

export const TurnIndicator = ({
  yourTurn,
  isDesktop,
}: {
  yourTurn: boolean
  isDesktop: boolean
}) => (
  <div className="text-center text-lg font-bold lg:text-2xl">
    {yourTurn ? (
      <span className="flex flex-row items-center justify-center gap-1 lg:flex-col">
        Your Turn
        {isDesktop ? <MoveLeft size={32} /> : <MoveDown size={20} />}
      </span>
    ) : (
      <span className="flex flex-row items-center justify-center gap-1 lg:flex-col">
        Opponent's Turn
        {isDesktop ? <MoveRight size={32} /> : <MoveUp size={20} />}
      </span>
    )}
  </div>
)

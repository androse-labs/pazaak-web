import { OpponentBoardGrid } from './OpponentBoardGrid'
import type { ReactNode } from 'react'
import { YourBoardGrid } from './YourBoardGrid'

export const BoardGrid = ({
  title,
  cards,
  isOpponent,
  state,
  score,
  total,
  yourTurn,
}: {
  title: string
  state: 'playing' | 'standing' | 'busted'
  cards: ReactNode[]
  total: number
  score: number
  yourTurn: boolean
  isOpponent?: boolean
}) => {
  if (isOpponent)
    return (
      <OpponentBoardGrid
        title={title}
        state={state}
        cards={cards}
        score={score}
        total={total}
        theirTurn={yourTurn}
      />
    )
  return (
    <YourBoardGrid
      title={title}
      state={state}
      score={score}
      cards={cards}
      total={total}
      yourTurn={yourTurn}
    />
  )
}

import { OpponentBoardGrid } from './OpponentBoardGrid'
import type { ReactNode } from 'react'
import { YourBoardGrid } from './YourBoardGrid'

type BoardGridBaseProps = {
  title: string
  state: 'playing' | 'standing' | 'busted'
  cards: ReactNode[]
  total: number
  score: number
}

type BoardGridProps =
  | (BoardGridBaseProps & { isOpponent?: false })
  | (BoardGridBaseProps & { isOpponent: true; connected: boolean })

export const BoardGrid = (props: BoardGridProps) => {
  const { title, state, cards, total, score, isOpponent } = props

  if (isOpponent)
    return (
      <OpponentBoardGrid
        title={title}
        connected={props.connected}
        state={state}
        cards={cards}
        score={score}
        total={total}
      />
    )
  return (
    <YourBoardGrid
      title={title}
      state={state}
      score={score}
      cards={cards}
      total={total}
    />
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { Board } from '../components/gameElements/Board'

export const Route = createFileRoute('/match')({
  component: About,
})

function About() {
  return (
    <div>
      <Board
        playerCards={[
          { type: 'double', value: 'D' },
          { type: 'flip', value: '2&4' },
          { type: 'invert', value: 2 },
          { type: 'subtract', value: 3 },
        ]}
        opponentCards={[
          { type: 'double', value: 'D' },
          { type: 'flip', value: '2&4' },
          { type: 'invert', value: 2 },
          { type: 'subtract', value: 3 },
        ]}
      />
    </div>
  )
}

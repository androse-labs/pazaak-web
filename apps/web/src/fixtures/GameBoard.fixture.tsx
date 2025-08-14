import { Board } from '../components/game-elements/Board'

export default {
  GameBoard: (
    <Board
      boards={{
        yourBoard: {
          total: 10,
          cards: [
            { id: 'card1', type: 'add', value: 5 },
            { id: 'card2', type: 'subtract', value: 6 },
            { id: 'card3', type: 'double', value: 'D' },
          ],
        },
        opponentBoard: {
          total: 8,
          cards: [
            { id: 'card3', type: 'add', value: 4 },
            { id: 'card4', type: 'subtract', value: 2 },
            { id: 'card5', type: 'tiebreaker', value: 2, magnitude: 'add' },
          ],
        },
      }}
      yourScore={1}
      opponentScore={2}
      yourTurn={true}
      yourState={'playing'}
      playerCards={[
        { id: 'card1', type: 'add', value: 5 },
        { id: 'card2', type: 'subtract', value: 3 },
        { id: 'card3', type: 'flip', value: 1, magnitude: 'subtract' },
        { id: 'card4', type: 'invert', value: '2&4' },
      ]}
      opponentState={'playing'}
      onStand={() => {}}
      onEndTurn={() => {}}
      onBoardDrop={() => {}}
      onMagnitudeFlip={() => {}}
      opponentCardCount={2}
    />
  ),
}

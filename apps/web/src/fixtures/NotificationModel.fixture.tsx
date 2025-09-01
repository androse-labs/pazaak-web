import { GameNotification } from '../components/GameNotification'

export default {
  YouWon: (
    <GameNotification id="game-notification" open={true}>
      <div className="flex flex-col items-center gap-4">
        The match is complete! You lost. Better luck next time!
        <button className="btn btn-accent">Rematch? (0/2)</button>
      </div>
    </GameNotification>
  ),
}

import { GameNotification } from '../components/GameNotification'

export default {
  YouWon: (
    <GameNotification id="game-notification" open={true}>
      <div className="flex flex-col items-center gap-4">
        The match is complete! You lost. Better luck next time!
        <button className="btn btn-accent">Request Rematch</button>
      </div>
    </GameNotification>
  ),
  YouWonRematchRequested: (
    <GameNotification id="game-notification" open={true}>
      <div className="flex flex-col items-center gap-4">
        The match is complete! You won!
        <span>Your opponent has requested a rematch.</span>
        <div className="flex gap-2">
          <button className="btn btn-primary">Accept</button>
          <button className="btn btn-ghost underline">Return to home</button>
        </div>
      </div>
    </GameNotification>
  ),
}

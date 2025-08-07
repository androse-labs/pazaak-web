type WaitingForMatchToStartProps = {
  matchId: string
}
const WaitingForMatchToStart = ({ matchId }: WaitingForMatchToStartProps) => {
  return (
    <>
      <div className="text-center text-lg">
        Waiting for the game to start...
      </div>
      <div>
        Share this match ID with your opponent: <strong>{matchId}</strong>
      </div>
    </>
  )
}
export { WaitingForMatchToStart }

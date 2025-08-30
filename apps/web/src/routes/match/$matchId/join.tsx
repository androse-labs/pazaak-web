import { useCallback, useEffect, useState } from 'react'
import {
  useParams,
  useNavigate,
  createFileRoute,
  Link,
} from '@tanstack/react-router'
import { usePlayerStore } from '../../../stores/playerStore'
import { useDeckStore } from '../../../stores/deckStore'
import { joinMatch } from '../../../api'

export const Route = createFileRoute('/match/$matchId/join')({
  component: MatchJoinPage,
})

export function MatchJoinPage() {
  const { matchId } = useParams({ from: '/match/$matchId/join' })
  const setMatchConnection = usePlayerStore((s) => s.setMatchConnection)
  const userDeck = useDeckStore((s) => s.deck)
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const doJoin = useCallback(async () => {
    setError(null)
    try {
      const response = await joinMatch(matchId, userDeck)
      if (response.status !== 200) {
        console.error('Failed to join match:', response.data)
        throw new Error('Failed to join match')
      }
      setMatchConnection({
        matchId,
        playerId: response.data.playerId,
        token: response.data.token,
      })
      navigate({ to: `/match/${matchId}` })
    } catch {
      console.error('Could not join match')
      setError('Could not join match. Please try again or go back to home.')
    }
  }, [matchId, userDeck, setMatchConnection, navigate])

  useEffect(() => {
    doJoin()
  }, [doJoin])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-5">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="text-center text-2xl font-bold">
            <p>{error}</p>
          </div>
          {error && (
            <Link to="/" className="btn btn-primary">
              Go Home
            </Link>
          )}
        </div>
      </div>
    )
  }

  return null
}

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RefreshCcw } from 'lucide-react'
import { Modal } from '../components/Modal'
import { api } from '../webClient'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Card } from '@pazaak-web/shared'
import { MatchList } from '../components/MatchList'
import { useState } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import { useDeckStore } from '../stores/deckStore'
import { joinMatch } from '../api'

export const Route = createFileRoute('/')({
  component: Index,
})

type JoinableMatchesResponse = {
  matchId: string
  matchName: string
}[]

function useGetJoinableMatches() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['joinableMatches'],
    queryFn: async () => {
      const response = await api.get<JoinableMatchesResponse>('/match/joinable')
      if (response.status !== 200 && response.status !== 204) {
        throw new Error('Failed to fetch open matches')
      }

      return response.data
    },
  })

  return { data, isPending, error, refetch }
}

const JoinMatchModal = () => {
  const { data: matches, isPending, error, refetch } = useGetJoinableMatches()
  const setMatchConnection = usePlayerStore((s) => s.setMatchConnection)
  const navigate = useNavigate()
  const [matchId, setMatchId] = useState<string>('')
  const userDeck = useDeckStore((s) => s.deck)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await joinMatch(matchId, userDeck)
    if (response.status !== 200) {
      throw new Error('Failed to join match')
    }

    setMatchConnection({
      matchId: matchId,
      playerId: response.data.playerId,
      token: response.data.token,
    })

    navigate({ to: `/match/${matchId}` })
  }

  return (
    <Modal id="join-match-modal">
      <h3 className="text-lg font-bold">Join Match</h3>

      <div className="flex w-full items-center justify-center gap-2">
        <form className="join w-full" onSubmit={handleSubmit}>
          <input
            type="text"
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            placeholder="Enter a Match ID"
            className="input join-item input-bordered w-full"
          />
          <button className="btn btn-primary join-item" type="submit">
            Join
          </button>
        </form>
      </div>

      <div className="divider">or</div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Open Matches</h3>
          <button className="btn btn-square btn-sm" onClick={() => refetch()}>
            <RefreshCcw />
          </button>
        </div>

        <MatchList
          matches={matches ?? []}
          isLoading={isPending}
          error={error}
          onJoin={async () => {
            if (!matches || matches.length === 0) {
              return
            }
            const matchId = matches[0].matchId
            const response = await joinMatch(matchId, userDeck)

            if (response.status !== 200) {
              throw new Error('Failed to join match')
            }

            setMatchConnection({
              matchId,
              playerId: response.data.playerId,
              token: response.data.token,
            })

            navigate({ to: `/match/${matches?.[0]?.matchId}` })
          }}
        />
      </div>
    </Modal>
  )
}

type CreateMatchResponse = {
  matchId: string
  token: string
}

function useCreateMatchMutation() {
  const queryClient = useQueryClient()
  const { mutate, isPending, error } = useMutation({
    // deck does not need card id. exclude it from the type
    mutationFn: async (data: {
      deck: Card[]
      matchName: string
      unlisted: boolean
    }) => {
      // drop the id from each card in the deck
      const response = await api.post<CreateMatchResponse>('/match/create', {
        deck: data.deck,
        matchName: data.matchName,
        unlisted: data.unlisted,
      })
      if (response.status !== 200) {
        throw new Error('Failed to create match')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joinableMatches'] })
    },
  })

  return { mutate, isPending, error }
}

function Index() {
  const { refetch } = useGetJoinableMatches()
  const { mutate } = useCreateMatchMutation()
  const userDeck = useDeckStore((s) => s.deck)
  const [unlisted, setUnlisted] = useState<boolean>(true)
  const [matchName, setMatchName] = useState<string>('')
  const navigate = useNavigate()
  const setMatchConnection = usePlayerStore((s) => s.setMatchConnection)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-24">
      <h1 className="font-mono text-6xl font-semibold uppercase">Pazaak-Web</h1>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Match Name"
              className="input input-bordered w-full max-w-xs"
              value={matchName}
              onChange={(e) => {
                setMatchName(e.target.value)
              }}
            />
            <label className="label">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={unlisted}
                onChange={(e) => setUnlisted(e.target.checked)}
              />
              Unlisted
            </label>
          </div>
          <button
            onClick={() => {
              mutate(
                {
                  deck: userDeck,
                  matchName: matchName,
                  unlisted: unlisted,
                },
                {
                  onSuccess: (data) => {
                    setMatchConnection({
                      matchId: data.matchId,
                      playerId: crypto.randomUUID(),
                      token: data.token,
                    })
                    navigate({ to: `/match/${data.matchId}` })
                  },
                },
              )
            }}
            className="btn btn-primary"
          >
            Create Match
          </button>
        </div>
        <div className="divider">or</div>
        <button
          className="btn btn-secondary"
          onClick={() => {
            const modal = document.getElementById('join-match-modal')
            if (modal instanceof HTMLDialogElement) {
              modal.showModal()
            }
            refetch()
          }}
        >
          Join Match
        </button>
        <JoinMatchModal />
      </div>
    </div>
  )
}

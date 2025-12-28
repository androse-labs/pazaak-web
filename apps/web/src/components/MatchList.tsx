import type { MatchType } from '@pazaak-web/shared'

type Match = {
  matchId: string
  matchName: string
  matchType: MatchType
}

type MatchListProps = {
  matches: Match[]
  isLoading?: boolean
  error: Error | null
  onJoin?: (matchId: string) => void
}

export function MatchList({
  matches,
  isLoading,
  error,
  onJoin,
}: MatchListProps) {
  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading matches...</p>
  }

  if (error) {
    return (
      <p className="text-sm text-red-500">
        Failed to load matches: {error.message}
      </p>
    )
  }

  if (!matches || matches.length === 0) {
    return (
      <p className="text-base-content text-sm italic text-opacity-50">
        No matches available
      </p>
    )
  }

  return (
    <div className="flex max-h-60 flex-col gap-2 overflow-y-auto">
      {matches.map(({ matchId, matchName, matchType }) => (
        <div key={matchId} className="flex justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-md">{matchName}</p>
              <span className="badge badge-primary badge-sm capitalize">
                {matchType}
              </span>
            </div>
            <p className="text-base-content text-sm italic text-opacity-50">
              {matchId}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => onJoin?.(matchId)}>
            Join
          </button>
        </div>
      ))}
    </div>
  )
}

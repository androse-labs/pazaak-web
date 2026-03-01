import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MatchList } from '../components/MatchList'

// Matches the local Match type defined in MatchList
const mockMatches = [
  { matchId: 'match-1', matchName: 'Test Match' },
  { matchId: 'match-2', matchName: 'Another Match' },
]

describe('MatchList', () => {
  it('shows loading state', () => {
    render(<MatchList matches={[]} isLoading error={null} />)

    expect(screen.getByText(/loading matches/i)).toBeInTheDocument()
  })

  it('shows error message when an error is provided', () => {
    render(<MatchList matches={[]} error={new Error('Network failure')} />)

    expect(screen.getByText(/network failure/i)).toBeInTheDocument()
  })

  it('shows empty state when there are no matches', () => {
    render(<MatchList matches={[]} error={null} />)

    expect(screen.getByText(/no matches available/i)).toBeInTheDocument()
  })

  it('renders a list of matches', () => {
    render(<MatchList matches={mockMatches} error={null} />)

    expect(screen.getByText('Test Match')).toBeInTheDocument()
    expect(screen.getByText('Another Match')).toBeInTheDocument()
  })

  it('calls onJoin with the match id when Join is clicked', async () => {
    const onJoin = vi.fn()
    const user = userEvent.setup()
    render(<MatchList matches={mockMatches} error={null} onJoin={onJoin} />)

    await user.click(screen.getAllByRole('button', { name: /join/i })[0])

    expect(onJoin).toHaveBeenCalledWith('match-1')
  })
})

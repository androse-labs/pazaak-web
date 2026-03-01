import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WaitingForMatchToStart } from '../components/WaitingForMatchToStart'

describe('WaitingForMatchToStart', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('displays the shareable match URL', () => {
    render(<WaitingForMatchToStart matchId="match-abc" />)

    expect(screen.getByDisplayValue(/match-abc/)).toBeInTheDocument()
  })
})

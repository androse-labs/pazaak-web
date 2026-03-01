import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GameNotification } from '../components/GameNotification'
import userEvent from '@testing-library/user-event'

describe('GameNotification', () => {
  it('renders children when open', () => {
    render(
      <GameNotification id="notif-1" open>
        You win!
      </GameNotification>,
    )

    expect(screen.getByText('You win!')).toBeInTheDocument()
  })

  it('does not show content when closed', () => {
    render(
      <GameNotification id="notif-1" open={false}>
        You win!
      </GameNotification>,
    )

    expect(screen.queryByText('You win!')).not.toBeVisible()
  })

  it('calls onClose when the dialog close event fires', () => {
    const onClose = vi.fn()

    const { container } = render(
      <GameNotification id="notif-1" open onClose={onClose}>
        Match over
      </GameNotification>,
    )

    // Trigger the native dialog close event (the ✕ button submits a form that
    // closes the dialog via native HTML dialog behavior, which jsdom does not
    // fully support — dispatching the event directly exercises the handler).
    const dialog = container.querySelector('dialog')!
    dialog.dispatchEvent(new Event('close'))

    expect(onClose).toHaveBeenCalled()
  })

  it('auto-closes non-persistent notifications after a delay', async () => {
    // TODO: use vi.useFakeTimers() to advance the auto-close timer
    // and assert that onClose is called
  })
})

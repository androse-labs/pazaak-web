import React, { useEffect, useRef } from 'react'

export const GameNotification = ({
  children,
  id,
  open,
  onClose,
}: {
  children: React.ReactNode
  id: string
  open?: boolean
  onClose?: () => void
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = (e: Event) => {
      e.preventDefault()
      if (onClose) onClose()
    }
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  return (
    <dialog ref={dialogRef} id={id} className="modal">
      <form className="modal-box flex flex-col justify-center gap-4">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          ✕
        </button>
        {children}
      </form>
    </dialog>
  )
}

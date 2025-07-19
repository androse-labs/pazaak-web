import React, { useEffect, useRef } from 'react'

export const GameNotification = ({
  children,
  id,
  open,
  onClose,
  persistent,
}: {
  children: React.ReactNode
  id: string
  open?: boolean
  onClose?: () => void
  persistent?: boolean
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

  // Close via the backdrop or close event, only if not persistent
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || persistent) return

    const handleClose = (e: Event) => {
      e.preventDefault()
      if (onClose) onClose()
    }
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose, persistent])

  return (
    <dialog ref={dialogRef} id={id} className="modal">
      <div className="modal-box flex flex-col justify-center gap-4">
        {children}
      </div>
      <form method="dialog" className="modal-backdrop"></form>
    </dialog>
  )
}

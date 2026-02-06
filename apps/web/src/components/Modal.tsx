export const Modal = ({
  children,
  id,
  withExitButton = false,
  onClose,
}: {
  children: React.ReactNode
  id: string
  withExitButton?: boolean
  onClose?: () => void
}) => {
  return (
    <dialog id={id} className="modal">
      <div className="modal-box flex flex-col justify-center gap-4">
        {withExitButton && (
          <button
            className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
            onClick={() => {
              const modal = document.getElementById(id)
              if (modal instanceof HTMLDialogElement) {
                modal.close()
              }
              if (onClose) {
                onClose()
              }
            }}
          >
            ✕
          </button>
        )}
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button
          onClick={() => {
            if (onClose) {
              onClose()
            }
          }}
        >
          close
        </button>
      </form>
    </dialog>
  )
}

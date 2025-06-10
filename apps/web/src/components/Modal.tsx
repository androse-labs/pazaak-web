export const Modal = ({ children, id }: { children: React.ReactNode; id: string }) => {
  return (
    <dialog id={id} className="modal">
      <div className="modal-box flex flex-col justify-center gap-4">{children}</div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  )
}

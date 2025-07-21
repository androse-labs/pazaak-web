import clsx from 'clsx'

export const DropOverlay = ({
  isOver,
  text,
}: {
  isOver: boolean
  text: string
}) => (
  <div
    className={clsx(
      'absolute inset-0 z-10 flex items-center justify-center rounded-md bg-black/40 text-white',
      {
        'outline-neutral outline-4 backdrop-blur-[2px]': isOver,
      },
    )}
  >
    {text}
  </div>
)

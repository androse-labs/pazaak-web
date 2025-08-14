import React from 'react'
import clsx from 'clsx'

export const DropOverlay = ({
  isOver,
  show,
  text,
  className,
  children,
}: {
  isOver: boolean
  show: boolean
  text: string
  className?: string
  children: React.ReactNode
}) => {
  return (
    <div
      className={clsx(
        'border-3 border-neutral relative h-full w-full rounded-lg border-dashed',
        className,
      )}
    >
      {children}
      {show && (
        <div
          className={clsx(
            'pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-md bg-black/40 text-white',
            { 'outline-neutral outline-4 backdrop-blur-[2px]': isOver },
          )}
        >
          {text}
        </div>
      )}
    </div>
  )
}

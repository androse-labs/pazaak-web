import type { Card as CardValue } from '@pazaak-web/shared'
import { useDraggable } from '@dnd-kit/core'
import clsx from 'clsx'
import { EmptyCard } from './EmptyCard'
import { CardPresentation } from './CardPresentation'

type CardProps = {
  card: CardValue
  disabled?: boolean
  draggable?: boolean
  cloneable?: boolean
}

export const Card = ({
  card,
  draggable,
  cloneable,
  disabled = false,
}: CardProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  })

  if (!draggable) {
    return (
      <div
        className={clsx(
          'select-none',
          { 'cursor-not-allowed': disabled },
          { 'cursor-grab': !disabled },
        )}
      >
        <CardPresentation card={card} isShaking={false} />
      </div>
    )
  }

  if (isDragging) {
    if (cloneable) {
      return <CardPresentation card={card} />
    } else {
      return <EmptyCard />
    }
  }

  return (
    <div
      {...attributes}
      {...listeners}
      className={clsx(
        'touch-manipulation select-none',
        { 'cursor-not-allowed': disabled },
        { 'cursor-grab': !disabled },
      )}
    >
      <CardPresentation card={card} ref={setNodeRef} />
    </div>
  )
}

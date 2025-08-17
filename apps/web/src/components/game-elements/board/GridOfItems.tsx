import { Children, type ReactNode } from 'react'
import { EmptyCard } from '../card/EmptyCard'

// Takes either card components or hidden card components and fills the rest
// with empty card components
type GridOfItemsProps = {
  length: number
  children: ReactNode
}

export const GridOfItems: React.FC<GridOfItemsProps> = ({
  length,
  children,
}) => {
  const items = Children.toArray(children)
  return (
    <>
      {Array.from({ length }, (_, index) => {
        return items[index] ?? <EmptyCard key={index} />
      })}
    </>
  )
}

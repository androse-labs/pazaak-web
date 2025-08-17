import { HiddenCard } from '../card/HiddenCard'
import { GridOfItems } from './GridOfItems'

export const HiddenHandGrid = ({ cardCount }: { cardCount: number }) => {
  return (
    <div className="bg-base-200 grid w-fit grid-cols-4 grid-rows-1 gap-1 rounded-md p-2 lg:gap-2">
      <GridOfItems length={4}>
        {Array.from({ length: cardCount }, (_, index) => (
          <div key={index} className="h-full w-full">
            <HiddenCard />
          </div>
        ))}
      </GridOfItems>
    </div>
  )
}

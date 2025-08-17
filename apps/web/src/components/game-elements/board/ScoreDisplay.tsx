import clsx from 'clsx'

export const ScoreDisplay = ({
  total,
  count,
}: {
  total: number
  count: number
}) => {
  return (
    <div className="bg-base-200 flex flex-col-reverse items-center justify-center gap-1 rounded-md p-1 text-lg">
      {Array.from({ length: total }, (_, index) => (
        <div
          key={index}
          className={clsx(
            'h-6 w-6 rounded-full border-2',
            index < count ? 'bg-primary' : 'border-neutral',
          )}
        />
      ))}
    </div>
  )
}

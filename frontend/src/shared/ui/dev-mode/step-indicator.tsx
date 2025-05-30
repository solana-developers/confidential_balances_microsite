import { FC } from 'react'
import * as Icons from 'lucide-react'
import { cn } from '@/shared/utils'

type StepIndicatorProps = {
  className?: string
  value: boolean
}

export const StepIndicator: FC<StepIndicatorProps> = ({ className, value }) => (
  <div
    className={cn(
      'absolute top-1 -left-4 flex size-3 items-center justify-center overflow-hidden rounded-full border border-[var(--success)]',
      value ? 'bg-[var(--success)]' : '',
      className
    )}
  >
    {value && <Icons.Check className="size-1 stroke-[var(--border)] stroke-8" />}
  </div>
)

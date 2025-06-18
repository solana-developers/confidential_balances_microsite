import { FC } from 'react'
import { Check } from 'lucide-react'
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
    {value && <Check className="size-1 stroke-[var(--border)] stroke-8" />}
  </div>
)

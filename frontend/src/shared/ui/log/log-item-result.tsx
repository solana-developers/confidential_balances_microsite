import { FC, PropsWithChildren } from 'react'
import { cva, VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

const logItemResultVariants = cva('', {
  variants: {
    variant: {
      success: 'text-[var(--success)]',
      error: 'text-[var(--destructive)]',
      muted: 'text-[var(--muted-foreground)]',
    },
  },
  defaultVariants: {
    variant: 'success',
  },
})

type LogItemResultProps = PropsWithChildren & VariantProps<typeof logItemResultVariants>

export const LogItemResult: FC<LogItemResultProps> = ({ children, variant }) => (
  <pre
    className={cn(
      'overflow-hidden text-ellipsis',
      'font-(family-name:--font-family-geist-mono) text-xs tracking-[-0.0375rem]',
      logItemResultVariants({ variant })
    )}
  >
    {children}
  </pre>
)

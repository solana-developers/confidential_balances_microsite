import { FC, PropsWithChildren } from 'react'
import { cn } from '@/shared/utils'

type LogItemResultProps = PropsWithChildren<{
  success: boolean
}>

export const LogItemResult: FC<LogItemResultProps> = ({ children, success }) => (
  <pre
    className={cn(
      'overflow-hidden text-ellipsis',
      'font-(family-name:--font-family-geist-mono) text-xs tracking-[-0.0375rem]',
      success ? 'text-[var(--success)]' : 'text-[var(--destructive)]'
    )}
  >
    {children}
  </pre>
)

import { FC, PropsWithChildren } from 'react'
import { cn } from '@/shared/utils'

export const SimpleLayout: FC<PropsWithChildren<{ className: string }>> = ({
  className,
  children,
}) => (
  <div className={cn(className, 'flex h-full w-full items-center justify-center')}>{children}</div>
)

import { FC, PropsWithChildren } from 'react'

type StepNumberProps = PropsWithChildren

export const StepNumber: FC<StepNumberProps> = ({ children }) => (
  <div className="flex size-5 items-center justify-center overflow-hidden rounded-full border border-[var(--accent)] text-xs leading-none tracking-tight whitespace-nowrap text-[var(--accent)]">
    {children}
  </div>
)

import { FC, MutableRefObject, PropsWithChildren } from 'react'
import copy from 'copy-to-clipboard'
import { LogItem } from '@/shared/ui/log'
import { useToast } from '@/shared/ui/toast'
import { cn } from '@/shared/utils'
import { StepIndicator } from './step-indicator'

type StepProps = PropsWithChildren<{
  step: number
  title: string
  description: string
  command?: string
  done?: boolean
  ref?: MutableRefObject<HTMLDivElement | null>
}>

export const Step: FC<StepProps> = ({ step, title, description, command, done, ref, children }) => {
  const { success } = useToast()

  return (
    <>
      <div
        ref={ref}
        className={cn('flex flex-col gap-3 px-6 py-4 select-none', {
          'cursor-pointer hover:bg-[var(--border)]/20 active:bg-[var(--border)]/30':
            command !== undefined,
        })}
        onClick={
          command !== undefined
            ? () => {
                copy(command)
                success('Copied to clipboard')
              }
            : undefined
        }
      >
        <div>
          <h4 className="relative text-sm font-medium tracking-[-0.04375rem] text-[var(--foreground)]">
            {step}. {title}
            <StepIndicator className="absolute top-1 -left-4" value={done ?? false} />
          </h4>
          <p className="text-xs tracking-[-0.0375rem] text-[var(--foreground)]/50">{description}</p>
        </div>
        {command !== undefined && (
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <pre className="font-(family-name:--font-family-geist-mono) text-xs tracking-[-0.0375rem] text-[var(--info)]">
              &gt;
            </pre>
            <code className="font-(family-name:--font-family-geist-mono) text-xs tracking-[-0.0375rem] text-[var(--info)]">
              {command}
            </code>
          </div>
        )}
      </div>

      {children ?? <LogItem variant="success" />}
    </>
  )
}

import React, { FC, PropsWithChildren } from 'react'
import copy from 'copy-to-clipboard'
import { useToast } from '@/shared/ui/toast'
import { cn } from '@/shared/utils'
import { LogItemResult } from './log-item-result'

type LogItemProps = PropsWithChildren<{
  title?: string
  success?: boolean
}>

export const LogItem: FC<LogItemProps> = ({ title, success, children }) => {
  const toast = useToast()

  return (
    <div
      className={cn(
        'grid grid-cols-[auto_1fr] gap-2 px-6 py-4 select-none',
        !!title || !!children
          ? 'cursor-pointer hover:bg-[var(--border)]/20 active:bg-[var(--border)]/30'
          : ''
      )}
      onClick={() => {
        if (title) {
          const text = [
            title,
            ...(React.Children.map(children, (child) => {
              if (
                React.isValidElement(child) &&
                child.type === LogItemResult &&
                typeof child.props.children === 'string'
              ) {
                return child.props.children
              }
              return null
            })?.filter((x) => x !== null) ?? []),
          ]

          copy(text.join('\n'))
          toast.success('Copied to clipboard')
        }
      }}
    >
      <pre
        className={cn(
          'font-(family-name:--font-family-geist-mono) text-xs tracking-[-0.0375rem]',
          success ? 'text-[var(--success)]' : 'text-[var(--destructive)]'
        )}
      >
        &gt;
      </pre>
      <div className="overflow-hidden">
        <pre
          className={cn(
            'overflow-hidden text-ellipsis',
            'font-(family-name:--font-family-geist-mono) text-xs font-bold tracking-[-0.0375rem]',
            success ? 'text-[var(--success)]' : 'text-[var(--destructive)]'
          )}
        >
          {title}
        </pre>
        {children}
      </div>
    </div>
  )
}

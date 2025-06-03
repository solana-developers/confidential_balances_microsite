import React, { FC, PropsWithChildren } from 'react'
import { cva, VariantProps } from 'class-variance-authority'
import copy from 'copy-to-clipboard'
import { useToast } from '@/shared/ui/toast'
import { cn } from '@/shared/utils'
import { LogItemResult } from './log-item-result'

const logItemVariants = cva('', {
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

type LogItemProps = PropsWithChildren<{
  className?: string
  title?: string
}> &
  VariantProps<typeof logItemVariants>

export const LogItem: FC<LogItemProps> = ({ title, children, variant, className }) => {
  const toast = useToast()

  return (
    <div
      className={cn(
        'grid grid-cols-[auto_1fr] gap-2 px-6 py-4 select-none',
        !!title || !!children
          ? 'cursor-pointer hover:bg-[var(--border)]/20 active:bg-[var(--border)]/30'
          : '',
        className
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
          logItemVariants({ variant })
        )}
      >
        &gt;
      </pre>
      <div className="overflow-hidden">
        <pre
          className={cn(
            'overflow-hidden text-ellipsis',
            'font-(family-name:--font-family-geist-mono) text-xs font-bold tracking-[-0.0375rem]',
            logItemVariants({ variant })
          )}
        >
          {title}
        </pre>
        {children}
      </div>
    </div>
  )
}

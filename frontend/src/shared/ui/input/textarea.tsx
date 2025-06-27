import { ComponentProps, FC } from 'react'
import { Textarea as UITextarea } from '@solana-foundation/ms-tools-ui/components/textarea'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils'
import styles from './input.module.css'

const textareaVariants = cva(
  cn(
    'rounded-md border border-[var(--border)] bg-[var(--background)]',
    'flex items-center py-3 pl-3 resize-none',
    'text-4xl font-light text-[var(--white)] !leading-none min-h-auto',
    'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 focus:outline-none',
    'hover:border-[var(--border)]/80',
    'disabled:cursor-not-allowed disabled:bg-[var(--table-background)] disabled:opacity-50',
    'placeholder:text-[var(--white)]/40',
    'transition-all duration-200 ease-in-out'
  ),
  {
    variants: {
      layout: {
        narrow: 'box-content',
      },
      size: {
        lg: 'text-[2.25rem] md:text-[2.25rem] w-auto',
      },
    },
    defaultVariants: {
      layout: 'narrow',
      size: 'lg',
    },
  }
)

export const Textarea: FC<ComponentProps<'textarea'> & { icon?: React.ReactNode }> = ({
  className,
  icon,
  ...props
}) => (
  <div className="relative flex flex-col overflow-hidden">
    {icon && (
      <div className="absolute top-1/2 left-2 -translate-y-1/2 text-[var(--foreground)]/50">
        {icon}
      </div>
    )}
    <UITextarea
      className={cn(
        textareaVariants(),
        styles.input,
        {
          '!pl-10': !!icon,
        },
        className
      )}
      {...props}
    />
  </div>
)

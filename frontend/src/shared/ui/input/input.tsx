import { ComponentProps, FC } from 'react'
import { Input as UIInput } from '@solana-foundation/ms-tools-ui'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils'
import styles from './input.module.css'

const inputVariants = cva(
  cn(
    'rounded-md border border-[var(--border)] bg-[var(--background)]',
    'flex items-center py-3 pl-3',
    'text-4xl font-light text-[var(--white)]',
    'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 focus:outline-none',
    'hover:border-[var(--border)]/80',
    'disabled:cursor-not-allowed disabled:bg-[var(--table-background)] disabled:opacity-50',
    'placeholder:text-[var(--white)]/40',
    'transition-all duration-200 ease-in-out'
  ),
  {
    variants: {
      layout: {
        narrow: 'leading-[100%] box-content',
      },
      size: {
        lg: 'h-9 text-[2.25rem] md:text-[2.25rem] w-auto',
      },
    },
    defaultVariants: {
      layout: 'narrow',
      size: 'lg',
    },
  }
)

export const Input: FC<ComponentProps<'input'> & { icon?: React.ReactNode }> = ({
  className,
  icon,
  ...props
}) => (
  <div className="relative flex flex-col">
    {icon && (
      <div className="absolute top-1/2 left-2 -translate-y-1/2 text-[var(--foreground)]/50">
        {icon}
      </div>
    )}
    <UIInput
      className={cn(
        inputVariants(),
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

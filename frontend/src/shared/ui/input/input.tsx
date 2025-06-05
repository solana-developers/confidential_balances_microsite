import { ComponentProps, FC } from 'react'
import { Input as UIInput } from '@solana-foundation/ms-tools-ui'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils'

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
        lg: 'h-9 text-[2.25rem] md:text-[2.25rem] w-auto !pr-[56px]',
      },
    },
    defaultVariants: {
      layout: 'narrow',
      size: 'lg',
    },
  }
)

export const Input: FC<ComponentProps<'input'>> = ({ children, className, ...props }) => {
  return (
    <UIInput className={cn(inputVariants(), className)} {...props}>
      {children}
    </UIInput>
  )
}

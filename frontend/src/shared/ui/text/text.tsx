import { ElementType, FC, PropsWithChildren } from 'react'
import { cva, VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

const textVariants = cva('', {
  variants: {
    variant: {
      header1: 'font-medium text-xl tracking-[-0.03125rem] text-[var(--foreground)]',
      text: 'text-[15px] tracking-[-0.01875rem] text-[var(--muted)]',
      textSmall: 'text-xs tracking-[-0.01875rem] text-[var(--muted)]',
    },
  },
  defaultVariants: {
    variant: 'text',
  },
})

const elements: Record<NonNullable<VariantProps<typeof textVariants>['variant']>, ElementType> = {
  header1: 'h1',
  text: 'p',
  textSmall: 'p',
}

type TextProps = PropsWithChildren<{
  className?: string
  as?: (typeof elements)[keyof typeof elements]
}> &
  VariantProps<typeof textVariants>

export const Text: FC<TextProps> = ({ children, className, as, variant = 'text' }) => {
  const Element = as ?? elements[variant ?? 'text']

  return <Element className={cn(textVariants({ variant }), className)}>{children}</Element>
}

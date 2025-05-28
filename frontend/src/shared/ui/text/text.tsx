import { ElementType, FC, PropsWithChildren } from 'react'
import { cva, VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

const textVariants = cva('', {
  variants: {
    variant: {
      header1: 'font-medium text-xl tracking-tight text-black dark:text-white',
      text: 'text-sm text-black dark:text-white opacity-50',
      textSmall: 'text-xs text-black dark:text-white opacity-50',
    },
  },
})

type TextProps = PropsWithChildren<{
  className?: string
}> &
  VariantProps<typeof textVariants>

const elements: Record<NonNullable<VariantProps<typeof textVariants>['variant']>, ElementType> = {
  header1: 'h1',
  text: 'p',
  textSmall: 'p',
}

export const Text: FC<TextProps> = ({ children, className, variant = 'text' }) => {
  const Element = elements[variant ?? 'text']

  return <Element className={cn(textVariants({ variant }), className)}>{children}</Element>
}

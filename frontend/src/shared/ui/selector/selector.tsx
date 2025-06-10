'use client'

import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cn } from '@/shared/utils'

function Selector({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('flex flex-nowrap gap-2', className)}
      {...props}
    />
  )
}

function SelectorItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'px-4 py-3',
        'flex flex-1 flex-col items-start gap-0.5',
        'rounded-sm border border-[var(--border)]',
        'text-sm [&_svg:not([class*="size-"])]:size-4',
        'data-[state=checked]:text-[var(--accent)]',
        'bg-[var(--background)] data-[state=checked]:bg-[var(--table-stroke)]',
        className
      )}
      {...props}
    >
      {children}
    </RadioGroupPrimitive.Item>
  )
}

export { Selector, SelectorItem }

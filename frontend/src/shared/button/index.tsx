import { ComponentProps } from 'react'
import { Button } from '@hoodieshq/ms-tools-ui'
import { cva } from 'class-variance-authority'
import * as Icons from 'lucide-react'
import { cn } from '@/shared/utils'

export function ClusterButton(props: ComponentProps<'button'>) {
  return (
    <Button
      variant="secondary"
      className="h-10.5 cursor-pointer rounded-sm border border-(color:--border) bg-transparent px-4! leading-[24px]!"
      {...props}
    >
      <Icons.Network /> Devnet
    </Button>
  )
}

export function DevmodeButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <Button
      variant="secondary"
      className={cn(
        className,
        'h-10.5 cursor-pointer rounded-sm border border-(color:--border) bg-transparent px-4! leading-[24px]!'
      )}
      {...props}
    >
      <Icons.Code2 /> Dev mode
    </Button>
  )
}

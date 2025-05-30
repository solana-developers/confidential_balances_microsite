import { ComponentProps, FC } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/shared/utils'

type BackwardControlProps = {
  asChild?: boolean
} & ComponentProps<'a'>

export const BackwardControl: FC<BackwardControlProps> = ({
  asChild = false,
  children,
  className,
  href,
  ...props
}) => {
  const LinkComp = asChild ? Slot : 'a'

  return (
    <LinkComp aria-label="backward-control" href={href} data-slot="backward-link" {...props}>
      <div
        className={cn(
          'flex flex-row items-center gap-2 text-sm/4 text-white opacity-50',
          className
        )}
      >
        <ArrowLeft size={16} />
        {children}
      </div>
    </LinkComp>
  )
}

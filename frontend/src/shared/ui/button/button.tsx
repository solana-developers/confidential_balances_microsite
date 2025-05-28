import { ComponentType, FC, PropsWithChildren } from 'react'
import Link from 'next/link'
import { cva, VariantProps } from 'class-variance-authority'
import * as Icons from 'lucide-react'
import { cn } from '@/shared/utils'

const buttonVariants = cva(
  'inline-flex flex-nowrap items-center border select-none disabled:pointer-events-none disabled:opacity-34 enabled:cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'border-emerald-100 bg-emerald-100 text-teal-800 hover:border-emerald-200 hover:bg-emerald-200 active:border-emerald-300 active:bg-emerald-300 dark:border-emerald-400 dark:bg-emerald-400 dark:text-teal-900 dark:hover:border-emerald-500 dark:hover:bg-emerald-500 dark:active:border-emerald-600 dark:active:bg-emerald-600',
        secondary:
          'border-zinc-300 bg-transparent text-black hover:border-zinc-400 active:border-zinc-500 dark:border-zinc-800 dark:text-white dark:hover:border-zinc-700 dark:active:border-zinc-600',
      },
      size: {
        default: 'gap-2 rounded-sm px-4 py-2 font-family-inter text-sm font-medium',
        sm: 'gap-1 rounded-xs px-2 py-1 text-xs tracking-tight',
      },
    },
  }
)

const iconVariants = cva('shrink-0', {
  variants: {
    variant: {
      primary: '',
      secondary: '',
    },
    size: {
      default: 'size-4',
      sm: 'size-3',
    },
  },
})

type ButtonProps = PropsWithChildren<{
  className?: string
  loading?: boolean
  disabled?: boolean
  icon?: ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void | Promise<void>
}> &
  VariantProps<typeof buttonVariants>

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'default',
  className,
  loading,
  disabled,
  icon,
  href,
  onClick,
}) => {
  const Icon = loading ? Icons.Loader2 : icon

  return (
    <Container
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      href={href}
      onClick={onClick}
    >
      {Icon && (
        <Icon className={cn(iconVariants({ variant, size }), { 'animate-spin': loading })} />
      )}
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{children}</span>
    </Container>
  )
}

const Container: FC<
  Pick<ButtonProps, 'children' | 'className' | 'disabled' | 'href' | 'onClick'>
> = ({ children, href, ...props }) =>
  !href ? (
    <button {...props}>{children}</button>
  ) : (
    <Link href={href} {...props}>
      {children}
    </Link>
  )

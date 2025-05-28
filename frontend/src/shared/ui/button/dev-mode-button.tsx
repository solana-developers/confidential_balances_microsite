import { ComponentProps, FC } from 'react'
import * as Icons from 'lucide-react'
import { cn } from '@/shared/utils'
import { Button } from './button'

type DevModeButton = Pick<
  ComponentProps<typeof Button>,
  'loading' | 'disabled' | 'href' | 'onClick'
> & {
  state: boolean
}

export const DevModeButton: FC<DevModeButton> = ({ state, loading, disabled, href, onClick }) => (
  <Button
    className={cn({
      'bg-zinc-50 text-emerald-100 dark:bg-zinc-900 dark:text-emerald-400': state,
    })}
    variant="secondary"
    loading={loading}
    disabled={disabled}
    icon={Icons.Code2}
    href={href}
    onClick={onClick}
  >
    Dev mode
  </Button>
)

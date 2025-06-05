import { ComponentProps, FC } from 'react'
import { Button } from '@solana-foundation/ms-tools-ui'
import * as Icons from 'lucide-react'
import { cn } from '@/shared/utils'

type DevModeButton = ComponentProps<typeof Button> & {
  state: boolean
}

export const DevModeButton: FC<DevModeButton> = ({ state, ...props }) => (
  <Button
    className={cn({
      'bg-[var(--table-background)] text-[var(--accent)]': state,
    })}
    variant="outline"
    {...props}
  >
    <Icons.Code2 />
    Dev mode
  </Button>
)

import { ComponentProps, FC } from 'react'
import { Button } from '@solana-foundation/ms-tools-ui/components/button'
import { Code2 } from 'lucide-react'
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
    <Code2 />
    Dev mode
  </Button>
)

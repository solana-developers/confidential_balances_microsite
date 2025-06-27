import { FC } from 'react'
import { Button } from '@solana-foundation/ms-tools-ui/components/button'
import { useAtom } from 'jotai'
import { TerminalSquare } from 'lucide-react'
import { cn } from '@/shared/utils'
import { operationLogOpenAtom } from '../model/operation-log-open'

export const OperationLogButton: FC = () => {
  const [operationLogOpen, setOperationLogOpen] = useAtom(operationLogOpenAtom)

  return (
    <Button
      className={cn(
        'fixed right-4 bottom-4 z-50 bg-[var(--background)] transition-opacity duration-300 hover:bg-[var(--table-background)] active:bg-[var(--table-background)]/80',
        {
          'pointer-events-none opacity-0': operationLogOpen,
        }
      )}
      variant="outline"
      onClick={() => setOperationLogOpen(true)}
    >
      <TerminalSquare />
      Open operation log
    </Button>
  )
}

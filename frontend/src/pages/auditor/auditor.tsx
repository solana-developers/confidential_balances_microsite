import { FC } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@solana-foundation/ms-tools-ui/components/dialog'
import { Radar } from 'lucide-react'
import { AuditTransaction } from '@/features/audit-transaction'

export const Auditor: FC = () => {
  const searchParams = useSearchParams()
  const tx = searchParams?.get('tx') ?? undefined

  return (
    <Dialog open={true} modal={false}>
      <DialogContent
        className="relative top-auto right-0 left-auto z-0 mx-auto mt-12 translate-x-0 translate-y-0"
        renderPortal={false}
        renderClose={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left text-xl font-medium">
            <Radar />
            Audit transaction
          </DialogTitle>
        </DialogHeader>
        <AuditTransaction tx={tx} />
      </DialogContent>
    </Dialog>
  )
}

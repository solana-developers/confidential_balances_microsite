import { FC } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@solana-foundation/ms-tools-ui'
import { AuditTransaction } from '@/features/audit-transaction'

export const Auditor: FC = () => (
  <Dialog open={true} modal={false}>
    <DialogContent
      className="relative top-auto right-0 left-auto z-0 mx-auto mt-12 translate-x-0 translate-y-0"
      renderPortal={false}
    >
      <DialogHeader>
        <DialogTitle>Audit transaction</DialogTitle>
      </DialogHeader>
      <AuditTransaction />
    </DialogContent>
  </Dialog>
)

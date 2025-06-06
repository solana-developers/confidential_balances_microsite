import { FC } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@solana-foundation/ms-tools-ui'
import { AuditTransaction } from '@/features/audit-transaction'

export const Auditor: FC = () => (
  <Dialog open={true} modal={false}>
    <DialogContent className="top-40 translate-y-0">
      <DialogHeader>
        <DialogTitle>Audit transaction</DialogTitle>
      </DialogHeader>
      <AuditTransaction />
    </DialogContent>
  </Dialog>
)

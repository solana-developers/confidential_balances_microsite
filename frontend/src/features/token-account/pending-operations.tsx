import { ComponentProps, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { IconChecks } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Clock, Loader, RefreshCw, XCircle } from 'lucide-react'
import { useApplyCB } from '@/entities/account/account/model/use-apply-cb'
import { useHasPendingBalance } from '@/entities/account/account/model/use-has-pending-balance'
import { DataTable } from '@/shared/ui/data-table'

type DataTableAction = NonNullable<ComponentProps<typeof DataTable>['actions']>[0]

export function PendingOperations({ account }: { account: PublicKey }) {
  const { connected, publicKey } = useWallet()

  return (
    <>
      {!connected || !publicKey ? (
        <DisconnectedWalletPendingOperations />
      ) : (
        <ConnectedWalletPendingOperations address={publicKey} account={account} />
      )}
    </>
  )
}

const DisconnectedWalletPendingOperations: FC = () => (
  <DataTable
    title="Pending Operations"
    labels={{ empty: 'To see pending operations connect your wallet!' }}
  />
)

function ConnectedWalletPendingOperations({
  address,
  account,
  limit = 5,
}: Required<{ address: PublicKey; account: PublicKey }> & { limit?: number }) {
  const [showAll, setShowAll] = useState(false)
  const client = useQueryClient()

  const { mutate: applyPendingBalance, isPending: isApplying } = useApplyCB({
    address: account,
  })
  const { data: hasPending, isLoading: isPendingLoading } = useHasPendingBalance({
    tokenAccountPubkey: account,
  })

  // Log whenever hasPending changes
  useEffect(() => {
    console.log('TokenAccountButtons: hasPending value changed:', hasPending)
  }, [hasPending])

  // For now, we'll use mock data since we don't have a specific API for pending operations list
  // In a real implementation, this would fetch from a pending operations endpoint
  const operations: typeof mockOperations = useMemo(() => [], []) //mockOperations

  const items = useMemo(() => {
    if (showAll) return operations
    return operations?.slice(0, limit)
  }, [operations, showAll, limit])

  const emptyLabel = useMemo(() => {
    if (!operations || operations.length === 0) {
      return 'No pending operations found'
    }
  }, [operations])

  const isPending = useMemo(() => hasPending && !isApplying, [hasPending, isApplying])

  const actions = useMemo(() => {
    let list: DataTableAction[] = []

    if (hasPending) {
      list.push({
        action: 'applyPending',
        title: 'Apply all',
        onClick: () => applyPendingBalance(),
        icon: isPendingLoading ? (
          <Loader />
        ) : (
          <IconChecks className="animate-ping text-(color:--accent)" />
        ),
      })
    }

    return list
  }, [hasPending, isPendingLoading, applyPendingBalance])

  return (
    <DataTable
      title="Pending Operations"
      labels={{ empty: emptyLabel }}
      emptyComp={
        hasPending ? (
          <span className="flex flex-row items-center gap-1 text-(color:--accent)">
            {isPending ? <Clock size={12} /> : <Loader size={12} />}{' '}
            {isPending ? 'There are pending operations for approval' : 'Applying..'}
          </span>
        ) : (
          'No pending operations found.'
        )
      }
      actions={actions}
    />
  )
}

import { FC, useCallback, useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, RefreshCw, XCircle } from 'lucide-react'
import { useApplyCB } from '@/entities/account/account/model/use-apply-cb'
import { useHasPendingBalance } from '@/entities/account/account/model/use-has-pending-balance'
import { DataTable } from '@/shared/ui/data-table'

// Mock operations data based on dashboard operations
const mockOperations = [
  {
    id: 'Txn5x8f',
    title: 'Transfer Operation',
    operation: 'ConfidentialTransferInstruction::Transfer',
    note: 'Transferred 45.8 tokens to recipient',
    status: 'COMPLETE' as const,
    variant: 'success' as const,
  },
  {
    id: 'TxnA2d9',
    title: 'Withdraw Operation',
    operation: 'ConfidentialTransferInstruction::Withdraw',
    note: 'Insufficient confidential balance',
    status: 'FAILED' as const,
    variant: 'error' as const,
  },
  {
    id: 'Txn7c3e',
    title: 'Deposit Operation',
    operation: 'ConfidentialTransferInstruction::Deposit',
    note: 'Deposited 120.5 tokens',
    status: 'COMPLETE' as const,
    variant: 'success' as const,
  },
  {
    id: 'TxnF9b2',
    title: 'Transfer Operation',
    operation: 'ConfidentialTransferInstruction::Transfer',
    note: 'Transferring 25 tokens',
    status: 'PENDING' as const,
    variant: 'muted' as const,
  },
]

export function PendingOperations() {
  const { connected, publicKey } = useWallet()

  return (
    <>
      {!connected || !publicKey ? (
        <DisconnectedWalletPendingOperations />
      ) : (
        <ConnectedWalletPendingOperations address={publicKey} />
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
  limit = 5,
}: Required<{ address: PublicKey }> & { limit?: number }) {
  const [showAll, setShowAll] = useState(false)
  const client = useQueryClient()

  // For now, we'll use mock data since we don't have a specific API for pending operations list
  // In a real implementation, this would fetch from a pending operations endpoint
  const operations: typeof mockOperations = [] //mockOperations

  const items = useMemo(() => {
    if (showAll) return operations
    return operations?.slice(0, limit)
  }, [operations, showAll, limit])

  const emptyLabel = useMemo(() => {
    if (!operations || operations.length === 0) {
      return 'No pending operations found'
    }
  }, [operations])

  const actions = useMemo(() => {
    const onRefresh = async () => {
      await client.invalidateQueries({
        queryKey: ['has-pending-balance'],
      })
    }

    let list = [
      {
        action: 'refetch',
        title: '',
        icon: RefreshCw,
        onClick: onRefresh,
      },
    ]

    if ((operations?.length ?? 0) > limit) {
      const toggleAction = {
        action: 'toggleItems',
        title: showAll ? 'Show Less' : 'Show More',
        onClick: () => setShowAll(!showAll),
      }
      list = [toggleAction, ...list]
    }

    return list
  }, [showAll, client, operations, limit])

  const getStatusIcon = (variant: string) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 animate-pulse rounded-full bg-yellow-500" />
    }
  }

  const getStatusBadge = (status: string, variant: string) => {
    const badgeClass =
      variant === 'success'
        ? 'badge badge-success text-xs'
        : variant === 'error'
          ? 'badge badge-error text-xs'
          : 'badge badge-warning text-xs'

    return <div className={badgeClass}>{status}</div>
  }

  return (
    <DataTable
      title="Pending Operations"
      labels={{ empty: emptyLabel }}
      actions={actions}
      headers={['Operation', 'Transaction ID', 'Status', 'Details']}
      rows={items?.map((operation, i) => [
        <div key={`op-title-${i}`} className="flex items-center space-x-2">
          {getStatusIcon(operation.variant)}
          <span className="font-medium">{operation.title}</span>
        </div>,
        <span key={`op-id-${i}`} className="font-mono text-sm text-(color:--accent)">
          {operation.id}
        </span>,
        <div key={`op-status-${i}`} className="text-right">
          {getStatusBadge(operation.status, operation.variant)}
        </div>,
        <div key={`op-details-${i}`} className="text-sm text-gray-600">
          <div className="font-mono text-xs">{operation.operation}</div>
          <div className="text-gray-500">{operation.note}</div>
        </div>,
      ])}
    />
  )
}

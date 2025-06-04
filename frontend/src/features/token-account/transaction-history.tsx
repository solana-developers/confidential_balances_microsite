import { FC, useCallback, useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { useGetSignatures } from '@/entities/account/account/model/use-get-signatures'
import { ExplorerLink } from '@/entities/cluster/cluster'
import { DataTable } from '@/shared/ui/data-table'
import { ellipsify } from '@/shared/utils'

export function TransactionHistory() {
  const { connected, publicKey } = useWallet()

  return (
    <>
      {!connected || !publicKey ? (
        <DisconnectedWalletTransactionHistory />
      ) : (
        <ConnectedWalletTransactionHistory address={publicKey} />
      )}
    </>
  )
}

const DisconnectedWalletTransactionHistory: FC = () => (
  <DataTable
    title="Transaction History"
    labels={{ empty: 'To see transaction history connect your wallet!' }}
  />
)

function ConnectedWalletTransactionHistory({
  address,
  limit = 5,
}: Required<{ address: PublicKey }> & { limit?: number }) {
  const [showAll, setShowAll] = useState(false)
  const query = useGetSignatures({ address })
  const client = useQueryClient()

  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, limit)
  }, [query.data, showAll, limit])

  const emptyLabel = useMemo(() => {
    const empty = 'No transactions found for selected account'
    if (query.isLoading) return 'Loading...'
    if (query.isError) return 'Can not load transaction data'
    if (query.isSuccess && (!query.data || query.data.length === 0)) {
      return empty
    }
    return empty
  }, [query])

  const actions = useMemo(() => {
    // NOTE: preserve original functionality by invalidating data
    const onRefreshSignatures = async () => {
      await query.refetch()
      await client.invalidateQueries({
        queryKey: ['get-signatures'],
      })
    }

    let list = [
      {
        action: 'refetch',
        title: '',
        icon: RefreshCw,
        onClick: onRefreshSignatures,
      },
    ]

    if ((query.data?.length ?? 0) > limit) {
      const toggleAction = {
        action: 'toggleItems',
        title: showAll ? 'Show Less' : 'Show More',
        onClick: () => setShowAll(!showAll),
      }
      list = [toggleAction, ...list]
    }

    return list
  }, [showAll, client, query, limit])

  return (
    <DataTable
      title="Transaction History"
      labels={{ empty: emptyLabel }}
      actions={actions}
      headers={['Signature', 'Slot', 'Block Time', 'Status']}
      rows={items?.map((item, i) => [
        <ExplorerLink
          key={`tx-sig-${i}`}
          path={`tx/${item.signature}`}
          label={ellipsify(item.signature, 8)}
          className="font-mono text-(color:--accent)"
        />,
        <ExplorerLink
          key={`tx-slot-${i}`}
          path={`block/${item.slot}`}
          label={item.slot.toString()}
          className="text-right font-mono text-(color:--accent)"
        />,
        <span key={`tx-time-${i}`} className="text-sm">
          {new Date((item.blockTime ?? 0) * 1000).toISOString()}
        </span>,
        <div key={`tx-status-${i}`} className="text-right">
          {item.err ? (
            <div className="badge badge-error text-xs" title={JSON.stringify(item.err)}>
              Failed
            </div>
          ) : (
            <div className="badge badge-success text-xs">Success</div>
          )}
        </div>,
      ])}
    />
  )
}

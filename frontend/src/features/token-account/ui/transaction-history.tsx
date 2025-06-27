import { ComponentProps, FC, useMemo, useState } from 'react'
import Link from 'next/link'
import { Address } from '@solana-foundation/ms-tools-ui/components/address'
import { Badge } from '@solana-foundation/ms-tools-ui/components/badge'
import { Button } from '@solana-foundation/ms-tools-ui/components/button'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Loader, RefreshCw } from 'lucide-react'
import { useGetSignaturesWithTxData } from '@/entities/account/account/model/use-get-signatures-with-tx-data'
import { ExplorerLink } from '@/entities/cluster/cluster'
import { DataTable } from '@/shared/ui/data-table'
import { ellipsify } from '@/shared/utils'

type DataTableAction = NonNullable<ComponentProps<typeof DataTable>['actions']>[0]

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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const query = useGetSignaturesWithTxData({ address })
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
    const onRefreshSignatures = async () => {
      setIsRefreshing(true)
      await query.refetch()
      await client.invalidateQueries({
        queryKey: ['get-signatures'],
      })
      setIsRefreshing(false)
    }

    let list: DataTableAction[] = [
      {
        action: 'refetch',
        title: '',
        icon: isRefreshing ? <Loader /> : <RefreshCw />,
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
  }, [showAll, client, query, limit, setIsRefreshing, isRefreshing])

  return (
    <DataTable
      title="Transaction History"
      labels={{ empty: emptyLabel }}
      actions={actions}
      headers={['Signature', 'Slot', 'Block Time', 'Status', '']}
      rows={items?.map((item, i) => [
        <Address key={`tx-sig-${i}`} address={item.signature} asChild>
          <ExplorerLink
            path={`tx/${item.signature}`}
            label={ellipsify(item.signature, 8)}
            className="font-mono text-(color:--accent)"
          />
        </Address>,
        <ExplorerLink
          key={`tx-slot-${i}`}
          path={`block/${item.slot}`}
          label={item.slot.toString()}
          className="text-right font-mono text-(color:--accent)"
        />,
        <span key={`tx-time-${i}`} className="text-sm">
          {new Date((item.blockTime ?? 0) * 1000).toISOString()}
        </span>,
        item.err ? (
          <Badge key={`tx-status-${i}`} variant="destructive" size="xxs">
            Failure
          </Badge>
        ) : (
          <Badge key={`tx-status-${i}`} variant="success" size="xxs">
            Success
          </Badge>
        ),
        item.hasConfidentialTransfer ? (
          <Button key={`tx-action-${i}`} variant="outline" size="sm" asChild>
            <Link target="blank" href={`/auditor/?tx=${item.signature}`}>
              Audit <ExternalLink />
            </Link>
          </Button>
        ) : undefined,
      ])}
    />
  )
}

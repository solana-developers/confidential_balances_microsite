import { ComponentProps, FC, useEffect, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { IconChecks } from '@tabler/icons-react'
import { Clock, Loader } from 'lucide-react'
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
  account,
}: Required<{ address: PublicKey; account: PublicKey }>) {
  const { mutate: applyPendingBalance, isPending: isApplying } = useApplyCB({
    address: account,
  })
  const { data: hasPending, isLoading: isPendingLoading } = useHasPendingBalance({
    tokenAccountPubkey: account,
  })

  // Log whenever hasPending changes
  useEffect(() => {
    console.log('hasPending value changed:', hasPending)
  }, [hasPending])

  const emptyLabel = useMemo(() => {
    if (!hasPending) {
      return 'No pending operations found'
    }
  }, [hasPending])

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

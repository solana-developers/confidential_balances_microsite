import { ComponentProps, FC, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { Address } from '@solana-foundation/ms-tools-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { Coins, PlusCircle, RefreshCw } from 'lucide-react'
import { useCreateAssociatedTokenAccountCB } from '@/entities/account/account/model/use-create-associated-token-account-cb'
import {
  useCreateTestTokenCB,
  useMintTestTokenCB,
} from '@/entities/account/account/model/use-create-test-token-cb'
import { useGetTokenAccounts } from '@/entities/account/account/model/use-get-token-accounts'
import { ModalInitATA } from '@/entities/account/account/ui/modal-init-ata'
import { ExplorerLink } from '@/entities/cluster/cluster'
import { DataTable } from '@/shared/ui/data-table'

type DataTableAction = NonNullable<ComponentProps<typeof DataTable>['actions']>[0]

export function TokenAccounts() {
  const { connected, publicKey } = useWallet()

  return (
    <>
      {!connected || !publicKey ? (
        <DisconnectedWalletTokenAccounts />
      ) : (
        <ConnectedWalletTokenAccounts address={publicKey} />
      )}
    </>
  )
}

const DisconnectedWalletTokenAccounts: FC = () => (
  <DataTable
    title="Token accounts with confidential balances"
    labels={{ empty: 'To see details connect your wallet!' }}
  />
)

function ConnectedWalletTokenAccounts({
  address,
  limit = 50,
}: Required<{ address: PublicKey }> & { limit?: number }) {
  const [showAll, setShowAll] = useState(true)
  const query = useGetTokenAccounts({ address })
  const client = useQueryClient()
  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, limit)
  }, [query.data, showAll, limit])

  console.log({ items })

  const [showInitializeModal, setShowInitializeModal] = useState(false)
  const [showMintModal, setShowMintModal] = useState(false)
  const { mutate: initializeAccount, isPending: isInitializing } =
    useCreateAssociatedTokenAccountCB({ walletAddressPubkey: address })

  const { mutate: createTestToken } = useCreateTestTokenCB({ walletAddressPubkey: address })
  const { mutate: mintTestToken, isPending: isMinting } = useMintTestTokenCB({
    walletAddressPubkey: address,
  })

  const onCreateCTA = useCallback(() => {
    setShowInitializeModal(true)
  }, [setShowInitializeModal])

  const onMintTestToken = useCallback(() => {
    setShowMintModal(true)
  }, [setShowMintModal])

  const onCreateTestToken = useCallback(() => {
    createTestToken()
  }, [createTestToken])

  const emptyLabel = useMemo(() => {
    const noRecords = 'No token accounts found. Create new account to proceed'
    if (query.isLoading) return 'Loading...'
    if (query.isError) return 'Can not load data'
    if (query.isSuccess && (!query.data || query.data.length === 0)) {
      return noRecords
    }
    return noRecords
  }, [query])

  const actions = useMemo(() => {
    // NOTE: preserve original functionality by invalidating data
    const onInvalidateBalance = async () => {
      await query.refetch()
      await client.invalidateQueries({
        queryKey: ['getTokenAccountBalance'],
      })
    }

    let list: DataTableAction[] = [
      {
        action: 'createCTA',
        title: 'Create account',
        onClick: onCreateCTA,
      },
      {
        action: 'createTestToken',
        title: 'Create test tokens',
        onClick: onCreateTestToken,
        icon: <PlusCircle />,
      },
      {
        action: 'mintTestToken',
        title: 'Mint 1000 of token',
        onClick: onMintTestToken,
        icon: <Coins />,
      },
      {
        action: 'refetch',
        title: '',
        icon: <RefreshCw />,
        onClick: onInvalidateBalance,
      },
    ]

    if ((query.data?.length ?? 0) > limit) {
      const toggleAction = {
        action: 'toggleItems',
        title: showAll ? 'Show Less' : 'Show More',
        onClick: () => setShowAll(!showAll),
      }
      list = [list[0], list[1], toggleAction, list[2]]
    }

    return list
  }, [onCreateCTA, onCreateTestToken, showAll, client, query, limit, onMintTestToken])

  return (
    <>
      <ModalInitATA
        key="createConfidentialATA"
        show={showInitializeModal}
        hide={() => setShowInitializeModal(false)}
        initializeAccount={initializeAccount}
        isInitializing={isInitializing}
      />
      <ModalInitATA
        key="mintTestToken"
        show={showMintModal}
        hide={() => setShowMintModal(false)}
        initializeAccount={(a) => {
          console.log({ ADDRE: a })
          mintTestToken({ mintAddressPubkey: new PublicKey(a.mintAddress) })
        }}
        isInitializing={isMinting}
      />
      <DataTable
        title="Token accounts with confidential balances"
        labels={{ empty: emptyLabel }}
        actions={actions}
        headers={['Address', 'Mint', 'Balance']}
        rows={items?.map(({ account, pubkey }, i) => {
          const address = pubkey.toBase58()
          const mint = account.data.parsed.info.mint.toString()
          const { uiAmount } = account.data.parsed.info.tokenAmount
          return [
            <Link key={`ta-row-address-${i}`} href={`/account/${address}`}>
              <span className="text-(color:--accent)">{address}</span>
            </Link>,
            <Address key={`ta-wor-mint-${i}`} address={mint} asChild>
              <span className="text-(color:--accent)">
                <ExplorerLink label={mint} path={`account/${mint}`} />
              </span>
            </Address>,
            uiAmount,
          ]
        })}
      />
    </>
  )
}

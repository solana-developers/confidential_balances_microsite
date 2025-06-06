import { ComponentProps, FC, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { Address } from '@solana-foundation/ms-tools-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUp,
  ArrowUpFromLine,
  EyeOff,
  Send,
  Unlock,
} from 'lucide-react'
import { useConfidentialVisibility } from '@/entities/account/account/model/use-confidential-visibility'
import { useDecryptConfidentialBalance } from '@/entities/account/account/model/use-decrypt-confidential-balance'
import { useGetTokenAccounts } from '@/entities/account/account/model/use-get-token-accounts'
import { ExplorerLink } from '@/entities/cluster/cluster'
import { ModalDeposit } from '@/features/deposit-tokens'
import { ModalTransfer } from '@/features/transfer-tokens'
import { ModalWithdraw } from '@/features/withdraw-tokens'
import { DataTable } from '@/shared/ui/data-table'

type DataTableAction = NonNullable<ComponentProps<typeof DataTable>['actions']>[0]

export function ConfidentialBalances() {
  const { connected, publicKey } = useWallet()

  return (
    <>
      {!connected || !publicKey ? (
        <DisconnectedWalletConfidentialBalances />
      ) : (
        <ConnectedWalletConfidentialBalances address={publicKey} />
      )}
    </>
  )
}

const DisconnectedWalletConfidentialBalances: FC = () => (
  <DataTable
    title="Confidential Balances"
    labels={{ empty: 'To see confidential balances connect your wallet!' }}
  />
)

function ConnectedWalletConfidentialBalances({
  address,
  limit = 5,
}: Required<{ address: PublicKey }> & { limit?: number }) {
  const [showAll] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedTokenAccount, setSelectedTokenAccount] = useState<PublicKey | null>(null)

  const query = useMemo(
    () => ({ data: [], isLoading: false, isError: false, isSuccess: false }),
    []
  ) // useGetTokenAccounts({ address })
  const { decryptBalance, isDecrypting, confidentialBalance } = useDecryptConfidentialBalance()

  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, limit)
  }, [query.data, showAll, limit])

  // TODO: should allow to bypass empty record into DataTable to support control on the row level

  const emptyLabel = useMemo(() => {
    const empty = 'Balance is encrypted. Decrypt with wallet to see the balance'
    if (query.isLoading) return 'Loading...'
    if (query.isError) return 'Can not load confidential balance data'
    if (query.isSuccess && (!query.data || query.data.length === 0)) {
      return empty
    }
    return empty
  }, [query])

  const openDepositModal = useCallback((tokenAccount?: PublicKey) => {
    // if (tokenAccount) setSelectedTokenAccount(tokenAccount)
    // else if (query.data?.[0]?.pubkey) setSelectedTokenAccount(query.data[0].pubkey)
    setShowDepositModal(true)
  }, [])

  const openWithdrawModal = useCallback((tokenAccount?: PublicKey) => {
    // if (tokenAccount) setSelectedTokenAccount(tokenAccount)
    // else if (query.data?.[0]?.pubkey) setSelectedTokenAccount(query.data[0].pubkey)
    setShowWithdrawModal(true)
  }, [])

  const openTransferModal = useCallback((tokenAccount?: PublicKey) => {
    // if (tokenAccount) setSelectedTokenAccount(tokenAccount)
    // else if (query.data?.[0]?.pubkey) setSelectedTokenAccount(query.data[0].pubkey)
    setShowTransferModal(true)
  }, [])

  const actions = useMemo<DataTableAction[]>(() => {
    return [
      {
        action: 'deposit',
        title: 'Deposit',
        icon: <ArrowDown />,
        onClick: () => openDepositModal(address),
      },
      {
        action: 'withdraw',
        title: 'Withdraw',
        icon: <ArrowUp />,
        onClick: () => openWithdrawModal(address),
      },
      {
        action: 'transfer',
        title: 'Transfer',
        icon: <Send />,
        onClick: () => openTransferModal(address),
      },
    ]
  }, [openDepositModal, openWithdrawModal, openTransferModal, address])

  return (
    <>
      {/* Modals */}
      {selectedTokenAccount && (
        <>
          <ModalDeposit
            show={showDepositModal}
            hide={() => setShowDepositModal(false)}
            tokenAccountPubkey={selectedTokenAccount}
          />
          <ModalWithdraw
            show={showWithdrawModal}
            hide={() => setShowWithdrawModal(false)}
            tokenAccountPubkey={selectedTokenAccount}
          />
          <ModalTransfer
            show={showTransferModal}
            hide={() => setShowTransferModal(false)}
            tokenAccountPubkey={selectedTokenAccount}
          />
        </>
      )}

      <DataTable
        title="Confidential Balances"
        labels={{ empty: emptyLabel }}
        actions={actions}
        headers={['Account', 'Public Balance', 'Confidential Balance', 'Actions']}
        rows={items?.map(({ account, pubkey }, i) => {
          // const address = pubkey?.toString()
          // const mint = account.data.parsed.info.mint.toString()
          const address = ''
          const mint = ''
          return [
            <Address key={`ta-wor-mint-${i}`} address={mint} asChild>
              <span className="text-(color:--accent)">{address}</span>
            </Address>,
            '...',
          ]
        })}
      />
    </>
  )
}

import { ComponentProps, FC, useCallback, useMemo, useState } from 'react'
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
import { ModalDeposit } from '@/entities/account/account/ui/modal-deposit'
import { ModalTransfer } from '@/entities/account/account/ui/modal-transfer'
import { ModalWithdraw } from '@/entities/account/account/ui/modal-withdraw'
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

  const query = useGetTokenAccounts({ address })
  const { decryptBalance, isDecrypting, confidentialBalance } = useDecryptConfidentialBalance()

  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, limit)
  }, [query.data, showAll, limit])

  const emptyLabel = useMemo(() => {
    if (query.isLoading) return 'Loading...'
    if (query.isError) return 'Can not load confidential balance data'
    if (query.isSuccess && (!query.data || query.data.length === 0)) {
      return 'Balance is encrypted. Decrypt with wallet to see the balance'
    }
  }, [query])

  const openDepositModal = useCallback(
    (tokenAccount?: PublicKey) => {
      if (tokenAccount) setSelectedTokenAccount(tokenAccount)
      else if (query.data?.[0]?.pubkey) setSelectedTokenAccount(query.data[0].pubkey)
      setShowDepositModal(true)
    },
    [query.data]
  )

  const openWithdrawModal = useCallback(
    (tokenAccount?: PublicKey) => {
      if (tokenAccount) setSelectedTokenAccount(tokenAccount)
      else if (query.data?.[0]?.pubkey) setSelectedTokenAccount(query.data[0].pubkey)
      setShowWithdrawModal(true)
    },
    [query.data]
  )

  const openTransferModal = useCallback(
    (tokenAccount?: PublicKey) => {
      if (tokenAccount) setSelectedTokenAccount(tokenAccount)
      else if (query.data?.[0]?.pubkey) setSelectedTokenAccount(query.data[0].pubkey)
      setShowTransferModal(true)
    },
    [query.data]
  )

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
            address={selectedTokenAccount}
          />
        </>
      )}

      <DataTable
        title="Confidential Balances"
        labels={{ empty: emptyLabel }}
        actions={actions}
        headers={['Account', 'Public Balance', 'Confidential Balance', 'Actions']}
        rows={items?.map(({ account, pubkey }, i) => {
          const tokenAccountPubkey = pubkey
          return [
            <TokenAccountCell key={`cb-account-${i}`} pubkey={tokenAccountPubkey} />,
            <PublicBalanceCell key={`cb-public-${i}`} account={account} />,
            <ConfidentialBalanceCell
              key={`cb-confidential-${i}`}
              tokenAccountPubkey={tokenAccountPubkey}
              decryptBalance={decryptBalance}
              isDecrypting={isDecrypting}
              confidentialBalance={confidentialBalance}
            />,
            <ActionsCell
              key={`cb-actions-${i}`}
              tokenAccountPubkey={tokenAccountPubkey}
              onDeposit={() => openDepositModal(tokenAccountPubkey)}
              onWithdraw={() => openWithdrawModal(tokenAccountPubkey)}
              onTransfer={() => openTransferModal(tokenAccountPubkey)}
            />,
          ]
        })}
      />
    </>
  )
}

// Component for displaying token account address
const TokenAccountCell: FC<{ pubkey: PublicKey }> = ({ pubkey }) => {
  const address = pubkey.toBase58()
  return (
    <div className="font-mono text-sm">
      <div className="text-(color:--accent)">
        {address.slice(0, 8)}...{address.slice(-8)}
      </div>
      <div className="text-xs text-gray-500">Token Account</div>
    </div>
  )
}

// Component for displaying public balance
const PublicBalanceCell: FC<{ account: any }> = ({ account }) => {
  const { uiAmount } = account.data.parsed.info.tokenAmount
  return (
    <div className="text-right">
      <div className="font-medium">{uiAmount || '0'}</div>
      <div className="text-xs text-gray-500">Public</div>
    </div>
  )
}

// Component for displaying confidential balance with decrypt functionality
const ConfidentialBalanceCell: FC<{
  tokenAccountPubkey: PublicKey
  decryptBalance: (pubkey: PublicKey) => Promise<string | null>
  isDecrypting: boolean
  confidentialBalance: string | null
}> = ({ tokenAccountPubkey, decryptBalance, isDecrypting, confidentialBalance }) => {
  const { isVisible, showBalance, hideBalance } = useConfidentialVisibility(tokenAccountPubkey)
  const [localBalance, setLocalBalance] = useState<string | null>(null)

  const handleDecrypt = async () => {
    const balance = await decryptBalance(tokenAccountPubkey)
    if (balance) {
      setLocalBalance(balance)
      showBalance()
    }
  }

  const handleHide = () => {
    hideBalance()
    setLocalBalance(null)
  }

  if (isVisible && (localBalance || confidentialBalance)) {
    return (
      <div className="text-right">
        <div className="font-medium text-blue-500">
          {localBalance || confidentialBalance} Tokens
        </div>
        <div className="text-xs text-gray-500">Decrypted</div>
      </div>
    )
  }

  if (isDecrypting) {
    return (
      <div className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm">Decrypting...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="text-right">
      <div className="text-gray-400">••••••</div>
      <div className="text-xs text-gray-500">Encrypted</div>
    </div>
  )
}

// Component for balance actions
const ActionsCell: FC<{
  tokenAccountPubkey: PublicKey
  onDeposit: () => void
  onWithdraw: () => void
  onTransfer: () => void
}> = ({ tokenAccountPubkey, onDeposit, onWithdraw, onTransfer }) => {
  const { isVisible, showBalance, hideBalance } = useConfidentialVisibility(tokenAccountPubkey)
  const { decryptBalance, isDecrypting } = useDecryptConfidentialBalance()
  const [localBalance, setLocalBalance] = useState<string | null>(null)

  const handleDecrypt = async () => {
    const balance = await decryptBalance(tokenAccountPubkey)
    if (balance) {
      setLocalBalance(balance)
      showBalance()
    }
  }

  const handleHide = () => {
    hideBalance()
    setLocalBalance(null)
  }

  return (
    <div className="flex space-x-1">
      <button
        onClick={onDeposit}
        className="btn btn-xs btn-outline"
        title="Deposit to confidential balance"
      >
        <ArrowDownToLine className="h-3 w-3" />
      </button>
      <button
        onClick={onWithdraw}
        className="btn btn-xs btn-outline"
        title="Withdraw from confidential balance"
      >
        <ArrowUpFromLine className="h-3 w-3" />
      </button>
      <button
        onClick={onTransfer}
        className="btn btn-xs btn-outline"
        title="Transfer confidential balance"
      >
        <ArrowRightLeft className="h-3 w-3" />
      </button>
      {!isVisible ? (
        <button
          onClick={handleDecrypt}
          disabled={isDecrypting}
          className="btn btn-xs btn-outline"
          title="Decrypt confidential balance"
        >
          <Unlock className="h-3 w-3" />
        </button>
      ) : (
        <button
          onClick={handleHide}
          className="btn btn-xs btn-outline"
          title="Hide confidential balance"
        >
          <EyeOff className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

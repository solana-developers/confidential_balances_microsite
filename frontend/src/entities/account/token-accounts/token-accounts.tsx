import { FC, useCallback, useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { DataTable } from '@/shared/ui/data-table'
import { useCreateAssociatedTokenAccountCB } from '../account/model/use-create-associated-token-account-cb'
import { ModalInitATA } from '../account/ui/modal-init-ata'

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

function ConnectedWalletTokenAccounts({ address }: Required<{ address: PublicKey }>) {
  const [showInitializeModal, setShowInitializeModal] = useState(false)
  const { mutate: initializeAccount, isPending: isInitializing } =
    useCreateAssociatedTokenAccountCB({ walletAddressPubkey: address })

  const onCreateCTA = useCallback(() => {
    setShowInitializeModal(true)
  }, [setShowInitializeModal])

  const emptyLabel = useMemo(() => {
    return 'No token accounts found. Create new account to proceed'
  }, [])

  return (
    <>
      <ModalInitATA
        show={showInitializeModal}
        hide={() => setShowInitializeModal(false)}
        address={address}
        initializeAccount={initializeAccount}
        isInitializing={isInitializing}
      />
      <DataTable
        title="Token accounts with confidential balances"
        labels={{ empty: emptyLabel }}
        actions={[
          {
            action: 'createCTA',
            title: 'Create account',
            onClick: onCreateCTA,
          },
        ]}
      />
    </>
  )
}

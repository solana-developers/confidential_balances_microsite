import { FC, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useCreateAssociatedTokenAccountCB } from '../model/use-create-associated-token-account-cb'
import { ModalInitATA } from './modal-init-ata'

type AccountButtonsProps = {
  address: PublicKey
}

export const AccountButtons: FC<AccountButtonsProps> = ({ address }) => {
  const [showInitializeModal, setShowInitializeModal] = useState(false)
  const { mutate: initializeAccount, isPending: isInitializing } =
    useCreateAssociatedTokenAccountCB({ walletAddressPubkey: address })

  return (
    <div>
      <ModalInitATA
        show={showInitializeModal}
        hide={() => setShowInitializeModal(false)}
        address={address}
        initializeAccount={initializeAccount}
        isInitializing={isInitializing}
      />

      <div className="space-x-2">
        <button
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowInitializeModal(true)}
          disabled={isInitializing}
        >
          {isInitializing ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            'Create & Initialize Confidential Balance ATA'
          )}
        </button>
      </div>
    </div>
  )
}

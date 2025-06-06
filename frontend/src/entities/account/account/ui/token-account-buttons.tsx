import { FC, useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { ModalDeposit } from '@/features/deposit-tokens'
import { ModalTransfer } from '@/features/transfer-tokens'
import { ModalWithdraw } from '@/features/withdraw-tokens'
import { useApplyCB } from '../model/use-apply-cb'
import { useHasPendingBalance } from '../model/use-has-pending-balance'

type TokenAccountButtonsProps = {
  address: PublicKey
}

export const TokenAccountButtons: FC<TokenAccountButtonsProps> = ({ address }) => {
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)

  const { mutate: applyPendingBalance, isPending: isApplying } = useApplyCB({
    address,
  })
  const { data: hasPending, isLoading: isPendingLoading } = useHasPendingBalance({
    tokenAccountPubkey: address,
  })

  // Log whenever hasPending changes
  useEffect(() => {
    console.log('TokenAccountButtons: hasPending value changed:', hasPending)
  }, [hasPending])

  return (
    <div>
      <ModalDeposit
        show={showDepositModal}
        hide={() => setShowDepositModal(false)}
        tokenAccountPubkey={address}
      />
      <ModalTransfer
        show={showTransferModal}
        hide={() => setShowTransferModal(false)}
        tokenAccountPubkey={address}
      />
      <ModalWithdraw
        show={showWithdraw}
        hide={() => setShowWithdraw(false)}
        tokenAccountPubkey={address}
      />

      <div className="space-x-2">
        <button
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowDepositModal(true)}
        >
          Deposit
        </button>
        <div className="relative inline-block">
          {hasPending && !isApplying && (
            <div className="absolute -top-3 -right-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500"></span>
              </span>
            </div>
          )}
          <button
            className="btn btn-xs lg:btn-md btn-outline"
            onClick={() => applyPendingBalance()}
            disabled={isApplying}
          >
            {isApplying ? <span className="loading loading-spinner loading-xs"></span> : 'Apply'}
          </button>
          {hasPending && !isApplying && (
            <div className="absolute right-0 -bottom-5 left-0 text-center">
              <span className="text-xs font-semibold text-sky-500">Pending</span>
            </div>
          )}
        </div>
        <button className="btn btn-xs lg:btn-md btn-outline" onClick={() => setShowWithdraw(true)}>
          Withdraw
        </button>
        <button
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowTransferModal(true)}
        >
          Transfer
        </button>
      </div>
    </div>
  )
}

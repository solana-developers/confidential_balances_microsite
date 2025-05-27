import { FC, useEffect, useMemo, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import toast from 'react-hot-toast'
import { Modal } from '@/shared/ui/modal'
import { useGetMintInfo } from '../model/use-get-mint-info'
import { useGetSingleTokenAccount } from '../model/use-get-single-token-account'
import { useWithdrawCB } from '../model/use-withdraw-cb'

type ModalWithdrawProps = {
  show: boolean
  hide: () => void
  tokenAccountPubkey: PublicKey
}

export const ModalWithdraw: FC<ModalWithdrawProps> = ({ show, hide, tokenAccountPubkey }) => {
  const [amount, setAmount] = useState('')
  const withdrawMutation = useWithdrawCB({ tokenAccountPubkey })
  const [decimals, setDecimals] = useState(9) // Default to 9 decimals until we load the actual value

  // Get token account info to extract the mint
  const { data: tokenAccountInfo, isLoading: isTokenAccountLoading } = useGetSingleTokenAccount({
    address: tokenAccountPubkey,
  })

  // Use the mint from the token account to get mint info
  const mintInfoQuery = useGetMintInfo({
    mintAddress: tokenAccountInfo?.tokenAccount?.mint?.toBase58() || '',
    enabled: !!tokenAccountInfo?.tokenAccount?.mint,
  })

  // Update decimals when mint info is available
  useEffect(() => {
    if (mintInfoQuery.data) {
      setDecimals(mintInfoQuery.data.decimals)
    }
  }, [mintInfoQuery.data])

  const handleSubmit = async () => {
    console.log('Withdraw submit button clicked, amount:', amount)

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!tokenAccountInfo?.tokenAccount?.mint) {
      toast.error('Token mint information not available')
      return
    }

    try {
      // Convert to token units based on mint decimals
      const factor = Math.pow(10, decimals)
      const tokenAmount = parseFloat(amount) * factor

      console.log('Withdraw amount in token units:', tokenAmount)

      await withdrawMutation.mutateAsync({
        amount: tokenAmount,
      })
      hide()
      setAmount('')
      toast.success('Withdraw submitted successfully')
    } catch (error) {
      console.error('Withdraw failed:', error)
      toast.error(`Withdraw failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Calculate the token units based on the input amount
  const tokenUnits = useMemo(() => {
    if (!amount) return ''
    const factor = Math.pow(10, decimals)
    return `${parseFloat(amount) * factor} token units`
  }, [amount, decimals])

  // Get the token type from the mint info
  const tokenType = useMemo(() => {
    if (!mintInfoQuery.data) return 'Unknown'
    return mintInfoQuery.data.isToken2022 ? 'Token-2022' : 'Standard Token'
  }, [mintInfoQuery.data])

  const isLoading = isTokenAccountLoading || mintInfoQuery.isLoading

  return (
    <Modal
      hide={hide}
      show={show}
      title="Withdraw from Confidential Balance"
      submitDisabled={!amount || parseFloat(amount) <= 0 || withdrawMutation.isPending || isLoading}
      submitLabel={withdrawMutation.isPending ? 'Processing...' : 'Confirm Withdraw'}
      submit={handleSubmit}
    >
      {isLoading ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner"></span>
          <span className="ml-2">Loading token information...</span>
        </div>
      ) : mintInfoQuery.error ? (
        <div className="flex flex-col gap-2">
          <div className="alert alert-error">
            <p>Error loading token information:</p>
            <p className="text-sm break-all">
              {mintInfoQuery.error instanceof Error ? mintInfoQuery.error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      ) : (
        <div className="form-control">
          <div className="mb-2 text-sm">
            <span className="badge badge-info">{tokenType}</span>
            <span className="badge badge-ghost ml-2">{decimals} decimals</span>
          </div>
          <label className="label">
            <span className="label-text">Amount (Tokens)</span>
          </label>
          <input
            type="number"
            placeholder="Enter amount"
            className="input input-bordered w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={withdrawMutation.isPending}
            step={`${1 / Math.pow(10, decimals)}`} // Step based on mint decimals
            min="0"
            required
          />
          <label className="label">
            <span className="label-text-alt">{tokenUnits}</span>
          </label>
        </div>
      )}
    </Modal>
  )
}

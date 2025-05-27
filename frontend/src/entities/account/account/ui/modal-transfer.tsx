import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { AccountLayout, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import toast from 'react-hot-toast'
import { Modal } from '@/shared/ui/modal'
import { useGetMintInfo } from '../model/use-get-mint-info'
import { useGetSingleTokenAccount } from '../model/use-get-single-token-account'
import { useTransferCB } from '../model/use-transfer-cb'

type ModalTransferProps = {
  show: boolean
  hide: () => void
  address: PublicKey
}

export const ModalTransfer: FC<ModalTransferProps> = ({ show, hide, address }) => {
  // Form state
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [addressType, setAddressType] = useState<'system' | 'token'>('system')

  // Validation state
  const [validationState, setValidationState] = useState({
    isValidating: false,
    error: '',
    isValid: false,
    tokenAccount: null as PublicKey | null,
  })

  // Data fetching
  const { connection } = useConnection()
  const transferMutation = useTransferCB({ senderTokenAccountPubkey: address })
  const { data: tokenAccountInfo, isLoading: isTokenAccountLoading } = useGetSingleTokenAccount({
    address,
  })
  const mintPublicKey = tokenAccountInfo?.tokenAccount?.mint
  const mintInfoQuery = useGetMintInfo({
    mintAddress: mintPublicKey?.toBase58() || '',
    enabled: !!mintPublicKey,
  })
  const decimals = mintInfoQuery.data?.decimals || 9
  const isLoading = isTokenAccountLoading || mintInfoQuery.isLoading

  // Derived values
  const tokenUnits = useMemo(
    () => (amount ? `${parseFloat(amount) * Math.pow(10, decimals)} token units` : ''),
    [amount, decimals]
  )
  const tokenType = useMemo(
    () => (mintInfoQuery.data?.isToken2022 ? 'Token-2022' : 'Standard Token'),
    [mintInfoQuery.data]
  )

  // Define validateRecipient using useCallback before using it in useEffect
  const validateRecipient = useCallback(async () => {
    if (!recipientAddress || !mintPublicKey) return

    setValidationState((prev) => ({
      ...prev,
      isValidating: true,
      error: '',
      tokenAccount: null,
    }))

    try {
      let tokenAccountToCheck: PublicKey

      // Determine account to check based on address type
      if (addressType === 'system') {
        const recipientPublicKey = new PublicKey(recipientAddress)
        tokenAccountToCheck = await getAssociatedTokenAddress(
          mintPublicKey,
          recipientPublicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        )
      } else {
        tokenAccountToCheck = new PublicKey(recipientAddress)
      }

      // Check if account exists
      const accountInfo = await connection.getAccountInfo(tokenAccountToCheck)
      if (!accountInfo) {
        const error =
          addressType === 'system'
            ? "Recipient's token account does not exist. They need to initialize their token account first."
            : 'This token account does not exist.'
        setValidationState((prev) => ({
          ...prev,
          error,
          isValid: false,
          isValidating: false,
        }))
        return
      }

      // For token accounts, validate mint matches
      if (addressType === 'token') {
        try {
          const tokenAccountData = AccountLayout.decode(accountInfo.data)
          const accountMint = new PublicKey(tokenAccountData.mint)

          if (!accountMint.equals(mintPublicKey)) {
            setValidationState((prev) => ({
              ...prev,
              error:
                'This token account is for a different mint. It cannot receive this type of token.',
              isValid: false,
              isValidating: false,
            }))
            return
          }
        } catch (e) {
          setValidationState((prev) => ({
            ...prev,
            error: 'The provided address is not a valid token account.',
            isValid: false,
            isValidating: false,
          }))
          return
        }
      }

      // All validations passed
      setValidationState({
        isValidating: false,
        error: '',
        isValid: true,
        tokenAccount: tokenAccountToCheck,
      })
    } catch (error) {
      console.error('Error validating recipient:', error)
      setValidationState({
        isValidating: false,
        error: error instanceof Error ? error.message : 'Invalid address',
        isValid: false,
        tokenAccount: null,
      })
    }
  }, [recipientAddress, mintPublicKey, setValidationState, addressType, connection])

  // Reset validation when address type changes
  useEffect(() => {
    setValidationState((prev) => ({
      ...prev,
      isValid: false,
      error: '',
      tokenAccount: null,
    }))
    if (recipientAddress && mintPublicKey) validateRecipient()
  }, [addressType, recipientAddress, mintPublicKey, validateRecipient])

  const handleSubmit = async () => {
    if (
      !amount ||
      parseFloat(amount) <= 0 ||
      !validationState.isValid ||
      !validationState.tokenAccount ||
      !mintPublicKey
    ) {
      toast.error('Please complete all fields with valid information')
      return
    }

    try {
      const tokenAmount = parseFloat(amount) * Math.pow(10, decimals)

      await transferMutation.mutateAsync({
        amount: tokenAmount,
        recipientAddress: validationState.tokenAccount.toBase58(),
        mintAddress: mintPublicKey.toBase58(),
      })

      hide()
      setAmount('')
      setRecipientAddress('')
      toast.success('Transfer submitted successfully')
    } catch (error) {
      console.error('Transfer failed:', error)
      toast.error(`Transfer failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <Modal
      hide={hide}
      show={show}
      title="Transfer Confidential Balance"
      submitDisabled={
        !amount ||
        parseFloat(amount) <= 0 ||
        !validationState.isValid ||
        transferMutation.isPending ||
        validationState.isValidating ||
        isLoading
      }
      submitLabel={transferMutation.isPending ? 'Processing...' : 'Confirm Transfer'}
      submit={handleSubmit}
    >
      {isLoading ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner"></span>
          <span className="ml-2">Loading token information...</span>
        </div>
      ) : mintInfoQuery.error ? (
        <div className="alert alert-error">
          <p>Error loading token information</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="mb-2 text-sm">
              <span className="badge badge-info">{tokenType}</span>
              <span className="badge badge-ghost ml-2">{decimals} decimals</span>
            </div>
          </div>

          {/* Address Type Selection */}
          <div className="form-control mb-4">
            <label className="label justify-start">
              <span className="label-text mr-4">Recipient:</span>
              <div className="flex space-x-4">
                <label className="flex cursor-pointer items-center">
                  <input
                    type="radio"
                    name="address-type"
                    className="radio radio-sm radio-primary mr-2"
                    checked={addressType === 'system'}
                    onChange={() => setAddressType('system')}
                  />
                  <span className="label-text">Wallet</span>
                </label>
                <label className="flex cursor-pointer items-center">
                  <input
                    type="radio"
                    name="address-type"
                    className="radio radio-sm radio-primary mr-2"
                    checked={addressType === 'token'}
                    onChange={() => setAddressType('token')}
                  />
                  <span className="label-text">Token Account</span>
                </label>
              </div>
            </label>
          </div>

          {/* Recipient Address Input */}
          <div className="form-control mb-4">
            <input
              type="text"
              placeholder={
                addressType === 'system' ? "Recipient's wallet address" : 'Token account address'
              }
              className={`input input-bordered w-full ${
                validationState.isValid
                  ? 'input-success'
                  : validationState.error
                    ? 'input-error'
                    : ''
              }`}
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              disabled={transferMutation.isPending}
            />

            {validationState.isValidating && (
              <label className="label">
                <span className="label-text-alt">
                  <span className="loading loading-spinner loading-xs mr-1"></span>
                  Validating...
                </span>
              </label>
            )}

            {validationState.error && (
              <label className="label">
                <span className="label-text-alt text-error">{validationState.error}</span>
              </label>
            )}

            {validationState.isValid && (
              <label className="label">
                <span className="label-text-alt text-success">
                  ✓{' '}
                  {addressType === 'system'
                    ? 'Valid wallet with initialized token account'
                    : 'Valid token account'}
                </span>
              </label>
            )}
          </div>

          {/* Amount Input */}
          <div className="form-control">
            <input
              type="number"
              placeholder="Amount (tokens)"
              className="input input-bordered w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={transferMutation.isPending}
              step={`${1 / Math.pow(10, decimals)}`}
              min="0"
              required
            />
            {tokenUnits && (
              <label className="label">
                <span className="label-text-alt">{tokenUnits}</span>
              </label>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}

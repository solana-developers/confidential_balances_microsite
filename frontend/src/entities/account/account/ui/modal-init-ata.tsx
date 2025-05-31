import { FC, useEffect, useState } from 'react'
import { Form, FormField } from '@hoodieshq/ms-tools-ui'
import { PublicKey } from '@solana/web3.js'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FormItemInput } from '@/shared/ui/form'
import { Modal } from '@/shared/ui/modal'

type ModalInitATAProps = {
  show: boolean
  hide: () => void
  address: PublicKey
  initializeAccount: (params: { mintAddress: string }) => void
  isInitializing: boolean
}

export const ModalInitATA: FC<ModalInitATAProps> = ({
  show,
  hide,
  address,
  initializeAccount,
  isInitializing,
}) => {
  const [mintAddress, setMintAddress] = useState('')
  const [validMintAddress, setValidMintAddress] = useState(false)

  const form = useForm()

  // Validate the input mint address when it changes
  useEffect(() => {
    // Only validate when we have a string that's the right length for a base58 Solana address (typically 32-44 chars)
    if (mintAddress.length >= 32 && mintAddress.length <= 44) {
      try {
        // Try to create a PublicKey to validate the address
        new PublicKey(mintAddress)
        setValidMintAddress(true)
      } catch (error) {
        setValidMintAddress(false)
      }
    } else {
      setValidMintAddress(false)
    }
  }, [mintAddress])

  const handleSubmit = () => {
    if (!validMintAddress) {
      toast.error('Please enter a valid mint address')
      return
    }

    try {
      initializeAccount({ mintAddress })
      hide()
      toast.success('Initialize ATA transaction submitted')
    } catch (error) {
      console.error('Initialize ATA failed:', error)
      toast.error(
        `Initialize ATA failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  return (
    <Modal
      hide={hide}
      show={show}
      title="Initialize Associated Token Account"
      submitDisabled={!validMintAddress || isInitializing}
      submitLabel={isInitializing ? 'Processing...' : 'Initialize'}
      submit={handleSubmit}
    >
      <Form {...form}>
        <form>
          <div className="form-control">
            {/* TBC */}
            {/* <input
              type="text"
              placeholder="Enter Solana mint address in base58"
              className={`input input-bordered w-full ${
                validMintAddress ? 'input-success' : mintAddress ? 'input-error' : ''
              }`}
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
              disabled={isInitializing}
            /> */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItemInput label="Amount (tokens)" className="color-red" {...field} />
              )}
            ></FormField>
            {mintAddress && !validMintAddress && (
              <label className="label">
                <span className="label-text-alt text-error">Invalid mint address format</span>
              </label>
            )}
          </div>

          <div className="text-base-content/70 mt-4 text-sm">
            <p>
              This will create an Associated Token Account (ATA) for this mint address with your
              wallet as the owner.
            </p>
          </div>
        </form>
      </Form>
    </Modal>
  )
}

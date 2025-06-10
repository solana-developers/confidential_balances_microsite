import { FC, useCallback } from 'react'
import { Form, FormField } from '@solana-foundation/ms-tools-ui'
import { PublicKey } from '@solana/web3.js'
import { useForm } from 'react-hook-form'
import { FormItemInput } from '@/shared/ui/form'
import { Modal } from '@/shared/ui/modal'
import { useToast } from '@/shared/ui/toast'

type ModalInitATAProps = {
  show: boolean
  hide: () => void
  initializeAccount: (params: { mintAddress: string }) => void
  isInitializing: boolean
  onSuccess?: () => void
  onError?: () => void
}

type FormData = {
  mintAddress: string
}

export const ModalMintToken: FC<ModalInitATAProps> = ({
  show,
  hide,
  initializeAccount,
  isInitializing,
  onSuccess,
  onError,
}) => {
  const toast = useToast()

  const form = useForm<FormData>({
    defaultValues: {
      mintAddress: undefined,
    },
    mode: 'onChange',
  })

  // const mintAddress = form.watch('mintAddress')
  const {
    formState: { isValid },
  } = form

  const validateMintAddress = (value: string) => {
    if (!value) {
      return 'Mint address is required'
    }

    if (value.length < 32 || value.length > 44) {
      return 'Invalid mint address format'
    }

    try {
      new PublicKey(value)
      return true
    } catch (error) {
      return 'Invalid mint address format'
    }
  }

  const handleSubmit = useCallback(() => {
    const formValues = form.getValues()

    if (!isValid) {
      toast.error('Please enter a valid mint address')
      return
    }

    // NOTE: consider moving toast interactions out of modal component to make it less "dirty"
    try {
      initializeAccount({ mintAddress: formValues.mintAddress })
      hide()
      form.reset()
      toast.success('Mint token transaction submitted')
      onSuccess?.()
    } catch (error) {
      console.error('Mint token failed:', error)
      onError?.()
      toast.error(`Mint token failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [initializeAccount, hide, form, onSuccess, onError, isValid, toast])

  return (
    <Modal
      hide={hide}
      show={show}
      title="Mint token"
      submitDisabled={!isValid || isInitializing}
      submitLabel={isInitializing ? 'Processing...' : 'Initialize'}
      submit={handleSubmit}
    >
      <Form {...form}>
        <form>
          <div className="form-control">
            <FormField
              control={form.control}
              name="mintAddress"
              rules={{
                validate: validateMintAddress,
              }}
              render={({ field }: { field: any }) => (
                <FormItemInput
                  label="Mint Address"
                  placeholder="Enter mint address"
                  className="overflow-hidden text-ellipsis"
                  disabled={isInitializing}
                  {...field}
                />
              )}
            />
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

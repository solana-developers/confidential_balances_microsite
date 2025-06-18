import { FC, useCallback } from 'react'
import { Button } from '@solana-foundation/ms-tools-ui/components/button'
import { Form, FormField } from '@solana-foundation/ms-tools-ui/components/form'
import { PublicKey } from '@solana/web3.js'
import { useAtomValue } from 'jotai'
import { useForm } from 'react-hook-form'
import { FormItemTextarea } from '@/shared/ui/form'
import { Modal } from '@/shared/ui/modal'
import { useToast } from '@/shared/ui/toast'
import { latestMintAddressAtom } from '../model/latest-mint-address'

type ModalInitATAProps = {
  show: boolean
  hide: () => void
  initializeAccount: (_params: { mintAddress: string }) => void
  isInitializing: boolean
  label?: string
  onSuccess?: () => void
  onError?: () => void
}

type FormData = {
  mintAddress: string
}

export const ModalInitATA: FC<ModalInitATAProps> = ({
  show,
  hide,
  initializeAccount,
  isInitializing,
  label,
  onSuccess,
  onError,
}) => {
  const toast = useToast()
  const latestMintAddress = useAtomValue(latestMintAddressAtom)

  const form = useForm<FormData>({
    defaultValues: {
      mintAddress: '',
    },
    mode: 'onChange',
  })

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

    try {
      initializeAccount({ mintAddress: formValues.mintAddress })
      hide()
      form.reset()
      toast.success('Initialize ATA transaction submitted')
      onSuccess?.()
    } catch (error) {
      console.error('Initialize ATA failed:', error)
      onError?.()
      toast.error(
        `Initialize ATA failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }, [initializeAccount, hide, form, onSuccess, onError, isValid, toast])

  return (
    <Modal
      hide={hide}
      show={show}
      title="Initialize Associated Token Account"
      footerAdditional={
        latestMintAddress ? (
          <Button
            variant="outline"
            onClick={() => {
              form.setValue('mintAddress', latestMintAddress)
              form.trigger('mintAddress')
            }}
          >
            Use last created mint
          </Button>
        ) : undefined
      }
      submitDisabled={!isValid || isInitializing}
      submitLabel={isInitializing ? 'Processing...' : (label ?? 'Initialize')}
      submit={handleSubmit}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="form-control">
            <FormField
              control={form.control}
              name="mintAddress"
              rules={{
                validate: validateMintAddress,
              }}
              render={({ field }) => (
                <FormItemTextarea
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

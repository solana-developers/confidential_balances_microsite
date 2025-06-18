import { FC, useCallback } from 'react'
import { Button } from '@solana-foundation/ms-tools-ui/components/button'
import { Form, FormField } from '@solana-foundation/ms-tools-ui/components/form'
import { PublicKey } from '@solana/web3.js'
import { useAtomValue } from 'jotai'
import { useForm } from 'react-hook-form'
import { latestMintAddressAtom } from '@/entities/account/account/model/latest-mint-address'
import { FormItemInput, FormItemTextarea } from '@/shared/ui/form'
import { Modal } from '@/shared/ui/modal'
import { useToast } from '@/shared/ui/toast'

type ModalMintTokenProps = {
  show: boolean
  hide: () => void
  initializeAccount: (_params: { mintAddress: string; mintAmount: number }) => void
  isInitializing: boolean
  label?: string
  onSuccess?: () => void
  onError?: () => void
}

type FormData = {
  mintAddress: string
  mintAmount: string
}

export const ModalMintToken: FC<ModalMintTokenProps> = ({
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
      mintAmount: '0',
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

  const validateMintAmount = (value: number | string) => {
    let amount = Number(value)

    if (isNaN(amount)) return 'Invalid format'

    if (!amount || amount <= 0) {
      return 'Mint amount required'
    }

    return true
  }

  const handleSubmit = useCallback(() => {
    const formValues = form.getValues()

    if (!isValid) {
      toast.error('Please enter a valid mint address')
      return
    }

    // NOTE: consider moving toast interactions out of modal component to make them less "dirty"
    try {
      initializeAccount({
        mintAddress: formValues.mintAddress,
        mintAmount: Number(formValues.mintAmount),
      })
      hide()
      form.reset()
      toast.info('Mint token transaction submitted')
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
      submitLabel={isInitializing ? 'Processing...' : (label ?? 'Mint Token')}
      submit={handleSubmit}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="mintAddress"
              rules={{
                validate: validateMintAddress,
              }}
              render={({ field }: { field: any }) => (
                <FormItemTextarea
                  label="Mint Address"
                  placeholder="Enter mint address"
                  className="overflow-hidden text-ellipsis"
                  disabled={isInitializing}
                  {...field}
                />
              )}
            />
            <FormField
              control={form.control}
              name="mintAmount"
              rules={{
                validate: validateMintAmount,
              }}
              render={({ field }: { field: any }) => (
                <FormItemInput
                  type="number"
                  label="Mint Amount"
                  min={0}
                  step={1}
                  placeholder="Enter amount"
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

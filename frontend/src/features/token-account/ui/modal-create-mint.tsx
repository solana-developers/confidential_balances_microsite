import { FC, useCallback } from 'react'
import { Form, FormField } from '@solana-foundation/ms-tools-ui'
import { useForm } from 'react-hook-form'
import { FormItemTextarea } from '@/shared/ui/form'
import { Modal } from '@/shared/ui/modal'
import { useToast } from '@/shared/ui/toast'

type ModalCreateMintProps = {
  show: boolean
  hide: () => void
  submitCallback: (_params: { auditorAddress: string }) => void
  isProcessing: boolean
  label?: string
  onSuccess?: () => void
  onError?: () => void
}

type FormData = {
  auditorAddress: string
}

export const ModalCreateMint: FC<ModalCreateMintProps> = ({
  show,
  hide,
  submitCallback,
  isProcessing,
  label,
  onSuccess,
  onError,
}) => {
  const toast = useToast()

  const form = useForm<FormData>({
    defaultValues: {
      auditorAddress: undefined,
    },
    mode: 'onChange',
  })

  const {
    formState: { isValid },
  } = form

  const validateAuditorAddress = (value?: string) => {
    if (!value) return true

    if (value && value.length < 32) {
      return 'Invalid auditor address format'
    }

    return true
  }

  const handleSubmit = useCallback(() => {
    const formValues = form.getValues()

    if (!isValid) {
      toast.error('Please enter a valid address')
      return
    }

    try {
      submitCallback({ auditorAddress: formValues.auditorAddress })
      hide()
      form.reset()
      toast.info('Create mint transaction submitted')
      onSuccess?.()
    } catch (error) {
      console.error('Create mint failed:', error)
      onError?.()
      toast.error(`Create mint failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [submitCallback, hide, form, onSuccess, onError, isValid, toast])

  return (
    <Modal
      hide={hide}
      show={show}
      title="Create Mint"
      submitDisabled={isProcessing}
      submitLabel={isProcessing ? 'Processing...' : (label ?? 'Initialize')}
      submit={handleSubmit}
    >
      <Form {...form}>
        <form>
          <div className="form-control">
            <FormField
              control={form.control}
              name="auditorAddress"
              rules={{
                validate: validateAuditorAddress,
              }}
              render={({ field }) => (
                <FormItemTextarea
                  label="Auditor Address"
                  placeholder="Enter auditor address"
                  className="overflow-hidden text-ellipsis"
                  disabled={isProcessing}
                  {...field}
                />
              )}
            />
          </div>
          <div className="text-base-content/70 mt-4 text-sm">
            <p>This will create a Mint with random address with your wallet</p>
            <p>as the `mintAuthority`and an auditor (if address is present) .</p>
          </div>
        </form>
      </Form>
    </Modal>
  )
}

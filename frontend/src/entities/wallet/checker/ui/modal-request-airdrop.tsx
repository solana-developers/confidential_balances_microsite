import { FC } from 'react'
import { Form, FormField } from '@solana-foundation/ms-tools-ui'
import { PublicKey } from '@solana/web3.js'
import { useForm } from 'react-hook-form'
import { FormItemInput } from '@/shared/ui/form'
import { Modal } from '@/shared/ui/modal'
import { useToast } from '@/shared/ui/toast'
import { useRequestAirdrop } from '../model/use-request-airdrop'

type ModalRequestAirdropProps = {
  hide: () => void
  show: boolean
  address: PublicKey
}

type FormValues = {
  amount: number
}

export const ModalRequestAirdrop: FC<ModalRequestAirdropProps> = ({ hide, show, address }) => {
  const toast = useToast()
  const mutation = useRequestAirdrop({ address })

  const form = useForm<FormValues>({
    defaultValues: {
      amount: 1,
    },
    mode: 'onChange',
  })

  const {
    formState: { isSubmitting, isValid },
  } = form

  const handleSubmit = async (values: FormValues) => {
    if (values.amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await mutation.mutateAsync(values.amount)
      toast.success('Airdrop requested')
      hide()
    } catch (error) {
      console.error('Airdrop failed:', error)
      toast.error(`Airdrop failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <Modal
      hide={hide}
      show={show}
      title="Airdrop"
      submitDisabled={!isValid || isSubmitting}
      submitLabel={isSubmitting ? 'Processing...' : 'Request Airdrop'}
      submit={form.handleSubmit(handleSubmit)}
    >
      <Form {...form}>
        <p>Request airdrop to your account</p>

        <FormField
          control={form.control}
          name="amount"
          rules={{
            required: 'Amount is required',
            min: {
              value: 1,
              message: 'Amount must be greater than 0',
            },
          }}
          render={({ field }) => (
            <FormItemInput
              type="number"
              label="Amount (tokens)"
              disabled={isSubmitting}
              {...field}
              onChange={(e) => field.onChange(e.target.valueAsNumber)}
            />
          )}
        />
      </Form>
    </Modal>
  )
}

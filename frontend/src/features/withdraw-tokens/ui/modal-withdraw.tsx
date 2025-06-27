import { FC } from 'react'
import { Form, FormField } from '@solana-foundation/ms-tools-ui/components/form'
import { PublicKey } from '@solana/web3.js'
import { Send } from 'lucide-react'
import pluralize from 'pluralize'
import { useForm } from 'react-hook-form'
import { useCurrentBalance, useMint } from '@/entities/account/account'
import { Content } from '@/shared/ui/content'
import { FormItemInput } from '@/shared/ui/form'
import { Modal } from '@/shared/ui/modal'
import { useToast } from '@/shared/ui/toast'
import { useWithdrawCB } from '../model/use-withdraw-cb'

type ModalWithdrawProps = {
  show: boolean
  hide: () => void
  tokenAccountPubkey: PublicKey
}

type FormValues = {
  amount: string
}

export const ModalWithdraw: FC<ModalWithdrawProps> = ({ show, hide, tokenAccountPubkey }) => {
  const toast = useToast()
  const withdrawMutation = useWithdrawCB({ tokenAccountPubkey })

  const { balance, loading } = useCurrentBalance()
  const { tokenAccount, mintInfo, error, isLoading } = useMint(tokenAccountPubkey)

  const form = useForm<FormValues>({
    defaultValues: {
      amount: '0',
    },
    mode: 'onChange',
  })

  const {
    formState: { isSubmitting, isValid },
  } = form

  const decimals = mintInfo?.decimals ?? 9 // Default to 9 decimals until we load the actual value

  const handleSubmit = async (values: FormValues) => {
    const amount = Number(values.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!tokenAccount?.mint) {
      toast.error('Token mint information not available')
      return
    }

    try {
      // Convert to token units based on mint decimals
      const factor = Math.pow(10, decimals)
      const tokenAmount = amount * factor

      await withdrawMutation.mutateAsync({
        amount: tokenAmount,
      })

      hide()
      form.reset()
      toast.success('Withdraw submitted successfully')
    } catch (error) {
      console.error('Withdraw failed:', error)
      toast.error(`Withdraw failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <Modal
      hide={hide}
      show={show}
      title="Withdraw from Confidential Balance"
      icon={<Send />}
      submitDisabled={!isValid || isSubmitting || isLoading}
      submitLabel={isSubmitting ? 'Processing...' : 'Confirm Withdraw'}
      submit={form.handleSubmit(handleSubmit)}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Content
            isLoading={isLoading}
            error={error}
            loadingMessage="Loading token information..."
            errorMessage="Error loading token information:"
          >
            <p>Withdraw tokens from your confidential balance to current token account</p>

            <FormField
              control={form.control}
              name="amount"
              rules={{
                required: 'Amount is required',
                min: {
                  value: 0.0000000001,
                  message: 'Amount must be greater than 0',
                },
                max:
                  balance && !loading
                    ? {
                        value: balance,
                        message: 'Amount must be less than or equal to the current balance',
                      }
                    : undefined,
              }}
              render={({ field }) => (
                <FormItemInput
                  type="number"
                  label="Amount (tokens)"
                  hint={balance && !loading ? `Max: ${pluralize('token', balance, true)}` : ''}
                  disabled={isSubmitting}
                  step={0.01}
                  min={0}
                  max={balance && !loading ? balance : undefined}
                  {...field}
                />
              )}
            />
          </Content>
        </form>
      </Form>
    </Modal>
  )
}

import { FC } from 'react'
import { Form, FormField } from '@solana-foundation/ms-tools-ui'
import { PublicKey } from '@solana/web3.js'
import pluralize from 'pluralize'
import { useForm } from 'react-hook-form'
import { useMint } from '@/entities/account/account'
import { Content } from '@/shared/ui/content'
import { FormItemInput } from '@/shared/ui/form'
import { Modal } from '@/shared/ui/modal'
import { useToast } from '@/shared/ui/toast'
import { useDepositCb } from '../model/use-deposit-cb'

type ModalDepositProps = {
  show: boolean
  hide: () => void
  tokenAccountPubkey: PublicKey
}

type FormValues = {
  amount: number
}

export const ModalDeposit: FC<ModalDepositProps> = ({ show, hide, tokenAccountPubkey }) => {
  const toast = useToast()
  const depositMutation = useDepositCb({ tokenAccountPubkey })

  const { tokenAccount, mintInfo, error, isLoading } = useMint(tokenAccountPubkey)

  const form = useForm<FormValues>({
    defaultValues: {
      amount: 0,
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

    if (!tokenAccount?.mint) {
      toast.error('Token mint information not available')
      return
    }

    try {
      // Convert to token units based on mint decimals
      const factor = Math.pow(10, decimals)
      const tokenAmount = (values.amount * factor).toString()

      await depositMutation.mutateAsync({
        lamportAmount: tokenAmount,
      })

      toast.success('Deposit submitted successfully')

      hide()
      form.reset()
    } catch (error) {
      console.error('Deposit failed:', error)
      toast.error(`Deposit failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const amount = form.watch('amount')
  const decimals = mintInfo?.decimals ?? 9 // Default to 9 decimals until we load the actual value
  const tokenType = mintInfo ? (mintInfo.isToken2022 ? 'Token-2022' : 'Standard Token') : '' // Token type from the mint info
  const tokenUnits = amount ? pluralize('token unit', amount * Math.pow(10, decimals), true) : '' // Token units based on the input amount

  return (
    <Modal
      hide={hide}
      show={show}
      title="Deposit to Confidential Balance"
      submitDisabled={!isValid || isSubmitting || isLoading}
      submitLabel={isSubmitting ? 'Processing...' : 'Confirm Deposit'}
      submit={form.handleSubmit(handleSubmit)}
    >
      <Form {...form}>
        <Content
          isLoading={isLoading}
          error={error}
          loadingMessage="Loading token information..."
          errorMessage="Error loading token information:"
        >
          <p>Deposit tokens from your account to current confidential balance</p>

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
                description={tokenUnits}
                hint={[tokenType, pluralize('decimal', decimals, true)]
                  .filter((x) => !!x)
                  .join(', ')}
                disabled={isSubmitting}
                step={1 / Math.pow(10, decimals)}
                {...field}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
            )}
          />
        </Content>
      </Form>
    </Modal>
  )
}

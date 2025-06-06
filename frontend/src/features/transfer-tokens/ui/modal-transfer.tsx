import { FC, useCallback, useState } from 'react'
import { Form, FormField } from '@solana-foundation/ms-tools-ui'
import { AccountLayout, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useAtomValue } from 'jotai'
import * as Icons from 'lucide-react'
import pluralize from 'pluralize'
import { useForm } from 'react-hook-form'
import { useMint } from '@/entities/account/account'
import { devModeOpenAtom } from '@/entities/dev-mode'
import { Content } from '@/shared/ui/content'
import { FormItemInput } from '@/shared/ui/form'
import { Modal } from '@/shared/ui/modal'
import { Selector, SelectorItem } from '@/shared/ui/selector'
import { useToast } from '@/shared/ui/toast'
import { useTransferCB } from '../model/use-transfer-cb'

type ModalTransferProps = {
  show: boolean
  hide: () => void
  tokenAccountPubkey: PublicKey
}

type FormValues = {
  amount: number
  recipientAddress: string
  addressType: 'system' | 'token'
}

export const ModalTransfer: FC<ModalTransferProps> = ({ show, hide, tokenAccountPubkey }) => {
  const toast = useToast()
  const { connection } = useConnection()
  const devMode = useAtomValue(devModeOpenAtom)
  const transferMutation = useTransferCB({ senderTokenAccountPubkey: tokenAccountPubkey })

  const [resolvedTokenAccount, setResolvedTokenAccount] = useState<PublicKey | null>(null)

  const form = useForm<FormValues>({
    defaultValues: {
      amount: 0,
      recipientAddress: '',
      addressType: 'system',
    },
    mode: 'onChange',
  })

  const {
    formState: { isSubmitting, isValid },
  } = form

  const { tokenAccount, mintInfo, error, isLoading } = useMint(tokenAccountPubkey)

  const mintPublicKey = tokenAccount?.mint

  const validateRecipient = useCallback(
    async (recipientAddress: string, values: FormValues) => {
      if (!mintPublicKey) return 'Token mint information not available'
      if (!recipientAddress) return 'Wallet address is required'

      setResolvedTokenAccount(null)

      try {
        let tokenAccountToCheck: PublicKey
        // Determine account to check based on address type
        if (values.addressType === 'system') {
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
          return values.addressType === 'system'
            ? "Recipient's token account does not exist. They need to initialize their token account first."
            : 'This token account does not exist.'
        }

        // For token accounts, validate mint matches
        if (values.addressType === 'token') {
          try {
            const tokenAccountData = AccountLayout.decode(accountInfo.data)
            const accountMint = new PublicKey(tokenAccountData.mint)
            if (!accountMint.equals(mintPublicKey)) {
              return 'This token account is for a different mint. It cannot receive this type of token.'
            }
          } catch (e) {
            return 'The provided address is not a valid token account.'
          }
        }

        // All validations passed
        setResolvedTokenAccount(tokenAccountToCheck)
        return true
      } catch (error) {
        console.error('Error validating recipient:', error)
        return error instanceof Error ? error.message : 'Invalid address'
      }
    },
    [mintPublicKey, connection, setResolvedTokenAccount]
  )

  const handleSubmit = async (values: FormValues) => {
    if (values.amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!tokenAccount?.mint) {
      toast.error('Token mint information not available')
      return
    }

    if (!resolvedTokenAccount) {
      toast.error('Invalid address')
      return
    }

    try {
      const tokenAmount = values.amount * Math.pow(10, decimals)
      await transferMutation.mutateAsync({
        amount: tokenAmount,
        recipientAddress: resolvedTokenAccount.toBase58(),
        mintAddress: tokenAccount?.mint.toBase58(),
      })

      toast.success('Transfer submitted successfully')

      hide()
      form.reset()
    } catch (error) {
      console.error('Transfer failed:', error)
      toast.error(`Transfer failed: ${error instanceof Error ? error.message : String(error)}`)
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
      title="Transfer Confidential Balance"
      submitDisabled={!isValid || isSubmitting || isLoading}
      submitLabel={isSubmitting ? 'Processing...' : 'Confirm Transfer'}
      submit={form.handleSubmit(handleSubmit)}
    >
      <Form {...form}>
        <Content
          isLoading={isLoading}
          error={error}
          loadingMessage="Loading token information..."
          errorMessage="Error loading token information:"
        >
          <p>
            Transfer tokens from your account to a wallet account with confidential balance set up
          </p>

          {devMode && (
            <FormField
              control={form.control}
              name="addressType"
              render={({ field }) => (
                <Selector value={field.value} onValueChange={(value) => field.onChange(value)}>
                  <SelectorItem value="system">
                    <Icons.Wallet />
                    Wallet
                  </SelectorItem>
                  <SelectorItem value="token">
                    <Icons.Coins />
                    Token Account
                  </SelectorItem>
                </Selector>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="recipientAddress"
            rules={{
              required: 'Address is required',
              validate: validateRecipient,
            }}
            render={({ field }) => (
              <FormItemInput
                label={
                  form.watch('addressType') === 'system'
                    ? 'Wallet address'
                    : 'Token account address'
                }
                disabled={isSubmitting}
                {...field}
              />
            )}
          />

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

import { FC, useCallback, useId } from 'react'
import { Address } from '@solana-foundation/ms-tools-ui/components/address'
import { Button } from '@solana-foundation/ms-tools-ui/components/button'
import { Form, FormField } from '@solana-foundation/ms-tools-ui/components/form'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Loader, Lock, Unlock, Wallet } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Content } from '@/shared/ui/content'
import { FormItemInput, FormItemTextarea } from '@/shared/ui/form'
import { useCreateElGamalKey } from '../model/use-create-elgamal-key'
import { useDecryptAuditableTx } from '../model/use-decrypt-auditable-tx'

type FormValues = {
  transaction: string
}

type AuditTransactionProps = {
  tx?: string
}

export const AuditTransaction: FC<AuditTransactionProps> = ({ tx }) => {
  const { connected, publicKey } = useWallet()
  const { setVisible } = useWalletModal()
  const { generateElGamalKey, isGenerating, elGamalPubkey } = useCreateElGamalKey()

  // add unique key to make invalidation work better
  const inputKey = useId()

  const { auditTransaction, isAuditing, auditResult, reset: auditReset } = useDecryptAuditableTx()

  const form = useForm<FormValues>({
    defaultValues: { transaction: tx ?? '' },
    mode: 'onChange',
  })

  const {
    formState: { isSubmitting },
  } = form

  const handleConnectWallet = useCallback(() => {
    setVisible(true)
  }, [setVisible])

  const handleDecryptBalance = useCallback(() => {
    const values = form.getValues()
    auditTransaction(values.transaction)
  }, [form, auditTransaction])

  const handleCreateAudKey = useCallback(() => {
    generateElGamalKey()
  }, [generateElGamalKey])

  const isWalletConnected = connected && Boolean(publicKey)

  return (
    <Form {...form}>
      <Content>
        <p>Decrypt transfer amounts of transactions with the confidential transfer auditor key</p>

        <FormField
          control={form.control}
          name="transaction"
          rules={{
            required: 'Transaction hash is required',
          }}
          render={({ field }) => (
            <FormItemTextarea label="Transaction hash" disabled={isSubmitting} {...field} />
          )}
        />

        {auditResult?.uiAmount ? (
          <FormItemInput
            key={`input-${inputKey}-${auditResult.amount ?? ''}`}
            label="Amount (with lamports)"
            disabled={true}
            value={auditResult.uiAmount}
            icon={<Unlock />}
          />
        ) : (
          <FormItemInput
            key="input-empty-amount"
            label="Amount (with lamports)"
            disabled={true}
            placeholder="$$$$$"
            icon={isAuditing ? <Loader /> : <Lock />}
          />
        )}

        {!isWalletConnected ? (
          <Button onClick={handleConnectWallet}>
            <Wallet />
            Connect auditor wallet
          </Button>
        ) : (
          <Button
            onClick={handleDecryptBalance}
            disabled={Boolean(auditResult) || !form.getValues().transaction}
          >
            {isAuditing ? <Loader /> : <Wallet />}
            Decode transaction balance
          </Button>
        )}
        <div className="mt-5 flex flex-row gap-2 overflow-hidden">
          {elGamalPubkey ? (
            <div className="flex h-[26px] items-center">
              <Address address={elGamalPubkey} truncateChars={32} />
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateAudKey}
              disabled={isGenerating}
            >
              Generate auditor&lsquo;s key
            </Button>
          )}
          {Boolean(auditResult) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                auditReset()
                form.setValue('transaction', '')
              }}
            >
              Clear
            </Button>
          ) : undefined}
        </div>
      </Content>
    </Form>
  )
}

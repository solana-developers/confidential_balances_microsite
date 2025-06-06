import { FC } from 'react'
import { Button } from '@solana-foundation/ms-tools-ui'
import { NATIVE_MINT } from '@solana/spl-token'
import { WalletAccountHeader } from '@/entities/account-header'
import { useDevMode } from '@/entities/dev-mode/model/dev-mode-items'
import { useOperationLog } from '@/entities/operation-log'
import { TokenAccounts } from '@/features/token-account/token-accounts'
import { CardStep } from '@/shared/ui/card-step'
import { Text } from '@/shared/ui/text'
import { useToast } from '@/shared/ui/toast'

export const Dashboard: FC = () => {
  const { push } = useOperationLog()
  const { set } = useDevMode()
  const toast = useToast()

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Text variant="header1">Confidential balances demo</Text>
        <Text>
          Transfer tokens confidentially on Solana. An end-to-end demonstration of encrypted token
          transfers using Solana&apos;s Confidential Transfer extension
        </Text>
      </div>
      <div className="@container/cards">
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 @3xl/cards:grid-cols-12">
          <CardStep
            step={1}
            title="Create test account"
            description="Receive 1000 free tokens in your account for testing purposes"
            className="col-span-3"
          />
          <CardStep
            step={2}
            title="Deposit tokens"
            description="Deposit tokens into a confidential balance to start experimenting"
            className="col-span-3"
          />
          <CardStep
            step={3}
            title="Try transfer or withdraw"
            description="Transfer or withdraw tokens from confidential balances"
            className="col-span-3"
          />
          <CardStep
            step={4}
            title="Go into dev mode"
            description="Want to see how it all works under the hood? Check out dev mode for more info"
            className="col-span-3"
          />
        </div>
      </div>
      <div>
        <Text variant="textSmall">
          Your encryption keys (ElGamal & AES) are generated securely from your wallet signature and
          used only during your session. They are never stored, logged, or shared — and are
          discarded immediately after use.
        </Text>
      </div>
      <WalletAccountHeader address={NATIVE_MINT} className="mt-12 mb-5" />
      <TokenAccounts />
      <div className="flex gap-2">
        {/* TODO: Just for testing purposes, remove later */}
        <Button
          variant="outline"
          onClick={() => {
            push(operations[Math.floor(Math.random() * operations.length)])
          }}
        >
          Add random log entry
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            set(1, devModeItems[Math.floor(Math.random() * devModeItems.length)])
          }}
        >
          Mark step 1
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            set(2, devModeItems[Math.floor(Math.random() * operations.length)])
          }}
        >
          Mark step 2
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            set(3, devModeItems[Math.floor(Math.random() * operations.length)])
          }}
        >
          Mark step 3
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            set(4, devModeItems[Math.floor(Math.random() * operations.length)])
          }}
        >
          Mark step 4
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            set(5, devModeItems[Math.floor(Math.random() * operations.length)])
          }}
        >
          Mark step 5
        </Button>
      </div>
    </section>
  )
}

const operations: {
  title: string
  content: string
  variant: 'success' | 'error' | 'muted'
}[] = [
  {
    title: 'Transfer Operation - COMPLETE',
    content: `Txn5x8f [SUCCESS]\n  ConfidentialTransferInstruction::Transfer\n    Note: Transferred 45.8 tokens to recipient`,
    variant: 'success',
  },
  {
    title: 'Withdraw Operation - FAILED',
    content: `TxnA2d9 [ERROR]\n  ConfidentialTransferInstruction::Withdraw\n    Note: Insufficient confidential balance`,
    variant: 'error',
  },
  {
    title: 'Deposit Operation - COMPLETE',
    content: `Txn7c3e [SUCCESS]\n  ConfidentialTransferInstruction::Deposit\n    Note: Deposited 120.5 tokens`,
    variant: 'success',
  },
  {
    title: 'Transfer Operation - PENDING',
    content: `TxnF9b2 [PENDING]\n  ConfidentialTransferInstruction::Transfer\n    Note: Transferring 25 tokens`,
    variant: 'muted',
  },
  {
    title: 'Withdraw Operation - COMPLETE',
    content: `Txn3k8m [SUCCESS]\n  ConfidentialTransferInstruction::Withdraw\n    Note: Withdrew 67.2 tokens to public balance`,
    variant: 'success',
  },
  {
    title: 'Deposit Operation - FAILED',
    content: `TxnP4h6 [ERROR]\n  ConfidentialTransferInstruction::Deposit\n    Note: Transaction rejected - insufficient public balance`,
    variant: 'error',
  },
]

const devModeItems: {
  title: string
  result: string
  success: boolean
}[] = [
  {
    title: 'Token created',
    result:
      'Creating token...\nAddress: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA\nDecimals: 9\nSignature: 5KNwqUzKS4M7c8PZ9VzQJ2h9RxB45nD...',
    success: true,
  },
  {
    title: 'Account created',
    result:
      'Creating account for token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA...\nAccount: 9YqFgzWEPhtJ45LC8Nz2VgcP3KyB4m2\nSignature: 2HvNqRkM4t6X8wYs3DpL9BcWxA7uZnP...',
    success: true,
  },
  {
    title: 'Tokens minted',
    result:
      'Minting 1000 tokens to account 9YqFgzWEPhtJ45LC8Nz2VgcP3KyB4m2...\nSignature: 4RmTyKpN8v2Q9XjH6LcS3WdVxB9nMhE...',
    success: true,
  },
  {
    title: 'Confidential balance created',
    result:
      'Creating confidential balance...\nElGamal pubkey: ELG-8Kj2P5NzRvX7mYq4AtH9WcB6u3M...\nSignature: 7PwXkNcR2tL5vYh4JmG8SqTsA3dVxBn...',
    success: true,
  },
  {
    title: 'Tokens deposited to confidential balance',
    result:
      'Depositing 500 tokens to confidential balance...\nProof generated: zk-3Kt7RmN8wPq5XvY2HcL4...\nSignature: 9TvMhKpW6sN3qZx7BnF5RcY2AuE4wLd...',
    success: true,
  },
  {
    title: 'Confidential transfer executed',
    result:
      'Transferring confidential amount...\nProof verified: zk-6Ny4TpK9xWm2RvL8...\nSignature: 3HbNkRmP7tQ8wXs4VcJ9YuT5AzE2vLn...',
    success: true,
  },
]

import { FC } from 'react'
import { TokenAccounts } from '@/entities/account/token-accounts'
import { OmniAccountHeader } from '@/features/omni-account-header'
import { CardStep } from '@/shared/ui/card-step'
import { Text } from '@/shared/ui/text'

export const Dashboard: FC = () => {
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
      <OmniAccountHeader className="mt-12 mb-5" />
      <TokenAccounts />
    </section>
  )
}

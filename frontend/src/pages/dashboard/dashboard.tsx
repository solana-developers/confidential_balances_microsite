import { FC } from 'react'
import { NATIVE_MINT } from '@solana/spl-token'
import { useNativeAndTokenBalance } from '@/entities/account/account/model/use-native-and-token-balance'
import { WalletTitle } from '@/entities/account/account/ui/wallet-title'
import { CardBalance } from '@/shared/ui/card-balance'
import { CardStep } from '@/shared/ui/card-step'
import { DataTable } from '@/shared/ui/data-table'
import { Text } from '@/shared/ui/text'

export const Dashboard: FC = () => {
  const { balance, loading } = useNativeAndTokenBalance(NATIVE_MINT)

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
      <div className="mt-12">
        <div className="mb-5 flex flex-col items-baseline justify-between gap-4 sm:!flex-row sm:items-center">
          <div className="flex flex-row items-baseline gap-4">
            {/* TODO: Wallet has same size as h1, but semantically that's incorrect. Have to split styling and semantics */}
            <Text variant="header1">Wallet</Text>
            <WalletTitle />
          </div>
          <CardBalance
            className="min-w-40"
            title="Wallet balance"
            balance={loading ? '...' : balance?.uiAmount}
            symbol={loading ? '' : 'SOL'}
          />
        </div>
        <DataTable
          title="Token accounts with confidential balances"
          labels={{ empty: 'No token accounts found. Create new account to proceed' }}
        />
      </div>
    </section>
  )
}

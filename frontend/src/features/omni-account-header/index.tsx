import { ComponentProps, FC } from 'react'
import { NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useNativeAndTokenBalance } from '@/entities/account/account/model/use-native-and-token-balance'
import { WalletTitle } from '@/entities/account/account/ui/wallet-title'
import { CardBalance } from '@/shared/ui/card-balance'
import { Text } from '@/shared/ui/text'
import { cn } from '@/shared/utils'

export function OmniAccountHeader({
  address = NATIVE_MINT,
  className,
}: { address?: PublicKey } & ComponentProps<'div'>) {
  const { balance, loading } = useNativeAndTokenBalance(address)

  // console.log({ balance })

  // TODO: change text according the account type

  return <AccountHeaderView className={className} balance={balance} loading={loading} />
}

export const AccountHeaderView: FC<ComponentProps<'div'>> = ({ className, balance, loading }) => {
  return (
    <div className={cn(className, 'mb-5')}>
      <div className="flex flex-col items-baseline justify-between gap-4 sm:!flex-row sm:items-center">
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
    </div>
  )
}

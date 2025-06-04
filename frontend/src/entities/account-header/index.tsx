import { ComponentProps, FC } from 'react'
import { Address } from '@hoodieshq/ms-tools-ui'
import { PublicKey } from '@solana/web3.js'
import { useGetTokenBalance } from '@/entities/account/account/model/use-get-token-balance'
import { useNativeAndTokenBalance } from '@/entities/account/account/model/use-native-and-token-balance'
import { WalletTitle } from '@/entities/account/account/ui/wallet-title'
import { CardBalance } from '@/shared/ui/card-balance'
import { Text } from '@/shared/ui/text'
import { cn, ellipsify } from '@/shared/utils'
import { ExplorerLink } from '../cluster/cluster'

type AccountHeaderParams = {
  address: PublicKey
  balance?: {
    amount: string
    decimals: number
    uiAmount: number
    uiAmountString: string
  }
  label?: string
  loading?: boolean
  isWallet?: boolean
  secondaryLabel?: string
}

export function WalletAccountHeader({
  address,
  className,
  label,
  secondaryLabel,
}: AccountHeaderParams & ComponentProps<'div'>) {
  const { balance, loading } = useNativeAndTokenBalance(address)

  return (
    <AccountHeaderView
      address={address}
      className={className}
      label={label}
      balance={balance}
      loading={loading}
      secondaryLabel={secondaryLabel}
      symbol="SOL"
      isWallet
    />
  )
}

export function TokenAccountHeader({
  address,
  className,
  label,
  secondaryLabel,
}: AccountHeaderParams & ComponentProps<'div'>) {
  const { data: balance, isLoading } = useGetTokenBalance({ tokenAccountPubkey: address })

  return (
    <AccountHeaderView
      address={address}
      className={className}
      label={label}
      balance={{
        uiAmountString: balance ?? '0',
        uiAmount: Number(balance ?? '0'),
        amount: balance ?? '0',
        decimals: -1,
      }}
      symbol="Token"
      loading={isLoading}
      secondaryLabel={secondaryLabel}
    />
  )
}

export const AccountHeaderView: FC<
  AccountHeaderParams & { isWallet?: boolean; symbol: string } & ComponentProps<'div'>
> = ({ address, className, label, balance, loading, secondaryLabel, symbol, isWallet = false }) => {
  return (
    <div className={cn(className, 'mb-5')}>
      <div className="flex flex-col items-baseline justify-between gap-4 sm:!flex-row sm:items-center">
        <div className="flex flex-row items-baseline gap-4">
          {/* TODO: Wallet has same size as h1, but semantically that's incorrect. Have to split styling and semantics */}
          <Text variant="header1">{label ?? 'Wallet'}</Text>
          {isWallet ? (
            <WalletTitle />
          ) : (
            <div className="flex flex-col">
              <span className="text-xs">
                <Address address={address?.toBase58()} asChild>
                  <span className="text-(color:--accent)">
                    <ExplorerLink
                      label={address?.toString()}
                      path={`account/${address?.toString()}`}
                    />
                  </span>
                </Address>
              </span>
            </div>
          )}
        </div>
        <CardBalance
          className="min-w-40"
          title={secondaryLabel ?? 'Wallet balance'}
          balance={loading ? '...' : balance?.uiAmount}
          symbol={loading ? '' : symbol}
        />
      </div>
    </div>
  )
}

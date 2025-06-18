import { ComponentProps, FC } from 'react'
import { Address } from '@solana-foundation/ms-tools-ui/components/address'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import {
  useGetTokenBalance,
  useNativeAndTokenBalance,
  WalletTitle,
} from '@/entities/account/account'
import { CardBalance } from '@/shared/ui/card-balance'
import { Text } from '@/shared/ui/text'
import { cn } from '@/shared/utils'
import { ExplorerLink } from '../cluster/cluster'

type AccountHeaderParams = {
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

type AccountOrMintHeaderParams = AccountHeaderParams &
  ({ account: PublicKey } | { mint: PublicKey; wallet: string })

export function WalletAccountHeader({
  className,
  label,
  secondaryLabel,
  ...params
}: AccountOrMintHeaderParams & ComponentProps<'div'>) {
  const { publicKey } = useWallet()

  let mint
  let wallet
  if ('mint' in params) {
    mint = params.mint
    wallet = new PublicKey(params.wallet)
  } else {
    throw new Error(`mint is absent`)
  }

  const { balance, loading } = useNativeAndTokenBalance(mint)
  const isCurrentWallet = publicKey?.equals(wallet)

  return (
    <AccountHeaderView
      address={mint}
      className={className}
      label={label}
      balance={balance}
      loading={loading}
      secondaryLabel={secondaryLabel}
      symbol="SOL"
      isWallet
      hasVisibleBalance={isCurrentWallet}
      walletAddress={wallet}
    />
  )
}

export function TokenAccountHeader({
  className,
  label,
  secondaryLabel,
  ...params
}: AccountOrMintHeaderParams & ComponentProps<'div'>) {
  let account
  if ('account' in params) {
    account = params.account
  } else {
    throw new Error(`mint is absent`)
  }

  const { data: balance, isLoading } = useGetTokenBalance({ tokenAccountPubkey: account })

  return (
    <AccountHeaderView
      address={account}
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
      hasVisibleBalance
    />
  )
}

type AccountHeaderViewParams = AccountHeaderParams & {
  address: PublicKey
  isWallet?: boolean
  hasVisibleBalance?: boolean
  walletAddress?: PublicKey
  symbol: string
}

export const AccountHeaderView: FC<AccountHeaderViewParams & ComponentProps<'div'>> = ({
  address,
  className,
  label,
  balance,
  loading,
  secondaryLabel,
  symbol,
  isWallet = false,
  hasVisibleBalance = false,
  walletAddress,
}) => {
  return (
    <div className={cn(className, 'mb-5')}>
      <div className="flex flex-col items-baseline justify-between gap-4 sm:!flex-row sm:items-center">
        <div className="flex flex-col items-baseline gap-4 sm:flex-row">
          <Text variant="header1" as="p">
            {label ?? 'Wallet'}
          </Text>
          {isWallet ? (
            <WalletTitle address={walletAddress} />
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
        {hasVisibleBalance ? (
          <CardBalance
            className="min-w-40"
            title={secondaryLabel ?? 'Wallet balance'}
            balance={loading ? '...' : balance?.uiAmount}
            symbol={loading ? '' : symbol}
          />
        ) : undefined}
      </div>
    </div>
  )
}

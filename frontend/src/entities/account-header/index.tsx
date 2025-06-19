import { ComponentProps, FC } from 'react'
import { Address } from '@solana-foundation/ms-tools-ui/components/address'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, TokenAmount } from '@solana/web3.js'
import { useGetTokenBalance, WalletTitle } from '@/entities/account/account'
import { CardBalance } from '@/shared/ui/card-balance'
import { Text } from '@/shared/ui/text'
import { cn } from '@/shared/utils'
import { emptyNativeBalance, nativeToUiAmount } from '../account/account/model/native-to-ui-amount'
import { useGetBalance } from '../account/account/model/use-get-balance'
import { ExplorerLink } from '../cluster/cluster'

type AccountHeaderParams = {
  balance?: TokenAmount
  label?: string
  loading?: boolean
  isWallet?: boolean
  secondaryLabel?: string
}

type AccountOrMintHeaderParams = AccountHeaderParams &
  ({ account: PublicKey } | { mint: PublicKey; wallet?: string })

export function WalletAccountHeader({
  className,
  label,
  secondaryLabel,
  ...params
}: AccountOrMintHeaderParams & ComponentProps<'div'>) {
  const { publicKey } = useWallet()

  let mint
  if ('mint' in params) {
    mint = params.mint
  } else {
    throw new Error(`mint is absent`)
  }

  let wallet
  if ('wallet' in params && params.wallet) {
    wallet = new PublicKey(params.wallet)
  }

  let isCurrentWallet = false
  if (wallet) {
    isCurrentWallet = publicKey?.equals(wallet) ?? false
  }

  const { isLoading: loading, data } = useGetBalance({ address: publicKey })
  const balance = data ? nativeToUiAmount(data) : emptyNativeBalance()

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
    <div className={cn(className, 'flex')}>
      <div className="flex w-full flex-col items-baseline justify-between gap-4 sm:!flex-row sm:items-center">
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
            balance={loading ? null : (balance?.uiAmount ?? emptyNativeBalance().uiAmount)}
            symbol={loading ? '' : symbol}
          />
        ) : undefined}
      </div>
    </div>
  )
}

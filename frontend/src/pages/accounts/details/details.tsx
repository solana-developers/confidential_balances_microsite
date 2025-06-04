'use client'

import { FC, useMemo } from 'react'
import Link from 'next/link'
import { PublicKey } from '@solana/web3.js'
import { TokenAccountHeader } from '@/entities/account-header'
import {
  AccountBalance,
  AccountButtons,
  AccountTokens,
  AccountTransactions,
  TokenAccountButtons,
  TokenBalance,
  TokenConfidentialBalanceDisplay,
  useGetSingleTokenAccount,
} from '@/entities/account/account'
import { ExplorerLink } from '@/entities/cluster/cluster'
import {
  ConfidentialBalances,
  PendingOperations,
  TransactionHistory,
} from '@/features/token-account'
import { BackwardControl } from '@/shared/ui/backward-control'
import { Hero } from '@/shared/ui/hero'
import { ellipsify } from '@/shared/utils'

type DetailsProps = {
  address?: string
}

export const Details: FC<DetailsProps> = ({ address: param }) => {
  const address = useMemo(() => {
    if (!param) {
      return
    }
    try {
      return new PublicKey(param)
    } catch (e) {
      console.warn(`Invalid public key`, e)
    }
  }, [param])

  // Frontend builds fail if calling the hook within a conditional `if` statement.
  // The workaround is to call the hook with a dummy/default PublicKey when there's no address.
  const tokenAccountQuery = useGetSingleTokenAccount(
    address ? { address } : { address: PublicKey.default }
  )
  const { data: accountDescription, isLoading } = tokenAccountQuery

  if (!address) {
    return <div>Error loading account</div>
  }

  if (isLoading) {
    return <div>Loading account data...</div>
  }

  console.log({ accountDescription }, PublicKey.default.toString())

  return (
    <div>
      {/* TODO: replace with UI::Breadcrumbs */}
      <BackwardControl asChild>
        <Link href={'/'}>Go back to wallet page</Link>
      </BackwardControl>
      {/* Use random token account. whould be one that is handled through pathname */}
      {!param ? (
        <div>Loading..</div>
      ) : (
        <TokenAccountHeader
          label="Token account"
          address={address}
          secondaryLabel="Account balance"
        />
      )}
      <div className="flex flex-col gap-5">
        <ConfidentialBalances />
        <PendingOperations />
        <TransactionHistory />
      </div>

      {accountDescription.tokenAccount ? (
        <div>
          <Hero title="" subtitle="">
            <div className="my-4">
              <TokenAccountButtons address={address} />
              <div className="my-4" />
              <TokenConfidentialBalanceDisplay tokenAccountPubkey={address} />
            </div>
          </Hero>
          <div className="space-y-8">
            <AccountTransactions address={address} />
          </div>
        </div>
      ) : (
        <div>
          <Hero
            title={<AccountBalance address={address} />}
            subtitle={
              <div className="my-4">
                Explorer:{' '}
                <ExplorerLink path={`account/${address}`} label={ellipsify(address.toString())} />
              </div>
            }
          >
            <div className="my-4">
              <AccountButtons address={address} />
            </div>
          </Hero>
          <div className="space-y-8">
            <AccountTokens address={address} />
            <AccountTransactions address={address} />
          </div>
        </div>
      )}
    </div>
  )
}

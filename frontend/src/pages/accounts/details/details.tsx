'use client'

import { FC, useMemo } from 'react'
import Link from 'next/link'
import { PublicKey } from '@solana/web3.js'
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
import { OmniAccountHeader } from '@/features/omni-account-header'
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

  return (
    <div>
      {/* TODO: replace with UI::Breadcrumbs */}
      <BackwardControl asChild>
        <Link href={'/'}>Go back to wallet page</Link>
      </BackwardControl>
      {/* Use random token account. whould be one that is handled through pathname */}
      <OmniAccountHeader address={new PublicKey('F5C4y8awLtvU98tkqBFV4zMmknEwqfdKte7428ooDhUy')} />
      {accountDescription.tokenAccount ? (
        <div>
          <Hero
            title={<TokenBalance tokenAccountPubkey={address} />}
            subtitle={
              <div className="my-4">
                Explorer:{' '}
                <ExplorerLink path={`account/${address}`} label={ellipsify(address.toString())} />
              </div>
            }
          >
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

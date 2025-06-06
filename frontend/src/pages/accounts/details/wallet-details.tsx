'use client'

import { FC, useMemo } from 'react'
import Link from 'next/link'
import { NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { WalletAccountHeader } from '@/entities/account-header'
import {
  AccountButtons,
  AccountTokens,
  AccountTransactions,
  useGetSingleTokenAccount,
} from '@/entities/account/account'
import {
  ConfidentialBalances,
  PendingOperations,
  TransactionHistory,
} from '@/features/token-account'
import { BackwardControl } from '@/shared/ui/backward-control'
import { Hero } from '@/shared/ui/hero'

type DetailsProps = {
  address?: string
}

export const WalletDetails: FC<DetailsProps> = ({ address: param }) => {
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
  const { isLoading } = tokenAccountQuery

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
      {!param ? <div>Loading..</div> : <WalletAccountHeader address={NATIVE_MINT} />}
      <div className="flex flex-col gap-5">
        <ConfidentialBalances />
        <PendingOperations />
        <TransactionHistory />
      </div>
      LEGACY WALLET MARKUP DOWN THERE
      <div>
        <Hero title="" subtitle="">
          <div className="my-4">
            <AccountButtons address={address} />
          </div>
        </Hero>
        <div className="space-y-8">
          <AccountTokens address={address} />
          <AccountTransactions address={address} />
        </div>
      </div>
    </div>
  )
}

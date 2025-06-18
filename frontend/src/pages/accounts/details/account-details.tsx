'use client'

import { FC } from 'react'
import Link from 'next/link'
import { PublicKey } from '@solana/web3.js'
import { TokenAccountHeader } from '@/entities/account-header'
import {
  ConfidentialBalances,
  PendingOperations,
  TransactionHistory,
} from '@/features/token-account'
import { BackwardControl } from '@/shared/ui/backward-control'

type AccountDetailsProps = {
  address: string
  account: string
}

export const AccountDetails: FC<AccountDetailsProps> = ({ address: param, account: ataParam }) => {
  const address = new PublicKey(param)
  const account = new PublicKey(ataParam)

  return (
    <div>
      <BackwardControl asChild>
        <Link href="/">Go back to wallet page</Link>
      </BackwardControl>
      {!param ? (
        <div>Loading..</div>
      ) : (
        <TokenAccountHeader
          label="Token account"
          account={address}
          secondaryLabel="Account balance"
        />
      )}
      <div className="flex flex-col gap-5">
        <ConfidentialBalances account={account} />
        <PendingOperations account={account} />
        <TransactionHistory />
      </div>
    </div>
  )
}

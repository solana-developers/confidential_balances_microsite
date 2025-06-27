'use client'

import { FC } from 'react'
import Link from 'next/link'
import { NATIVE_MINT } from '@solana/spl-token'
import { WalletAccountHeader } from '@/entities/account-header'
import { TokenAccounts } from '@/features/token-account'
import { BackwardControl } from '@/shared/ui/backward-control'
import { Text } from '@/shared/ui/text'

type WalletDetailsProps = {
  address: string
}

export const WalletDetails: FC<WalletDetailsProps> = ({ address }) => {
  return (
    <div>
      <BackwardControl asChild>
        <Link href="/">Go back to wallet page</Link>
      </BackwardControl>
      {!address ? (
        <div>Loading..</div>
      ) : (
        <div className="mt-4 mb-5">
          <WalletAccountHeader wallet={address} mint={NATIVE_MINT} className="h-[62px]" />
        </div>
      )}
      <Text variant="text" className="my-2">
        {address ? (
          <>You can see the list of Wallet&lsquo;s token acounts in the table below.</>
        ) : undefined}
      </Text>
      <div className="flex flex-col gap-5">
        <TokenAccounts address={address} />
      </div>
    </div>
  )
}

'use client'

import { FC } from 'react'
import Link from 'next/link'
import { NATIVE_MINT } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletAccountHeader } from '@/entities/account-header'
import { TokenAccounts } from '@/features/token-account'
import { BackwardControl } from '@/shared/ui/backward-control'
import { Text } from '@/shared/ui/text'

type DetailsProps = {
  address: string
}

export const WalletDetails: FC<DetailsProps> = ({ address: param }) => {
  const { wallet, publicKey } = useWallet()
  return (
    <div>
      <BackwardControl asChild>
        <Link href="/">Go back to wallet page</Link>
      </BackwardControl>
      {!param ? <div>Loading..</div> : <WalletAccountHeader address={NATIVE_MINT} />}
      <Text variant="text" className="my-2">
        {wallet && publicKey ? (
          <>You can see the list of Wallet&lsquo;s token acounts in the table below.</>
        ) : undefined}
      </Text>
      <div className="flex flex-col gap-5">
        <TokenAccounts />
      </div>
    </div>
  )
}

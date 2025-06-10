'use client'

import { Suspense } from 'react'
import { type NextPage } from 'next'
import { useParams } from 'next/navigation'
import { PublicKey } from '@solana/web3.js'
import { ErrorBoundary } from 'react-error-boundary'
import { StatusReasons, useGetSingleTokenAccount } from '@/entities/account/account'
import { AccountDetails, WalletDetails } from '@/pages/accounts/details'
import { Text } from '@/shared/ui/text'

interface AccountPageParams {
  address: string
  [key: string]: string | string[] | undefined
}

// NOTE: control what account to render inside page component
function PageView({ address }: { address: string }) {
  const {
    data: { tokenAccount, error, reason },
  } = useGetSingleTokenAccount({ address: new PublicKey(address) })

  const isLoading = tokenAccount === null && reason === StatusReasons.LOADING
  const isTokenAccount = !error && tokenAccount && !reason
  const isOtherAccount = !error && !tokenAccount && reason === StatusReasons.NOT_ATA

  if (isLoading) {
    return <Text>Loading account data..</Text>
  }

  // handle token accounts
  if (isTokenAccount) {
    return <AccountDetails address={address} account={tokenAccount.address.toBase58()} />
  }

  // handle accounts like wallet
  if (isOtherAccount) {
    return <WalletDetails address={address} />
  }

  // throw error otherwise
  throw error
}

const Page: NextPage = () => {
  const { address } = useParams<AccountPageParams>()

  return (
    <ErrorBoundary fallbackRender={() => <Text>{`Failed to load token account`}</Text>}>
      <Suspense fallback={<Text>Loading..</Text>}>
        <PageView address={address} />
      </Suspense>
    </ErrorBoundary>
  )
}

export default Page

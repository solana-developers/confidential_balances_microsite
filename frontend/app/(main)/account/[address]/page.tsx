'use client'

import { Suspense } from 'react'
import { type NextPage } from 'next'
import { useParams } from 'next/navigation'
import { PublicKey } from '@solana/web3.js'
import { ErrorBoundary } from 'react-error-boundary'
import { useGetSingleTokenAccount } from '@/entities/account/account'
import { Details } from '@/pages/accounts/details'
import { Text } from '@/shared/ui/text'

interface AccountPageParams {
  address: string
  [key: string]: string | string[] | undefined
}

function PageView({ address }: { address: string }) {
  const { data: account } = useGetSingleTokenAccount({ address: new PublicKey(address) })

  if (account.tokenAccount === null && account.reason === 'Query not started') {
    return <Text>Loading..</Text>
  }

  if (account.error || !account.tokenAccount) throw new Error('Can not load account')

  return <Details address={address} />
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

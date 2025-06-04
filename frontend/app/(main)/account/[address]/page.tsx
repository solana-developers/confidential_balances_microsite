'use client'

import { type NextPage } from 'next'
import { useParams } from 'next/navigation'
import { Details } from '@/pages/accounts/details'

interface AccountPageParams {
  address: string
  [key: string]: string | string[] | undefined
}

const Page: NextPage = () => {
  const params = useParams<AccountPageParams>()

  return <Details address={typeof params?.address === 'string' ? params.address : undefined} />
}

export default Page

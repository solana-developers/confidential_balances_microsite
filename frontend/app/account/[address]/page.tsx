'use client'

import { type NextPage } from 'next'
import { useParams } from 'next/navigation'
import { Details } from '@/pages/accounts/details'

const Page: NextPage = () => {
  const params = useParams()

  return <Details address={typeof params?.address === 'string' ? params.address : undefined} />
}

export default Page

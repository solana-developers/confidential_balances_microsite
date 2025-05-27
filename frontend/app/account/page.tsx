'use client'

import { type NextPage } from 'next'
import { redirect } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { List } from '@/pages/accounts/list'

const Page: NextPage = ({}) => {
  const { publicKey } = useWallet()

  if (publicKey) {
    return redirect(`/account/${publicKey.toString()}`)
  }

  return <List />
}

export default Page

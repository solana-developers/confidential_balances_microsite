'use client'

import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'

import { useParams } from 'next/navigation'

import { ExplorerLink } from '../cluster/cluster-ui'
import { AppHero, ellipsify } from '../ui/ui-layout'
import {
  AccountBalance,
  AccountButtons,
  AccountTransactions,
  AccountTokens,
  TokenAccountButtons,
  TokenBalance
} from './account-ui'
import { useGetSingleTokenAccount } from './account-data-access'

export default function AccountDetailFeature() {
  const params = useParams()
  const address = useMemo(() => {
    if (!params.address) {
      return
    }
    try {
      return new PublicKey(params.address)
    } catch (e) {
      console.log(`Invalid public key`, e)
    }
  }, [params])
  if (!address) {
    return <div>Error loading account</div>
  }

  const { data: accountDescription, isLoading } = useGetSingleTokenAccount({ address })
  
  if (isLoading) {
    return <div>Loading account data...</div>
  }

  return (
    <div>
      {accountDescription.tokenAccount ? (
        <div>
          <AppHero
            title={<TokenBalance tokenAccountPubkey={address} />}
            subtitle={
              <div className="my-4">
                Explorer: <ExplorerLink path={`account/${address}`} label={ellipsify(address.toString())} />
              </div>
            }
          >
            <div className="my-4">
              <TokenAccountButtons address={address} />
            </div>
          </AppHero>
          <div className="space-y-8">
            <AccountTransactions address={address} />
          </div>
        </div>
      ) : (
        <div>
          <AppHero
            title={<AccountBalance address={address} />}
            subtitle={
              <div className="my-4">
                Explorer: <ExplorerLink path={`account/${address}`} label={ellipsify(address.toString())} />
              </div>
            }
          >
            <div className="my-4">
              <AccountButtons 
                address={address} 
              />
            </div>
          </AppHero>
          <div className="space-y-8">
            <AccountTokens address={address} />
            <AccountTransactions address={address} />
          </div>
        </div>
      )}
    </div>
  )
}

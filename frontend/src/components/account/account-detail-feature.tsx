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
  TokenBalance,
  TokenConfidentialBalanceDisplay
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

  // Frontend builds fail if calling the hook within a conditional `if` statement.
  // The workaround is to call the hook with a dummy/default PublicKey when there's no address.
  const tokenAccountQuery = useGetSingleTokenAccount(
    address ? { address } : { address: PublicKey.default }
  )
  const { data: accountDescription, isLoading } = tokenAccountQuery
  
  if (!address) {
    return <div>Error loading account</div>
  }
  
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
              <div className="my-4"/>
              <TokenConfidentialBalanceDisplay tokenAccountPubkey={address} />
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

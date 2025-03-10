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
import { useState } from 'react'
import { useDecryptConfidentialBalance } from './account-data-access'
import { useWallet } from '@solana/wallet-adapter-react'

function TokenConfidentialBalanceDisplay({ tokenAccountPubkey }: { tokenAccountPubkey: PublicKey }) {
  const [isConfidentialVisible, setIsConfidentialVisible] = useState(false)
  const { decryptBalance, isDecrypting, confidentialBalance, error } = useDecryptConfidentialBalance()
  const wallet = useWallet()
  
  const handleDecryptBalance = async () => {
    const result = await decryptBalance(tokenAccountPubkey)
    if (result) {
      setIsConfidentialVisible(true)
    }
  }
  
  return (
    <div className="w-full bg-gray-900 rounded-lg p-6">
      <div className="flex flex-col">        
        <div className="pt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-medium text-gray-400">Confidential Balance</h3>
            {isConfidentialVisible && (
              <button 
                className="text-blue-500 hover:text-blue-400"
                onClick={() => setIsConfidentialVisible(false)}
              >
                Hide
              </button>
            )}
          </div>
          
          {!isConfidentialVisible ? (
            <div className="mt-4">
              {isDecrypting ? (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-gray-400">Decrypting balance...</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleDecryptBalance}
                    className="px-5 py-2 bg-gray-800 text-gray-200 rounded-md hover:bg-gray-700 border border-gray-700 flex items-center"
                    disabled={!wallet.connected}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Decrypt Available Balance
                  </button>
                  {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
                  {!wallet.connected && <p className="mt-2 text-yellow-500 text-sm">Connect wallet to decrypt</p>}
                </>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <div className="flex items-center">
                <div className="text-5xl font-bold text-blue-500">{confidentialBalance} Tokens</div>
                <svg className="w-6 h-6 ml-3 text-blue-500" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This balance is encrypted and only visible to you
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

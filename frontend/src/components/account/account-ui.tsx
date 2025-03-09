'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { IconRefresh } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, useEffect } from 'react'
import { AppModal, ellipsify } from '../ui/ui-layout'
import { useCluster } from '../cluster/cluster-data-access'
import { AppLink, ExplorerLink } from '../cluster/cluster-ui'
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { getAssociatedTokenAddress } from '@solana/spl-token'
import { useConnection } from '@solana/wallet-adapter-react'
import {
  useGetBalance,
  useGetSignatures,
  useGetTokenAccounts,
  useRequestAirdrop,
  useTransferSol,
  useDepositCb,
  useCreateAssociatedTokenAccountCB,
  useGetMintInfo,
  useApplyCB,
  useTransferCB,
  useWithdrawCB,
  useGetSingleTokenAccount,
} from './account-data-access'
import { toast } from 'react-hot-toast'
import { AccountLayout } from '@solana/spl-token'

export function AccountBalance({ address }: { address: PublicKey }) {
  const query = useGetBalance({ address })

  return (
    <div>
      <h1 className="text-5xl font-bold cursor-pointer" onClick={() => query.refetch()}>
        {query.data ? <BalanceSol balance={query.data} /> : '...'} SOL
      </h1>
    </div>
  )
}

export function TokenBalance({ tokenAccountPubkey }: { tokenAccountPubkey: PublicKey }) {
  const { connection } = useConnection()
  const [balance, setBalance] = useState<string>('...')
 
  useEffect(() => {
    async function fetchTokenBalance() {
      try {
        const response = await connection.getTokenAccountBalance(tokenAccountPubkey)
        setBalance(response?.value?.uiAmountString || '0')
      } catch (error) {
        console.error('Error fetching token balance:', error)
        setBalance('Error')
      }
    }
    
    fetchTokenBalance()
  }, [connection, tokenAccountPubkey])

  return (
    <div>
      <h1 className="text-5xl font-bold">
        {balance} Tokens
      </h1>
    </div>
  )
}

export function AccountChecker() {
  const { publicKey } = useWallet()
  if (!publicKey) {
    return null
  }
  return <AccountBalanceCheck address={publicKey} />
}
export function AccountBalanceCheck({ address }: { address: PublicKey }) {
  const { cluster } = useCluster()
  const mutation = useRequestAirdrop({ address })
  const query = useGetBalance({ address })

  if (query.isLoading) {
    return null
  }
  if (query.isError || !query.data) {
    return (
      <div className="alert alert-warning text-warning-content/80 rounded-none flex justify-center">
        <span>
          You are connected to <strong>{cluster.name}</strong> but your account is not found on this cluster.
        </span>
        <button
          className="btn btn-xs btn-neutral"
          onClick={() => mutation.mutateAsync(1).catch((err) => console.log(err))}
        >
          Request Airdrop
        </button>
      </div>
    )
  }
  return null
}

export function AccountButtons({ address }: { 
  address: PublicKey
}) {
  const [showInitializeModal, setShowInitializeModal] = useState(false)
  const { mutate: initializeAccount, isPending: isInitializing } = useCreateAssociatedTokenAccountCB({ walletAddressPubkey: address })
  
  return (
    <div>
      <ModalInitATA 
        show={showInitializeModal} 
        hide={() => setShowInitializeModal(false)} 
        address={address} 
        initializeAccount={initializeAccount} 
        isInitializing={isInitializing} 
      />
      
      <div className="space-x-2">
        <button 
          className="btn btn-xs lg:btn-md btn-outline" 
          onClick={() => setShowInitializeModal(true)}
          disabled={isInitializing}
        >
          {isInitializing ? 
            <span className="loading loading-spinner loading-xs"></span> : 
            'Create & Initialize Confidential Balance ATA'
          }
        </button>
      </div>      
    </div>
  )
}

export function TokenAccountButtons({ address }: { 
  address: PublicKey, 
}) {
  const wallet = useWallet()
  const { cluster } = useCluster()
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  
  const { mutate: applyPendingBalance, isPending: isApplying } = useApplyCB({ address })

  return (
    <div>
      <ModalDeposit show={showDepositModal} hide={() => setShowDepositModal(false)} address={address} />
      <ModalTransfer show={showTransferModal} hide={() => setShowTransferModal(false)} address={address} />
      <ModalWithdraw show={showWithdraw} hide={() => setShowWithdraw(false)} tokenAccountPubkey={address} />
      
      <div className="space-x-2">
        <button 
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowDepositModal(true)}
        >
          Deposit
        </button>
        <button 
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => applyPendingBalance()}
          disabled={isApplying /*|| !wallet.publicKey?.equals(address)*/}
        >
          {isApplying ? 
            <span className="loading loading-spinner loading-xs"></span> : 
            'Apply'
          }
        </button>
        <button 
          className="btn btn-xs lg:btn-md btn-outline" 
          onClick={() => setShowWithdraw(true)}
        >
          Withdraw
        </button>
        <button 
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowTransferModal(true)}
        >
          Transfer
        </button>
      </div>      
    </div>
  )
}

export function AccountTokens({ address }: { address: PublicKey }) {
  const [showAll, setShowAll] = useState(false)
  const query = useGetTokenAccounts({ address })
  const client = useQueryClient()
  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 5)
  }, [query.data, showAll])

  return (
    <div className="space-y-2">
      <div className="justify-between">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Token Accounts</h2>
          <div className="space-x-2">
            {query.isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <button
                className="btn btn-sm btn-outline"
                onClick={async () => {
                  await query.refetch()
                  await client.invalidateQueries({
                    queryKey: ['getTokenAccountBalance'],
                  })
                }}
              >
                <IconRefresh size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      {query.isError && <pre className="alert alert-error">Error: {query.error?.message.toString()}</pre>}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No token accounts found.</div>
          ) : (
            <table className="table border-4 rounded-lg border-separate border-base-300">
              <thead>
                <tr>
                  <th>Public Key</th>
                  <th>Mint</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {items?.map(({ account, pubkey }) => (
                  <tr key={pubkey.toString()}>
                    <td>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <AppLink label={ellipsify(pubkey.toString())} path={`/account/${pubkey.toString()}`} />
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink
                            label={ellipsify(account.data.parsed.info.mint)}
                            path={`account/${account.data.parsed.info.mint.toString()}`}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="font-mono">{account.data.parsed.info.tokenAmount.uiAmount}</span>
                    </td>
                  </tr>
                ))}

                {(query.data?.length ?? 0) > 5 && (
                  <tr>
                    <td colSpan={4} className="text-center">
                      <button className="btn btn-xs btn-outline" onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show Less' : 'Show All'}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export function AccountTransactions({ address }: { address: PublicKey }) {
  const query = useGetSignatures({ address })
  const [showAll, setShowAll] = useState(false)

  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 5)
  }, [query.data, showAll])

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <div className="space-x-2">
          {query.isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <button className="btn btn-sm btn-outline" onClick={() => query.refetch()}>
              <IconRefresh size={16} />
            </button>
          )}
        </div>
      </div>
      {query.isError && <pre className="alert alert-error">Error: {query.error?.message.toString()}</pre>}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No transactions found.</div>
          ) : (
            <table className="table border-4 rounded-lg border-separate border-base-300">
              <thead>
                <tr>
                  <th>Signature</th>
                  <th className="text-right">Slot</th>
                  <th>Block Time</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item) => (
                  <tr key={item.signature}>
                    <th className="font-mono">
                      <ExplorerLink path={`tx/${item.signature}`} label={ellipsify(item.signature, 8)} />
                    </th>
                    <td className="font-mono text-right">
                      <ExplorerLink path={`block/${item.slot}`} label={item.slot.toString()} />
                    </td>
                    <td>{new Date((item.blockTime ?? 0) * 1000).toISOString()}</td>
                    <td className="text-right">
                      {item.err ? (
                        <div className="badge badge-error" title={JSON.stringify(item.err)}>
                          Failed
                        </div>
                      ) : (
                        <div className="badge badge-success">Success</div>
                      )}
                    </td>
                  </tr>
                ))}
                {(query.data?.length ?? 0) > 5 && (
                  <tr>
                    <td colSpan={4} className="text-center">
                      <button className="btn btn-xs btn-outline" onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show Less' : 'Show All'}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function BalanceSol({ balance }: { balance: number }) {
  return <span>{Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000}</span>
}

function ModalReceive({ hide, show, address }: { hide: () => void; show: boolean; address: PublicKey }) {
  return (
    <AppModal title="Receive" hide={hide} show={show}>
      <p>Receive assets by sending them to your public key:</p>
      <code>{address.toString()}</code>
    </AppModal>
  )
}

function ModalAirdrop({ hide, show, address }: { hide: () => void; show: boolean; address: PublicKey }) {
  const mutation = useRequestAirdrop({ address })
  const [amount, setAmount] = useState('2')

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Airdrop"
      submitDisabled={!amount || mutation.isPending}
      submitLabel="Request Airdrop"
      submit={() => mutation.mutateAsync(parseFloat(amount)).then(() => hide())}
    >
      <input
        disabled={mutation.isPending}
        type="number"
        step="any"
        min="1"
        placeholder="Amount"
        className="input input-bordered w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </AppModal>
  )
}

function ModalSend({ hide, show, address }: { hide: () => void; show: boolean; address: PublicKey }) {
  const wallet = useWallet()
  const mutation = useTransferSol({ address })
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('1')

  if (!address || !wallet.sendTransaction) {
    return <div>Wallet not connected</div>
  }

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Send"
      submitDisabled={!destination || !amount || mutation.isPending}
      submitLabel="Send"
      submit={() => {
        mutation
          .mutateAsync({
            destination: new PublicKey(destination),
            amount: parseFloat(amount),
          })
          .then(() => hide())
      }}
    >
      <input
        disabled={mutation.isPending}
        type="text"
        placeholder="Destination"
        className="input input-bordered w-full"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />
      <input
        disabled={mutation.isPending}
        type="number"
        step="any"
        min="1"
        placeholder="Amount"
        className="input input-bordered w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </AppModal>
  )
}

function ModalDeposit({ show, hide, address }: { show: boolean; hide: () => void; address: PublicKey }) {
  const [amount, setAmount] = useState('')
  const depositMutation = useDepositCb({ address })
  const [decimals, setDecimals] = useState(9) // Default to 9 decimals until we load the actual value
  
  // Get token account info to extract the mint
  const { data: tokenAccountInfo, isLoading: isTokenAccountLoading } = useGetSingleTokenAccount({ address })
  
  // Use the mint from the token account to get mint info
  const mintInfoQuery = useGetMintInfo({ 
    mintAddress: tokenAccountInfo?.tokenAccount?.mint?.toBase58() || '', 
    enabled: !!tokenAccountInfo?.tokenAccount?.mint
  })
  
  // Update decimals when mint info is available
  useEffect(() => {
    if (mintInfoQuery.data) {
      setDecimals(mintInfoQuery.data.decimals)
    }
  }, [mintInfoQuery.data])
  
  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (!tokenAccountInfo?.tokenAccount?.mint) {
      toast.error('Token mint information not available')
      return
    }
    
    try {
      // Convert to token units based on mint decimals
      const factor = Math.pow(10, decimals)
      const tokenAmount = (parseFloat(amount) * factor).toString()
      
      await depositMutation.mutateAsync({ 
        lamportAmount: tokenAmount,
      })
      hide()
      setAmount('')
      toast.success('Deposit submitted successfully')
    } catch (error) {
      console.error('Deposit failed:', error)
      toast.error(`Deposit failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Calculate the token units based on the input amount
  const tokenUnits = useMemo(() => {
    if (!amount) return ''
    const factor = Math.pow(10, decimals)
    return `${parseFloat(amount) * factor} token units`
  }, [amount, decimals])

  // Get the token type from the mint info
  const tokenType = useMemo(() => {
    if (!mintInfoQuery.data) return 'Unknown';
    return mintInfoQuery.data.isToken2022 ? 'Token-2022' : 'Standard Token';
  }, [mintInfoQuery.data])

  const isLoading = isTokenAccountLoading || mintInfoQuery.isLoading;

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Deposit to Confidential Balance"
      submitDisabled={!amount || parseFloat(amount) <= 0 || depositMutation.isPending || isLoading}
      submitLabel={depositMutation.isPending ? "Processing..." : "Confirm Deposit"}
      submit={handleSubmit}
    >
      {isLoading ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner"></span>
          <span className="ml-2">Loading token information...</span>
        </div>
      ) : mintInfoQuery.error ? (
        <div className="flex flex-col gap-2">
          <div className="alert alert-error">
            <p>Error loading token information:</p>
            <p className="text-sm break-all">{mintInfoQuery.error instanceof Error ? mintInfoQuery.error.message : 'Unknown error'}</p>
          </div>
        </div>
      ) : (
        <div className="form-control">
          <div className="mb-2 text-sm">
            <span className="badge badge-info">{tokenType}</span>
            <span className="ml-2 badge badge-ghost">{decimals} decimals</span>
          </div>
          <label className="label">
            <span className="label-text">Amount (Tokens)</span>
          </label>
          <input
            type="number"
            placeholder="Enter amount"
            className="input input-bordered w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={depositMutation.isPending}
            step={`${1 / Math.pow(10, decimals)}`} // Step based on mint decimals
            min="0"
            required
          />
          <label className="label">
            <span className="label-text-alt">
              {tokenUnits}
            </span>
          </label>
        </div>
      )}
    </AppModal>
  )
}

function ModalWithdraw({ show, hide, tokenAccountPubkey }: { show: boolean; hide: () => void; tokenAccountPubkey: PublicKey }) {
  const [amount, setAmount] = useState('')
  const withdrawMutation = useWithdrawCB({ tokenAccountPubkey })
  const [decimals, setDecimals] = useState(9) // Default to 9 decimals until we load the actual value
  
  // Get token account info to extract the mint
  const { data: tokenAccountInfo, isLoading: isTokenAccountLoading } = useGetSingleTokenAccount({ address: tokenAccountPubkey })
  
  // Use the mint from the token account to get mint info
  const mintInfoQuery = useGetMintInfo({ 
    mintAddress: tokenAccountInfo?.tokenAccount?.mint?.toBase58() || '', 
    enabled: !!tokenAccountInfo?.tokenAccount?.mint
  })
  
  // Update decimals when mint info is available
  useEffect(() => {
    if (mintInfoQuery.data) {
      setDecimals(mintInfoQuery.data.decimals)
    }
  }, [mintInfoQuery.data])
  
  const handleSubmit = async () => {
    console.log('Withdraw submit button clicked, amount:', amount)
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (!tokenAccountInfo?.tokenAccount?.mint) {
      toast.error('Token mint information not available')
      return
    }
    
    try {
      // Convert to token units based on mint decimals
      const factor = Math.pow(10, decimals)
      const tokenAmount = parseFloat(amount) * factor
      
      console.log('Withdraw amount in token units:', tokenAmount)
      
      await withdrawMutation.mutateAsync({ 
        amount: tokenAmount,
      })
      hide()
      setAmount('')
      toast.success('Withdraw submitted successfully')
    } catch (error) {
      console.error('Withdraw failed:', error)
      toast.error(`Withdraw failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Calculate the token units based on the input amount
  const tokenUnits = useMemo(() => {
    if (!amount) return ''
    const factor = Math.pow(10, decimals)
    return `${parseFloat(amount) * factor} token units`
  }, [amount, decimals])
  
  // Get the token type from the mint info
  const tokenType = useMemo(() => {
    if (!mintInfoQuery.data) return 'Unknown';
    return mintInfoQuery.data.isToken2022 ? 'Token-2022' : 'Standard Token';
  }, [mintInfoQuery.data])

  const isLoading = isTokenAccountLoading || mintInfoQuery.isLoading;

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Withdraw from Confidential Balance"
      submitDisabled={!amount || parseFloat(amount) <= 0 || withdrawMutation.isPending || isLoading}
      submitLabel={withdrawMutation.isPending ? "Processing..." : "Confirm Withdraw"}
      submit={handleSubmit}
    >
      {isLoading ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner"></span>
          <span className="ml-2">Loading token information...</span>
        </div>
      ) : mintInfoQuery.error ? (
        <div className="flex flex-col gap-2">
          <div className="alert alert-error">
            <p>Error loading token information:</p>
            <p className="text-sm break-all">{mintInfoQuery.error instanceof Error ? mintInfoQuery.error.message : 'Unknown error'}</p>
          </div>
        </div>
      ) : (
        <div className="form-control">
          <div className="mb-2 text-sm">
            <span className="badge badge-info">{tokenType}</span>
            <span className="ml-2 badge badge-ghost">{decimals} decimals</span>
          </div>
          <label className="label">
            <span className="label-text">Amount (Tokens)</span>
          </label>
          <input
            type="number"
            placeholder="Enter amount"
            className="input input-bordered w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={withdrawMutation.isPending}
            step={`${1 / Math.pow(10, decimals)}`} // Step based on mint decimals
            min="0"
            required
          />
          <label className="label">
            <span className="label-text-alt">
              {tokenUnits}
            </span>
          </label>
        </div>
      )}
    </AppModal>
  )
}

function ModalTransfer({ show, hide, address }: { show: boolean; hide: () => void; address: PublicKey }) {
  // Form state
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [addressType, setAddressType] = useState<'system' | 'token'>('system')
  
  // Validation state
  const [validationState, setValidationState] = useState({
    isValidating: false,
    error: '',
    isValid: false,
    tokenAccount: null as PublicKey | null
  })
  
  // Data fetching
  const { connection } = useConnection()
  const transferMutation = useTransferCB({ senderTokenAccountPubkey: address })
  const { data: tokenAccountInfo, isLoading: isTokenAccountLoading } = useGetSingleTokenAccount({ address })
  const mintPublicKey = tokenAccountInfo?.tokenAccount?.mint
  const mintInfoQuery = useGetMintInfo({ 
    mintAddress: mintPublicKey?.toBase58() || '', 
    enabled: !!mintPublicKey
  })
  const decimals = mintInfoQuery.data?.decimals || 9
  const isLoading = isTokenAccountLoading || mintInfoQuery.isLoading
  
  // Derived values
  const tokenUnits = useMemo(() => amount ? `${parseFloat(amount) * Math.pow(10, decimals)} token units` : '', [amount, decimals])
  const tokenType = useMemo(() => mintInfoQuery.data?.isToken2022 ? 'Token-2022' : 'Standard Token', [mintInfoQuery.data])
  
  // Reset validation when address type changes
  useEffect(() => {
    setValidationState(prev => ({ ...prev, isValid: false, error: '', tokenAccount: null }))
    if (recipientAddress && mintPublicKey) validateRecipient()
  }, [addressType, recipientAddress, mintPublicKey])
  
  const validateRecipient = async () => {
    if (!recipientAddress || !mintPublicKey) return
    
    setValidationState(prev => ({ ...prev, isValidating: true, error: '', tokenAccount: null }))
    
    try {
      let tokenAccountToCheck: PublicKey
      
      // Determine account to check based on address type
      if (addressType === 'system') {
        const recipientPublicKey = new PublicKey(recipientAddress)
        tokenAccountToCheck = await getAssociatedTokenAddress(
          mintPublicKey,
          recipientPublicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        )
      } else {
        tokenAccountToCheck = new PublicKey(recipientAddress)
      }
      
      // Check if account exists
      const accountInfo = await connection.getAccountInfo(tokenAccountToCheck)
      if (!accountInfo) {
        const error = addressType === 'system' 
          ? "Recipient's token account does not exist. They need to initialize their token account first."
          : "This token account does not exist."
        setValidationState(prev => ({ ...prev, error, isValid: false, isValidating: false }))
        return
      }
      
      // For token accounts, validate mint matches
      if (addressType === 'token') {
        try {
          const tokenAccountData = AccountLayout.decode(accountInfo.data)
          const accountMint = new PublicKey(tokenAccountData.mint)
          
          if (!accountMint.equals(mintPublicKey)) {
            setValidationState(prev => ({ 
              ...prev, 
              error: "This token account is for a different mint. It cannot receive this type of token.", 
              isValid: false,
              isValidating: false
            }))
            return
          }
        } catch (e) {
          setValidationState(prev => ({ 
            ...prev, 
            error: "The provided address is not a valid token account.", 
            isValid: false,
            isValidating: false
          }))
          return
        }
      }
      
      // All validations passed
      setValidationState({ 
        isValidating: false, 
        error: '', 
        isValid: true, 
        tokenAccount: tokenAccountToCheck 
      })
    } catch (error) {
      console.error('Error validating recipient:', error)
      setValidationState({ 
        isValidating: false, 
        error: error instanceof Error ? error.message : 'Invalid address',
        isValid: false,
        tokenAccount: null
      })
    }
  }

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0 || !validationState.isValid || !validationState.tokenAccount || !mintPublicKey) {
      toast.error('Please complete all fields with valid information')
      return
    }
    
    try {
      const tokenAmount = parseFloat(amount) * Math.pow(10, decimals)
      
      await transferMutation.mutateAsync({
        amount: tokenAmount,
        recipientAddress: validationState.tokenAccount.toBase58(),
        mintAddress: mintPublicKey.toBase58(),
      })
      
      hide()
      setAmount('')
      setRecipientAddress('')
      toast.success('Transfer submitted successfully')
    } catch (error) {
      console.error('Transfer failed:', error)
      toast.error(`Transfer failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Transfer Confidential Balance"
      submitDisabled={!amount || parseFloat(amount) <= 0 || !validationState.isValid || transferMutation.isPending || validationState.isValidating || isLoading}
      submitLabel={transferMutation.isPending ? "Processing..." : "Confirm Transfer"}
      submit={handleSubmit}
    >
      {isLoading ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner"></span>
          <span className="ml-2">Loading token information...</span>
        </div>
      ) : mintInfoQuery.error ? (
        <div className="alert alert-error">
          <p>Error loading token information</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="mb-2 text-sm">
              <span className="badge badge-info">{tokenType}</span>
              <span className="ml-2 badge badge-ghost">{decimals} decimals</span>
            </div>
          </div>

          {/* Address Type Selection */}
          <div className="form-control mb-4">
            <label className="label justify-start">
              <span className="label-text mr-4">Recipient:</span>
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="address-type" 
                    className="radio radio-sm radio-primary mr-2" 
                    checked={addressType === 'system'} 
                    onChange={() => setAddressType('system')}
                  />
                  <span className="label-text">Wallet</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="address-type" 
                    className="radio radio-sm radio-primary mr-2" 
                    checked={addressType === 'token'} 
                    onChange={() => setAddressType('token')}
                  />
                  <span className="label-text">Token Account</span>
                </label>
              </div>
            </label>
          </div>

          {/* Recipient Address Input */}
          <div className="form-control mb-4">
            <input
              type="text"
              placeholder={addressType === 'system' ? "Recipient's wallet address" : "Token account address"}
              className={`input input-bordered w-full ${
                validationState.isValid ? 'input-success' : validationState.error ? 'input-error' : ''
              }`}
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              disabled={transferMutation.isPending}
            />
            
            {validationState.isValidating && (
              <label className="label">
                <span className="label-text-alt"><span className="loading loading-spinner loading-xs mr-1"></span>Validating...</span>
              </label>
            )}
            
            {validationState.error && (
              <label className="label">
                <span className="label-text-alt text-error">{validationState.error}</span>
              </label>
            )}
            
            {validationState.isValid && (
              <label className="label">
                <span className="label-text-alt text-success">
                  ✓ {addressType === 'system' ? 'Valid wallet with initialized token account' : 'Valid token account'}
                </span>
              </label>
            )}
          </div>

          {/* Amount Input */}
          <div className="form-control">
            <input
              type="number"
              placeholder="Amount (tokens)"
              className="input input-bordered w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={transferMutation.isPending}
              step={`${1 / Math.pow(10, decimals)}`}
              min="0"
              required
            />
            {tokenUnits && (
              <label className="label">
                <span className="label-text-alt">{tokenUnits}</span>
              </label>
            )}
          </div>
        </>
      )}
    </AppModal>
  )
}

function ModalInitATA({ show, hide, address, initializeAccount, isInitializing }: { 
  show: boolean; 
  hide: () => void; 
  address: PublicKey;
  initializeAccount: (params: { mintAddress: string }) => void;
  isInitializing: boolean;
}) {
  const [mintAddress, setMintAddress] = useState('')
  const [validMintAddress, setValidMintAddress] = useState(false)


  // Validate the input mint address when it changes
  useEffect(() => {
    // Only validate when we have a string that's the right length for a base58 Solana address (typically 32-44 chars)
    if (mintAddress.length >= 32 && mintAddress.length <= 44) {
      try {
        // Try to create a PublicKey to validate the address
        new PublicKey(mintAddress)
        setValidMintAddress(true)
      } catch (error) {
        setValidMintAddress(false)
      }
    } else {
      setValidMintAddress(false)
    }
  }, [mintAddress])

  const handleSubmit = () => {
    if (!validMintAddress) {
      toast.error('Please enter a valid mint address')
      return
    }
    
    try {
      initializeAccount({ mintAddress })
      hide()
      toast.success('Initialize ATA transaction submitted')
    } catch (error) {
      console.error('Initialize ATA failed:', error)
      toast.error(`Initialize ATA failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Initialize Associated Token Account"
      submitDisabled={!validMintAddress || isInitializing}
      submitLabel={isInitializing ? "Processing..." : "Initialize"}
      submit={handleSubmit}
    >
      <div className="form-control">
        <label className="label">
          <span className="label-text">Token Mint Address</span>
        </label>
        <input
          type="text"
          placeholder="Enter Solana mint address in base58"
          className={`input input-bordered w-full ${validMintAddress ? 'input-success' : mintAddress ? 'input-error' : ''}`}
          value={mintAddress}
          onChange={(e) => setMintAddress(e.target.value)}
          disabled={isInitializing}
        />
        {mintAddress && !validMintAddress && (
          <label className="label">
            <span className="label-text-alt text-error">Invalid mint address format</span>
          </label>
        )}
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>This will create an Associated Token Account (ATA) for this mint address with your wallet as the owner.</p>
      </div>
    </AppModal>
  )
}


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
  const { mutate: initializeAccount, isPending: isInitializing } = useCreateAssociatedTokenAccountCB({ address })
  
  const handleInitialize = (params: { mintAddress: string }) => {
    initializeAccount(params)
  }

  return (
    <div>
      <ModalInitializeAta 
        show={showInitializeModal} 
        hide={() => setShowInitializeModal(false)} 
        address={address} 
        initializeAccount={handleInitialize} 
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
  const [showApplyModal, setShowApplyModal] = useState(false)
  
  const { mutate: applyPendingBalance, isPending: isApplying } = useApplyCB({ address })

  const handleApply = (params: { tokenAccount: string }) => {
    try {
      applyPendingBalance({
        tokenAccount: params.tokenAccount
      })
    } catch (error) {
      toast.error(`Error applying balance: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div>
      <ModalDeposit show={showDepositModal} hide={() => setShowDepositModal(false)} address={address} />
      <ModalTransfer show={showTransferModal} hide={() => setShowTransferModal(false)} address={address} />
      <ModalWithdraw show={showWithdraw} hide={() => setShowWithdraw(false)} address={address} />
      <ModalApply 
        show={showApplyModal} 
        hide={() => setShowApplyModal(false)} 
        address={address} 
        handleApply={handleApply} 
        isApplying={isApplying} 
      />
      
      <div className="space-x-2">
        <button 
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowDepositModal(true)}
        >
          Deposit
        </button>
        <button 
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowApplyModal(true)}
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
  const [mintAddress, setMintAddress] = useState('')
  const [validMintAddress, setValidMintAddress] = useState(false)
  const mintInfoQuery = useGetMintInfo({ mintAddress: validMintAddress ? mintAddress : '' })
  const [decimals, setDecimals] = useState(9) // Default to 9 decimals until we load the actual value
  
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
  
  useEffect(() => {
    if (mintInfoQuery.data) {
      setDecimals(mintInfoQuery.data.decimals)
      console.log(`Mint decimals: ${mintInfoQuery.data.decimals}`)
      console.log(`Mint authority: ${mintInfoQuery.data.mintAuthority?.toBase58() || 'None'}`)
      console.log(`Is Token-2022: ${mintInfoQuery.data.isToken2022 ? 'Yes' : 'No'}`)
    }
  }, [mintInfoQuery.data])
  
  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (!validMintAddress) {
      toast.error('Please enter a valid mint address')
      return
    }
    
    try {
      // Convert to token units based on mint decimals
      const factor = Math.pow(10, decimals)
      const tokenAmount = (parseFloat(amount) * factor).toString()
      
      await depositMutation.mutateAsync({ 
        lamportAmount: tokenAmount,
        mintDecimals: decimals,
        mintAddress
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

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Deposit to Confidential Balance"
      submitDisabled={!amount || parseFloat(amount) <= 0 || !validMintAddress || depositMutation.isPending || mintInfoQuery.isLoading}
      submitLabel={depositMutation.isPending ? "Processing..." : "Confirm Deposit"}
      submit={handleSubmit}
    >
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Token Mint Address</span>
        </label>
        <input
          type="text"
          placeholder="Enter Solana mint address in base58"
          className={`input input-bordered w-full ${validMintAddress ? 'input-success' : mintAddress ? 'input-error' : ''}`}
          value={mintAddress}
          onChange={(e) => setMintAddress(e.target.value)}
          disabled={depositMutation.isPending}
        />
        {mintAddress && !validMintAddress && (
          <label className="label">
            <span className="label-text-alt text-error">Invalid mint address format</span>
          </label>
        )}
      </div>

      {mintInfoQuery.isLoading ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner"></span>
          <span className="ml-2">Loading mint information...</span>
        </div>
      ) : mintInfoQuery.error ? (
        <div className="flex flex-col gap-2">
          <div className="alert alert-error">
            <p>Error loading mint information:</p>
            <p className="text-sm break-all">{mintInfoQuery.error instanceof Error ? mintInfoQuery.error.message : 'Unknown error'}</p>
          </div>
          <div className="alert alert-info">
            <p>This could be because:</p>
            <ul className="list-disc list-inside text-sm">
              <li>The mint address is not a valid token mint</li>
              <li>The mint is using a different token program than expected</li>
              <li>The account exists but is not a token mint account</li>
            </ul>
            <p className="mt-2 text-sm">Using default 9 decimals for calculations.</p>
          </div>
        </div>
      ) : validMintAddress && mintInfoQuery.data ? (
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
      ) : null}
    </AppModal>
  )
}

function ModalWithdraw({ show, hide, address }: { show: boolean; hide: () => void; address: PublicKey }) {
  const [amount, setAmount] = useState('')
  const withdrawMutation = useWithdrawCB({ address })
  const [mintAddress, setMintAddress] = useState('')
  const [validMintAddress, setValidMintAddress] = useState(false)
  const mintInfoQuery = useGetMintInfo({ mintAddress: validMintAddress ? mintAddress : '' })
  const [decimals, setDecimals] = useState(9) // Default to 9 decimals until we load the actual value
  
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
  
  useEffect(() => {
    if (mintInfoQuery.data) {
      setDecimals(mintInfoQuery.data.decimals)
      console.log(`Mint decimals: ${mintInfoQuery.data.decimals}`)
      console.log(`Mint authority: ${mintInfoQuery.data.mintAuthority?.toBase58() || 'None'}`)
      console.log(`Is Token-2022: ${mintInfoQuery.data.isToken2022 ? 'Yes' : 'No'}`)
    }
  }, [mintInfoQuery.data])
  
  const handleSubmit = async () => {
    console.log('Withdraw submit button clicked, amount:', amount)
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (!validMintAddress) {
      toast.error('Please enter a valid mint address')
      return
    }
    
    try {
      // Convert to token units based on mint decimals
      const factor = Math.pow(10, decimals)
      const tokenAmount = parseFloat(amount) * factor
      
      console.log('Withdraw amount in token units:', tokenAmount)
      
      await withdrawMutation.mutateAsync({ 
        amount: tokenAmount,
        mintAddress
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
  }, [mintInfoQuery.data]);

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Withdraw from Confidential Balance"
      submitDisabled={!amount || parseFloat(amount) <= 0 || !validMintAddress || withdrawMutation.isPending || mintInfoQuery.isLoading}
      submitLabel={withdrawMutation.isPending ? "Processing..." : "Confirm Withdraw"}
      submit={handleSubmit}
    >
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Token Mint Address</span>
        </label>
        <input
          type="text"
          placeholder="Enter Solana mint address in base58"
          className={`input input-bordered w-full ${validMintAddress ? 'input-success' : mintAddress ? 'input-error' : ''}`}
          value={mintAddress}
          onChange={(e) => setMintAddress(e.target.value)}
          disabled={withdrawMutation.isPending}
        />
        {mintAddress && !validMintAddress && (
          <label className="label">
            <span className="label-text-alt text-error">Invalid mint address format</span>
          </label>
        )}
      </div>

      {mintInfoQuery.isLoading ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner"></span>
          <span className="ml-2">Loading mint information...</span>
        </div>
      ) : mintInfoQuery.error ? (
        <div className="flex flex-col gap-2">
          <div className="alert alert-error">
            <p>Error loading mint information:</p>
            <p className="text-sm break-all">{mintInfoQuery.error instanceof Error ? mintInfoQuery.error.message : 'Unknown error'}</p>
          </div>
          <div className="alert alert-info">
            <p>This could be because:</p>
            <ul className="list-disc list-inside text-sm">
              <li>The mint address is not a valid token mint</li>
              <li>The mint is using a different token program than expected</li>
              <li>The account exists but is not a token mint account</li>
            </ul>
            <p className="mt-2 text-sm">Using default 9 decimals for calculations.</p>
          </div>
        </div>
      ) : validMintAddress && mintInfoQuery.data ? (
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
      ) : null}
    </AppModal>
  )
}

function ModalTransfer({ show, hide, address }: { show: boolean; hide: () => void; address: PublicKey }) {
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const transferMutation = useTransferCB({ address })
  const [mintAddress, setMintAddress] = useState('')
  const [validMintAddress, setValidMintAddress] = useState(false)
  const mintInfoQuery = useGetMintInfo({ mintAddress: validMintAddress ? mintAddress : '' })
  const [decimals, setDecimals] = useState(9) // Default to 9 decimals until we load the actual value
  const { connection } = useConnection()
  const [isValidatingRecipient, setIsValidatingRecipient] = useState(false)
  const [recipientValidationError, setRecipientValidationError] = useState('')
  const [recipientValid, setRecipientValid] = useState(false)
  
  // Validate the mint address
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
  
  useEffect(() => {
    if (mintInfoQuery.data) {
      setDecimals(mintInfoQuery.data.decimals)
      console.log(`Mint decimals: ${mintInfoQuery.data.decimals}`)
    }
  }, [mintInfoQuery.data])
  
  const validateRecipient = async () => {
    if (!recipientAddress) {
      setRecipientValidationError('')
      setRecipientValid(false)
      return
    }
    
    setIsValidatingRecipient(true)
    setRecipientValidationError('')
    try {
      // First, validate the address is a valid Solana public key
      const recipientPublicKey = new PublicKey(recipientAddress)
      
      // Next, check if the associated token account exists for this recipient
      if (validMintAddress) {
        const mintPublicKey = new PublicKey(mintAddress)
        const recipientTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          recipientPublicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        )
        
        // Check if the token account exists
        const tokenAccountInfo = await connection.getAccountInfo(recipientTokenAccount)
        
        if (!tokenAccountInfo) {
          setRecipientValidationError("Recipient's token account does not exist. They need to initialize their token account first.")
          setRecipientValid(false)
        } else {
          setRecipientValid(true)
        }
      } else {
        // If we don't have a valid mint yet, just validate the address format
        setRecipientValid(true)
      }
    } catch (error) {
      console.error('Error validating recipient:', error)
      setRecipientValidationError(error instanceof Error ? error.message : 'Invalid recipient address')
      setRecipientValid(false)
    } finally {
      setIsValidatingRecipient(false)
    }
  }
  
  // Validate recipient when address changes or when a valid mint is selected
  useEffect(() => {
    if (recipientAddress) {
      const timer = setTimeout(() => {
        validateRecipient()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [recipientAddress, validMintAddress, mintAddress])

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (!recipientAddress || !recipientValid) {
      toast.error('Please enter a valid recipient address')
      return
    }
    
    if (!validMintAddress) {
      toast.error('Please enter a valid mint address')
      return
    }
    
    try {
      // Convert to token units based on mint decimals
      const factor = Math.pow(10, decimals)
      const tokenAmount = parseFloat(amount) * factor
      
      await transferMutation.mutateAsync({
        amount: tokenAmount,
        recipientAddress,
        mintAddress
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
  }, [mintInfoQuery.data]);

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Transfer Confidential Balance"
      submitDisabled={
        !amount || 
        parseFloat(amount) <= 0 || 
        !recipientAddress || 
        !recipientValid ||
        !validMintAddress ||
        transferMutation.isPending || 
        isValidatingRecipient
      }
      submitLabel={transferMutation.isPending ? "Processing..." : "Confirm Transfer"}
      submit={handleSubmit}
    >
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Token Mint Address</span>
        </label>
        <input
          type="text"
          placeholder="Enter Solana mint address in base58"
          className={`input input-bordered w-full ${validMintAddress ? 'input-success' : mintAddress ? 'input-error' : ''}`}
          value={mintAddress}
          onChange={(e) => setMintAddress(e.target.value)}
          disabled={transferMutation.isPending}
        />
        {mintAddress && !validMintAddress && (
          <label className="label">
            <span className="label-text-alt text-error">Invalid mint address format</span>
          </label>
        )}
      </div>

      {mintInfoQuery.isLoading ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner"></span>
          <span className="ml-2">Loading mint information...</span>
        </div>
      ) : mintInfoQuery.error && validMintAddress ? (
        <div className="flex flex-col gap-2 mb-4">
          <div className="alert alert-error">
            <p>Error loading mint information:</p>
            <p className="text-sm break-all">{mintInfoQuery.error instanceof Error ? mintInfoQuery.error.message : 'Unknown error'}</p>
          </div>
        </div>
      ) : validMintAddress && mintInfoQuery.data ? (
        <div className="mb-4">
          <div className="mb-2 text-sm">
            <span className="badge badge-info">{tokenType}</span>
            <span className="ml-2 badge badge-ghost">{decimals} decimals</span>
          </div>
        </div>
      ) : null}

      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Recipient Address</span>
        </label>
        <input
          type="text"
          placeholder="Enter recipient's Solana address"
          className={`input input-bordered w-full ${
            recipientValid ? 'input-success' : recipientValidationError ? 'input-error' : ''
          }`}
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          disabled={transferMutation.isPending}
        />
        {isValidatingRecipient && (
          <label className="label">
            <span className="label-text-alt">
              <span className="loading loading-spinner loading-xs mr-1"></span>
              Validating...
            </span>
          </label>
        )}
        {recipientValidationError && (
          <label className="label">
            <span className="label-text-alt text-error">{recipientValidationError}</span>
          </label>
        )}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Amount (Tokens)</span>
        </label>
        <input
          type="number"
          placeholder="Enter amount"
          className="input input-bordered w-full"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={transferMutation.isPending}
          step={`${1 / Math.pow(10, decimals)}`}
          min="0"
          required
        />
        <label className="label">
          <span className="label-text-alt">
            {tokenUnits}
          </span>
        </label>
      </div>
    </AppModal>
  )
}

function ModalInitializeAta({ show, hide, address, initializeAccount, isInitializing }: { 
  show: boolean; 
  hide: () => void; 
  address: PublicKey;
  initializeAccount: (params: { mintAddress: string }) => void;
  isInitializing: boolean;
}) {
  const [mintAddress, setMintAddress] = useState('')
  const [validMintAddress, setValidMintAddress] = useState(false)
  const mintInfoQuery = useGetMintInfo({ mintAddress: validMintAddress ? mintAddress : '' })

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

  // Get the token type from the mint info
  const tokenType = useMemo(() => {
    if (!mintInfoQuery.data) return 'Unknown'
    return mintInfoQuery.data.isToken2022 ? 'Token-2022' : 'Standard Token'
  }, [mintInfoQuery.data])

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

      {validMintAddress && (
        <div className="mt-4 p-4 bg-base-200 rounded-lg">
          <h3 className="font-medium mb-2">Mint Information</h3>
          
          {mintInfoQuery.isLoading ? (
            <div className="flex items-center justify-center py-2">
              <span className="loading loading-spinner loading-sm mr-2"></span>
              <span>Loading mint data...</span>
            </div>
          ) : mintInfoQuery.error ? (
            <div className="alert alert-error text-sm">
              <p>Error loading mint information:</p>
              <p className="break-all">{mintInfoQuery.error instanceof Error ? mintInfoQuery.error.message : 'Unknown error'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Token Type:</div>
              <div>{tokenType}</div>
              
              <div className="font-medium">Decimals:</div>
              <div>{mintInfoQuery.data?.decimals}</div>
              
              <div className="font-medium">Supply:</div>
              <div>{mintInfoQuery.data?.supply?.toString() || '0'}</div>
              
              <div className="font-medium">Authority:</div>
              <div className="break-all">{mintInfoQuery.data?.mintAuthority?.toBase58() || 'None'}</div>
              
              <div className="font-medium">Freeze Authority:</div>
              <div className="break-all">{mintInfoQuery.data?.freezeAuthority?.toBase58() || 'None'}</div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-sm text-base-content/70">
        <p>This will create an Associated Token Account (ATA) for this mint address with your wallet as the owner.</p>
      </div>
    </AppModal>
  )
}

function ModalApply({ show, hide, address, handleApply, isApplying, mint }: { 
  show: boolean; 
  hide: () => void; 
  address: PublicKey;
  handleApply: (params: { tokenAccount: string }) => void;
  isApplying: boolean;
  mint?: PublicKey;
}) {
  const { connection } = useConnection()
  const [tokenAccount, setTokenAccount] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [validationError, setValidationError] = useState('')

  // Validate token account when it changes
  useEffect(() => {
    if (tokenAccount.length >= 32 && tokenAccount.length <= 44) {
      validateTokenAccount()
    } else {
      setIsValid(false)
      setValidationError('')
    }
  }, [tokenAccount])

  const validateTokenAccount = async () => {
    if (!tokenAccount) return
    
    setIsValidating(true)
    setValidationError('')
    
    try {
      // Check if it's a valid public key
      const pubkey = new PublicKey(tokenAccount)
      
      // Check if the account exists
      const accountInfo = await connection.getAccountInfo(pubkey)
      if (!accountInfo) {
        setValidationError('Token account does not exist')
        setIsValid(false)
      } else {
        setIsValid(true)
      }
    } catch (error) {
      console.error('Error validating token account:', error)
      setValidationError(error instanceof Error ? error.message : 'Invalid token account address')
      setIsValid(false)
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = () => {
    if (!isValid) {
      toast.error('Please enter a valid token account address')
      return
    }
    
    try {
      handleApply({ tokenAccount })
      hide()
      toast.success('Apply transaction submitted')
    } catch (error) {
      console.error('Apply failed:', error)
      toast.error(`Apply failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Apply to Confidential Balance"
      submitDisabled={!isValid || isApplying || isValidating}
      submitLabel={isApplying ? "Processing..." : "Apply"}
      submit={handleSubmit}
    >
      <div className="mb-4">
        <p className="text-sm">
          Apply your pending balance to make it available for confidential transfers.
        </p>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Token Account Address</span>
        </label>
        <input
          type="text"
          placeholder="Enter token account address"
          className={`input input-bordered w-full ${isValid ? 'input-success' : validationError ? 'input-error' : ''}`}
          value={tokenAccount}
          onChange={(e) => setTokenAccount(e.target.value)}
          disabled={isApplying}
        />
        
        {isValidating && (
          <label className="label">
            <span className="label-text-alt">
              <span className="loading loading-spinner loading-xs mr-1"></span>
              Validating...
            </span>
          </label>
        )}
        
        {validationError && (
          <label className="label">
            <span className="label-text-alt text-error">{validationError}</span>
          </label>
        )}
        
        {isValid && !validationError && (
          <label className="label">
            <span className="label-text-alt text-success">✓ Valid token account</span>
          </label>
        )}
      </div>
    </AppModal>
  )
}

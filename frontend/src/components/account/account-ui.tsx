'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { IconRefresh } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, useEffect } from 'react'
import { AppModal, ellipsify } from '../ui/ui-layout'
import { useCluster } from '../cluster/cluster-data-access'
import { ExplorerLink } from '../cluster/cluster-ui'
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { getAssociatedTokenAddress } from '@solana/spl-token'
import { useConnection } from '@solana/wallet-adapter-react'
import {
  useGetBalance,
  useGetSignatures,
  useGetTokenAccounts,
  useRequestAirdrop,
  useTransferSol,
  useDepositCb,
  useInitializeAccount,
  useGetMintInfo,
  useApplyPendingBalance,
  useTransferCb,
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

export function AccountButtons({ address, mint, decimals }: { 
  address: PublicKey, 
  mint?: PublicKey,
  decimals?: number 
}) {
  const wallet = useWallet()
  const { cluster } = useCluster()
  const [showAirdropModal, setShowAirdropModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  
  const { mutate: initializeAccount, isPending: isInitializing } = useInitializeAccount({ address })
  const { mutate: applyPendingBalance, isPending: isApplying } = useApplyPendingBalance({ address })
  
  const defaultMint = new PublicKey('Dsurjp9dMjFmxq4J3jzZ8As32TgwLCftGyATiQUFu11D')
  
  const handleInitialize = () => {
    initializeAccount()
  }

  const handleApply = () => {
    applyPendingBalance({
      mint: mint || defaultMint,
      mintDecimals: decimals || 9
    })
  }

  return (
    <div>
      <ModalAirdrop hide={() => setShowAirdropModal(false)} address={address} show={showAirdropModal} />
      <ModalReceive address={address} show={showReceiveModal} hide={() => setShowReceiveModal(false)} />
      <ModalSend address={address} show={showSendModal} hide={() => setShowSendModal(false)} />
      <ModalDeposit show={showDepositModal} hide={() => setShowDepositModal(false)} address={address} />
      <ModalTransferCb show={showTransferModal} hide={() => setShowTransferModal(false)} address={address} />
      <div className="space-x-2">
        <button
          disabled={cluster.network?.includes('mainnet')}
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowAirdropModal(true)}
        >
          Airdrop
        </button>
        <button
          disabled={wallet.publicKey?.toString() !== address.toString()}
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowSendModal(true)}
        >
          Send
        </button>
        <button className="btn btn-xs lg:btn-md btn-outline" onClick={() => setShowReceiveModal(true)}>
          Receive
        </button>
      </div>
      <div className="mt-2">
        <button 
          className="btn btn-xs lg:btn-md btn-outline" 
          onClick={handleInitialize}
          disabled={isInitializing}
        >
          {isInitializing ? 
            <span className="loading loading-spinner loading-xs"></span> : 
            'Initialize ATA'
          }
        </button>
        <button 
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowDepositModal(true)}
        >
          Deposit
        </button>
        <button 
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={handleApply}
          disabled={isApplying || !wallet.publicKey?.equals(address)}
        >
          {isApplying ? 
            <span className="loading loading-spinner loading-xs"></span> : 
            'Apply'
          }
        </button>
        <button className="btn btn-xs lg:btn-md btn-outline">
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
                          <ExplorerLink label={ellipsify(pubkey.toString())} path={`account/${pubkey.toString()}`} />
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
  // Default mint address - replace with the actual mint address you're using
  const mintAddress = "Dsurjp9dMjFmxq4J3jzZ8As32TgwLCftGyATiQUFu11D"
  const mintInfoQuery = useGetMintInfo({ mintAddress })
  const [decimals, setDecimals] = useState(9) // Default to 9 decimals until we load the actual value
  
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
    
    try {
      // Convert to token units based on mint decimals
      const factor = Math.pow(10, decimals)
      const tokenAmount = (parseFloat(amount) * factor).toString()
      
      await depositMutation.mutateAsync({ 
        lamportAmount: tokenAmount,
        mintDecimals: decimals
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
  }, [mintInfoQuery.data]);

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Deposit to Confidential Balance"
      submitDisabled={!amount || parseFloat(amount) <= 0 || depositMutation.isPending || mintInfoQuery.isLoading}
      submitLabel={depositMutation.isPending ? "Processing..." : "Confirm Deposit"}
      submit={handleSubmit}
    >
      {mintInfoQuery.isLoading ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner"></span>
          <span className="ml-2">Loading mint information...</span>
        </div>
      ) : mintInfoQuery.isError ? (
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

function ModalTransferCb({ show, hide, address }: { show: boolean; hide: () => void; address: PublicKey }) {
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const transferMutation = useTransferCb({ address })
  // Default mint address - same as in ModalDeposit
  const mintAddress = "Dsurjp9dMjFmxq4J3jzZ8As32TgwLCftGyATiQUFu11D"
  const mintInfoQuery = useGetMintInfo({ mintAddress })
  const [decimals, setDecimals] = useState(9) // Default to 9 decimals until we load the actual value
  const { connection } = useConnection()
  const [isValidatingRecipient, setIsValidatingRecipient] = useState(false)
  const [recipientValidationError, setRecipientValidationError] = useState('')
  const [recipientValid, setRecipientValid] = useState(false)
  
  useEffect(() => {
    if (mintInfoQuery.data) {
      setDecimals(mintInfoQuery.data.decimals)
      console.log(`Mint decimals: ${mintInfoQuery.data.decimals}`)
    }
  }, [mintInfoQuery.data])
  
  // Validate recipient address
  useEffect(() => {
    const validateRecipient = async () => {
      if (!recipientAddress.trim()) {
        setRecipientValidationError('')
        setRecipientValid(false)
        return
      }

      try {
        setIsValidatingRecipient(true)
        setRecipientValidationError('')
        
        // Validate Solana address format
        let recipientPubkey: PublicKey
        try {
          recipientPubkey = new PublicKey(recipientAddress)
        } catch (error) {
          setRecipientValidationError('Invalid Solana address format')
          setRecipientValid(false)
          return
        }
        
        // Get associated token account for recipient
        const mintPubkey = new PublicKey(mintAddress)
        const recipientTokenAccount = await getAssociatedTokenAddress(
          mintPubkey,
          recipientPubkey,
          false,
          TOKEN_2022_PROGRAM_ID
        )
        
        // Get the account info to verify it exists
        const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount)
        if (!recipientAccountInfo) {
          setRecipientValidationError('Recipient token account not found')
          setRecipientValid(false)
          return
        }
        
        // If we got here, the recipient is valid
        setRecipientValid(true)
      } catch (error) {
        console.error('Error validating recipient:', error)
        setRecipientValidationError(`Error: ${error instanceof Error ? error.message : String(error)}`)
        setRecipientValid(false)
      } finally {
        setIsValidatingRecipient(false)
      }
    }
    
    // Debounce validation to avoid excessive API calls
    const timeoutId = setTimeout(validateRecipient, 500)
    return () => clearTimeout(timeoutId)
  }, [recipientAddress, connection, mintAddress])
  
  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (!recipientValid) {
      toast.error('Invalid recipient')
      return
    }
    
    try {
      // Convert to token units based on mint decimals
      const factor = Math.pow(10, decimals)
      
      // Use BigInt for calculation to handle large token amounts correctly
      // Note: We use Math.round to handle floating point imprecision before converting to BigInt
      const tokenAmountFloat = parseFloat(amount) * factor
      const tokenAmount = Math.round(tokenAmountFloat)
      
      if (!Number.isSafeInteger(tokenAmount)) {
        console.warn(
          `Warning: Token amount ${tokenAmount} exceeds safe integer range. ` +
          `This may cause precision issues.`
        )
      }
      
      // Show a loading toast that we'll update with progress
      const loadingToastId = toast.loading('Preparing transfer transaction...')
      
      try {
        await transferMutation.mutateAsync({ 
          amount: tokenAmount,
          recipientAddress: recipientAddress
        })
        
        // Success - update the loading toast and show success
        toast.dismiss(loadingToastId)
        hide()
        setAmount('')
        setRecipientAddress('')
        toast.success('Transfer submitted successfully')
      } catch (error) {
        // Dismiss the loading toast and show error
        toast.dismiss(loadingToastId)
        
        console.error('Transfer failed:', error)
        
        // Provide more specific error messages based on the error
        if (error instanceof Error) {
          if (error.message.includes('Transaction simulation failed')) {
            toast.error('Transaction simulation failed. This may be due to insufficient funds or an issue with the recipient account.')
          } else if (error.message.includes('User rejected')) {
            toast.error('Transaction was rejected by the wallet.')
          } else {
            toast.error(`Transfer failed: ${error.message}`)
          }
        } else {
          toast.error(`Transfer failed: ${String(error)}`)
        }
      }
    } catch (error) {
      console.error('Error preparing transfer:', error)
      toast.error(`Error preparing transfer: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Calculate the token units based on the input amount
  const tokenUnits = useMemo(() => {
    if (!amount) return ''
    const factor = Math.pow(10, decimals)
    return `${parseFloat(amount) * factor} token units`
  }, [amount, decimals])

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Transfer Confidential Balance"
      submitDisabled={
        !amount || 
        parseFloat(amount) <= 0 || 
        !recipientValid || 
        transferMutation.isPending || 
        mintInfoQuery.isLoading ||
        isValidatingRecipient
      }
      submitLabel={transferMutation.isPending ? "Processing..." : "Confirm Transfer"}
      submit={handleSubmit}
    >
      {mintInfoQuery.isLoading ? (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner"></span>
          <span className="ml-2">Loading mint information...</span>
        </div>
      ) : mintInfoQuery.isError ? (
        <div className="flex flex-col gap-2">
          <div className="alert alert-error">
            <p>Error loading mint information:</p>
            <p className="text-sm break-all">{mintInfoQuery.error instanceof Error ? mintInfoQuery.error.message : 'Unknown error'}</p>
          </div>
          <div className="alert alert-info">
            <p>Using default 9 decimals for calculations.</p>
          </div>
        </div>
      ) : (
        <div className="form-control space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Recipient Address</span>
            </label>
            <input
              type="text"
              placeholder="Enter recipient Solana address"
              className={`input input-bordered w-full ${recipientValidationError ? 'input-error' : ''}`}
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              disabled={transferMutation.isPending}
              required
            />
            {isValidatingRecipient && (
              <div className="flex items-center mt-1 text-sm">
                <span className="loading loading-spinner loading-xs mr-1"></span>
                Validating recipient...
              </div>
            )}
            {recipientValidationError && (
              <div className="text-error text-sm mt-1">{recipientValidationError}</div>
            )}
            {recipientValid && !recipientValidationError && (
              <div className="text-success text-sm mt-1">✓ Valid recipient</div>
            )}
          </div>
          
          <div>
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
          
          <div className="alert alert-info">
            <p>Note: Transfers are confidential and will not be visible on explorers.</p>
          </div>
        </div>
      )}
    </AppModal>
  )
}

export function AccountActions({ address }: { address: PublicKey }) {
  const [showAirdropModal, setShowAirdropModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const wallet = useWallet()
  const { cluster } = useCluster()
  
  const { mutate: initializeAccount, isPending: isInitializing } = useInitializeAccount({ address })
  
  const handleInitialize = () => {
    initializeAccount()
  }

  return (
    <div className="flex flex-wrap gap-2">
      <ModalAirdrop hide={() => setShowAirdropModal(false)} address={address} show={showAirdropModal} />
      <ModalReceive address={address} show={showReceiveModal} hide={() => setShowReceiveModal(false)} />
      <ModalSend address={address} show={showSendModal} hide={() => setShowSendModal(false)} />
      <ModalDeposit show={showDepositModal} hide={() => setShowDepositModal(false)} address={address} />
      <ModalTransferCb show={showTransferModal} hide={() => setShowTransferModal(false)} address={address} />
      <button
        disabled={cluster.network?.includes('mainnet')}
        className="btn btn-xs lg:btn-md btn-outline"
        onClick={() => setShowAirdropModal(true)}
      >
        Airdrop
      </button>
      <button
        disabled={wallet.publicKey?.toString() !== address.toString()}
        className="btn btn-xs lg:btn-md btn-outline"
        onClick={() => setShowSendModal(true)}
      >
        Send
      </button>
      <button className="btn btn-xs lg:btn-md btn-outline" onClick={() => setShowReceiveModal(true)}>
        Receive
      </button>
      <button 
        className="btn btn-xs lg:btn-md btn-outline" 
        onClick={handleInitialize}
        disabled={isInitializing}
      >
        {isInitializing ? 
          <span className="loading loading-spinner loading-xs"></span> : 
          'Initialize ATA'
        }
      </button>
      <button 
        className="btn btn-xs lg:btn-md btn-outline"
        onClick={() => setShowDepositModal(true)}
      >
        Deposit
      </button>
      <button className="btn btn-xs lg:btn-md btn-outline">
        Withdraw
      </button>
      <button 
        className="btn btn-xs lg:btn-md btn-outline"
        onClick={() => setShowTransferModal(true)}
      >
        Transfer
      </button>
    </div>
  )
}

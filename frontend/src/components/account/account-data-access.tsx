'use client'

import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useTransactionToast } from '../ui/ui-layout'
import { getMint } from '@solana/spl-token'
import { getAssociatedTokenAddress } from '@solana/spl-token'

export function useGetBalance({ address }: { address: PublicKey }) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getBalance(address),
  })
}

export function useGetSignatures({ address }: { address: PublicKey }) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getSignaturesForAddress(address),
  })
}

export function useGetTokenAccounts({ address }: { address: PublicKey }) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-token-accounts', { endpoint: connection.rpcEndpoint, address }],
    queryFn: async () => {
      const [tokenAccounts, token2022Accounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_PROGRAM_ID,
        }),
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_2022_PROGRAM_ID,
        }),
      ])
      return [...tokenAccounts.value, ...token2022Accounts.value]
    },
  })
}

export function useTransferSol({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const transactionToast = useTransactionToast()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['transfer-sol', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (input: { destination: PublicKey; amount: number }) => {
      let signature: TransactionSignature = ''
      try {
        const { transaction, latestBlockhash } = await createTransaction({
          publicKey: address,
          destination: input.destination,
          amount: input.amount,
          connection,
        })

        // Send transaction and await for signature
        signature = await wallet.sendTransaction(transaction, connection)

        // Send transaction and await for signature
        await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

        console.log(signature)
        return signature
      } catch (error: unknown) {
        console.log('error', `Transaction failed! ${error}`, signature)

        return
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature)
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`)
    },
  })
}

export function useRequestAirdrop({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const transactionToast = useTransactionToast()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['airdrop', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (amount: number = 1) => {
      const [latestBlockhash, signature] = await Promise.all([
        connection.getLatestBlockhash(),
        connection.requestAirdrop(address, amount * LAMPORTS_PER_SOL),
      ])

      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return Promise.all([
        client.invalidateQueries({
          queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
        }),
      ])
    },
  })
}

async function createTransaction({
  publicKey,
  destination,
  amount,
  connection,
}: {
  publicKey: PublicKey
  destination: PublicKey
  amount: number
  connection: Connection
}): Promise<{
  transaction: VersionedTransaction
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number }
}> {
  // Get the latest blockhash to use in our transaction
  const latestBlockhash = await connection.getLatestBlockhash()

  // Create instructions to send, in this case a simple transfer
  const instructions = [
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: destination,
      lamports: amount * LAMPORTS_PER_SOL,
    }),
  ]

  // Create a new TransactionMessage with version and compile it to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToLegacyMessage()

  // Create a new VersionedTransaction which supports legacy and v0
  const transaction = new VersionedTransaction(messageLegacy)

  return {
    transaction,
    latestBlockhash,
  }
}

export function useCreateAssociatedTokenAccountCB({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const client = useQueryClient()
  const transactionToast = useTransactionToast()
  const wallet = useWallet()

  return useMutation({
    mutationKey: ['initialize-account', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (params: { mintAddress: string }) => {
      try {
        // First, sign the message "ElGamalSecret"
        if (!wallet.signMessage) {
          throw new Error("Wallet does not support message signing");
        }
        
        // Sign the ElGamal message
        const elGamalMessageToSign = new TextEncoder().encode("ElGamalSecret");
        const elGamalSignature = await wallet.signMessage(elGamalMessageToSign);
        const elGamalSignatureBase64 = Buffer.from(elGamalSignature).toString('base64');
        
        console.log('ElGamal signature:', elGamalSignatureBase64);
        
        // Sign the AES message
        const aesMessageToSign = new TextEncoder().encode("AESKey");
        const aesSignature = await wallet.signMessage(aesMessageToSign);
        const aesSignatureBase64 = Buffer.from(aesSignature).toString('base64');
        
        console.log('AES signature:', aesSignatureBase64);

        const mintAddress = params.mintAddress;
        const mintBase64 = Buffer.from(mintAddress).toString('base64');
        const authorityBase64 = Buffer.from(address.toString()).toString('base64');
        
        // Now proceed with the transaction
        const route = `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/create-cb-ata`;
        console.log('route', route);
        const response = await fetch(route, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mint: mintBase64,
            ata_authority: authorityBase64,
            elgamal_signature: elGamalSignatureBase64,
            aes_signature: aesSignatureBase64
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Deserialize the transaction from the response
        const serializedTransaction = Buffer.from(data.transaction, 'base64');
        const transaction = VersionedTransaction.deserialize(serializedTransaction);
        
        // Get the latest blockhash for transaction confirmation
        const latestBlockhash = await connection.getLatestBlockhash();
        
        // Update the transaction's blockhash
        if (transaction.message.version === 0) {
          // For VersionedMessage V0
          transaction.message.recentBlockhash = latestBlockhash.blockhash;
        } else {
          // For legacy messages
          (transaction.message as any).recentBlockhash = latestBlockhash.blockhash;
        }
        
        // Sign and send the transaction
        const signature = await wallet.sendTransaction(transaction, connection);
        
        // Confirm the transaction
        await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed');
        
        console.log('Transaction signature:', signature);
        return { 
          signature, 
          elGamalSignature: elGamalSignatureBase64,
          aesSignature: aesSignatureBase64,
          ...data 
        };
      } catch (error) {
        console.error('Error initializing account:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.signature) {
        transactionToast(data.signature);
        toast.success('Account initialize txn created ');
      }
      
      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-token-accounts', { endpoint: connection.rpcEndpoint, address }],
        }),
      ]);
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes("message signing")) {
        toast.error(`Message signing failed: ${error.message}`);
      } else {
        toast.error(`Initialization failed! ${error}`);
      }
    },
  });
}

export function useDepositCb({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const client = useQueryClient()
  const transactionToast = useTransactionToast()
  const wallet = useWallet()

  return useMutation({
    mutationKey: ['deposit-cb', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async ({ lamportAmount, mintDecimals, mintAddress }: { 
      lamportAmount: string, 
      mintDecimals: number,
      mintAddress: string 
    }) => {
      try {
        if (!wallet.publicKey) {
          throw new Error("Wallet not connected");
        }

        const mintBase64 = Buffer.from(mintAddress).toString('base64');
        const authorityBase64 = Buffer.from(address.toString()).toString('base64');
        
        // Call the deposit-cb endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/deposit-cb`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mint: mintBase64,
            ata_authority: authorityBase64,
            mint_decimals: mintDecimals,
            lamport_amount: lamportAmount
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Deserialize the transaction from the response
        const serializedTransaction = Buffer.from(data.transaction, 'base64');
        const transaction = VersionedTransaction.deserialize(serializedTransaction);
        
        // Get the latest blockhash for transaction confirmation
        const latestBlockhash = await connection.getLatestBlockhash();
        
        // Update the transaction's blockhash
        if (transaction.message.version === 0) {
          // For VersionedMessage V0
          transaction.message.recentBlockhash = latestBlockhash.blockhash;
        } else {
          // For legacy messages
          (transaction.message as any).recentBlockhash = latestBlockhash.blockhash;
        }
        
        // Sign and send the transaction
        const signature = await wallet.sendTransaction(transaction, connection);
        
        // Confirm the transaction
        await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed');
        
        console.log('Deposit transaction signature:', signature);
        return { 
          signature,
          ...data 
        };
      } catch (error) {
        console.error('Error depositing to confidential balance account:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.signature) {
        transactionToast(data.signature);
        toast.success('Deposit transaction successful');
      }
      
      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-token-accounts', { endpoint: connection.rpcEndpoint, address }],
        }),
      ]);
    },
    onError: (error) => {
      toast.error(`Deposit failed! ${error}`);
    },
  });
}

// Add a hook to get mint account information
export function useGetMintInfo({ mintAddress }: { mintAddress: string }) {
  const { connection } = useConnection()
  
  return useQuery({
    queryKey: ['get-mint-info', { endpoint: connection.rpcEndpoint, mintAddress }],
    queryFn: async () => {
      try {
        const mintPublicKey = new PublicKey(mintAddress)
        
        // Try to get the mint info using Token-2022 program first
        try {
          console.log('Attempting to fetch mint info using Token-2022 program...')
          const mintInfo = await getMint(
            connection, 
            mintPublicKey,
            'confirmed',
            TOKEN_2022_PROGRAM_ID
          )
          console.log('Successfully fetched Token-2022 mint:', mintInfo)
          return {
            ...mintInfo,
            isToken2022: true
          }
        } catch (error) {
          console.log('Not a Token-2022 mint, trying standard Token program...', error)
          
          // If that fails, try the standard Token program
          try {
            const mintInfo = await getMint(
              connection, 
              mintPublicKey,
              'confirmed',
              TOKEN_PROGRAM_ID
            )
            console.log('Successfully fetched standard Token mint:', mintInfo)
            return {
              ...mintInfo,
              isToken2022: false
            }
          } catch (secondError) {
            console.error('Failed to fetch mint with standard Token program:', secondError)
            
            // Check if the account exists but is not a token mint
            const accountInfo = await connection.getAccountInfo(mintPublicKey)
            if (accountInfo) {
              console.log('Account exists but is not a token mint:', accountInfo)
              throw new Error(`Account exists but is not owned by a Token program. Owner: ${accountInfo.owner.toBase58()}`)
            } else {
              console.log('Account does not exist')
              throw new Error('Mint account does not exist')
            }
          }
        }
      } catch (error) {
        console.error('Error fetching mint info:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useApplyCB({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const client = useQueryClient()
  const transactionToast = useTransactionToast()
  const wallet = useWallet()

  return useMutation({
    mutationKey: ['apply-pending-balance', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async ({ mint, mintDecimals }: { mint: PublicKey, mintDecimals: number }) => {
      try {
        // First, sign the messages for ElGamal and AES
        if (!wallet.signMessage) {
          throw new Error("Wallet does not support message signing")
        }
        
        // Sign the ElGamal message
        const elGamalMessageToSign = new TextEncoder().encode("ElGamalSecret")
        const elGamalSignature = await wallet.signMessage(elGamalMessageToSign)
        const elGamalSignatureBase64 = Buffer.from(elGamalSignature).toString('base64')
        
        console.log('ElGamal signature:', elGamalSignatureBase64)
        
        // Sign the AES message
        const aesMessageToSign = new TextEncoder().encode("AESKey")
        const aesSignature = await wallet.signMessage(aesMessageToSign)
        const aesSignatureBase64 = Buffer.from(aesSignature).toString('base64')
        
        console.log('AES signature:', aesSignatureBase64)
        
        // Get the associated token address
        const tokenAccountAddress = await getAssociatedTokenAddress(
          mint,
          address,
          true, // allowOwnerOffCurve
          TOKEN_2022_PROGRAM_ID
        )

        // Fetch the token account data
        const accountInfo = await connection.getAccountInfo(tokenAccountAddress)
        if (!accountInfo) {
          throw new Error('Token account not found')
        }
        
        // Prepare the request to the backend
        // Convert pubkeys to base58 strings and then base64 encode them
        const ataAuthorityBase58 = address.toString()
        const mintBase58 = mint.toString()
        
        const request = {
          ata_authority: Buffer.from(ataAuthorityBase58).toString('base64'),
          mint: Buffer.from(mintBase58).toString('base64'),
          elgamal_signature: elGamalSignatureBase64,
          aes_signature: aesSignatureBase64,
          token_account_data: Buffer.from(accountInfo.data).toString('base64')
        }
        
        // Send the request to the backend
        const route = `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/apply-cb`
        const response = await fetch(route, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Deserialize the transaction from the response
        const serializedTransaction = Buffer.from(data.transaction, 'base64')
        const transaction = VersionedTransaction.deserialize(serializedTransaction)
        
        // Get the latest blockhash for transaction confirmation
        const latestBlockhash = await connection.getLatestBlockhash()
        
        // Update the transaction's blockhash
        if (transaction.message.version === 0) {
          // For VersionedMessage V0
          transaction.message.recentBlockhash = latestBlockhash.blockhash
        } else {
          // For legacy messages
          (transaction.message as any).recentBlockhash = latestBlockhash.blockhash
        }
        
        // Sign and send the transaction
        const signature = await wallet.sendTransaction(transaction, connection, {
          skipPreflight: true // Skip client-side verification to avoid potential issues
        })
        
        // Confirm the transaction
        await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
        
        console.log('Apply pending balance transaction signature:', signature)
        return { 
          signature, 
          elGamalSignature: elGamalSignatureBase64,
          aesSignature: aesSignatureBase64,
          ...data 
        }
      } catch (error) {
        console.error('Error applying pending balance:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      if (data.signature) {
        transactionToast(data.signature)
        toast.success('Pending balance applied successfully')
      }
      
      if (data.elGamalSignature) {
        console.log('ElGamal signature collected:', data.elGamalSignature)
      }
      
      if (data.aesSignature) {
        console.log('AES signature collected:', data.aesSignature)
      }
      
      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-token-accounts', { endpoint: connection.rpcEndpoint, address }],
        }),
      ])
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes("message signing")) {
        toast.error(`Message signing failed: ${error.message}`)
      } else {
        toast.error(`Failed to apply pending balance: ${error}`)
      }
    },
  })
}

export function useTransferCB({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const client = useQueryClient()
  const transactionToast = useTransactionToast()
  const wallet = useWallet()

  return useMutation({
    mutationKey: ['transfer-cb', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async ({ amount, recipientAddress, mintAddress }: { 
      amount: number, 
      recipientAddress: string,
      mintAddress: string
    }) => {
      try {
        if (!wallet.publicKey) {
          throw new Error("Wallet not connected")
        }

        // First, sign the messages for ElGamal and AES
        if (!wallet.signMessage) {
          throw new Error("Wallet does not support message signing")
        }
        
        // Sign the ElGamal message
        const elGamalMessageToSign = new TextEncoder().encode("ElGamalSecret")
        const elGamalSignature = await wallet.signMessage(elGamalMessageToSign)
        const elGamalSignatureBase64 = Buffer.from(elGamalSignature).toString('base64')
        
        console.log('ElGamal signature:', elGamalSignatureBase64)
        
        // Sign the AES message
        const aesMessageToSign = new TextEncoder().encode("AESKey")
        const aesSignature = await wallet.signMessage(aesMessageToSign)
        const aesSignatureBase64 = Buffer.from(aesSignature).toString('base64')
        
        console.log('AES signature:', aesSignatureBase64)

        // Get the associated token account for the sender
        const mintPublicKey = new PublicKey(mintAddress)
        const senderTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          address,
          false,
          TOKEN_2022_PROGRAM_ID
        )
        
        // Get the token account data for sender
        const senderAccountInfo = await connection.getAccountInfo(senderTokenAccount)
        if (!senderAccountInfo) {
          throw new Error("Sender token account not found")
        }
        
        // Get the recipient's public key and associated token account
        const recipientPublicKey = new PublicKey(recipientAddress)
        const recipientTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          recipientPublicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        )
        
        // Get the token account data for recipient
        const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount)
        if (!recipientAccountInfo) {
          throw new Error("Recipient token account not found")
        }
        
        // Get the mint account data
        const mintAccountInfo = await connection.getAccountInfo(mintPublicKey)
        if (!mintAccountInfo) {
          throw new Error("Mint account not found")
        }

        // Get the latest blockhash
        const latestBlockhash = await connection.getLatestBlockhash()
        
        // Call the transfer-cb endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/transfer-cb`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            elgamal_signature: elGamalSignatureBase64,
            aes_signature: aesSignatureBase64,
            sender_token_account: Buffer.from(senderAccountInfo.data).toString('base64'),
            recipient_token_account: Buffer.from(recipientAccountInfo.data).toString('base64'),
            mint_token_account: Buffer.from(mintAccountInfo.data).toString('base64'),
            amount: amount.toString(),  // Convert to string to avoid precision issues with large numbers
            priority_fee: "100000000",  // Add 0.1 SOL (10,000,000 lamports) priority fee as string
            latest_blockhash: latestBlockhash.blockhash
          }),
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        
        const data = await response.json()
        
        // The response may contain multiple transactions
        // We need to sign and send each of them in sequence
        const signatures: string[] = []
        
        // Process each transaction in the response
        for (const transactionBase64 of data.transactions) {
          // Deserialize the transaction
          const serializedTransaction = Buffer.from(transactionBase64, 'base64')
          const transaction = VersionedTransaction.deserialize(serializedTransaction)
          
          // Verify the backend used our provided blockhash
          console.log(`Transaction blockhash: ${transaction.message.recentBlockhash}`)
          console.log(`Original provided blockhash: ${latestBlockhash.blockhash}`)
          
          try {
            // Simulate the transaction first to catch any potential errors
            console.log('Simulating transaction before sending...')
            const simulation = await connection.simulateTransaction(transaction)
            
            if (simulation.value.err) {
              console.error('Transaction simulation failed:', simulation.value.err)
              throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`)
            }
            
            console.log('Transaction simulation successful, proceeding to send')
            
            // Sign and send the transaction
            // // @ts-ignore - We've already checked wallet is connected above
            // const signature = await wallet.signTransaction!(transaction);
            const signature = await wallet.sendTransaction(transaction, connection)
            signatures.push(signature)

            // Confirm the transaction
            await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
            console.log('Transfer transaction signature:', signature)
          } catch (error) {
            console.error('Error processing transaction:', error)
            throw error
          }
        }
        
        return { 
          signatures,
          ...data 
        }
      } catch (error) {
        console.error('Error transferring from confidential balance:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      if (data.signatures && data.signatures.length > 0) {
        // Display toast for each signature
        data.signatures.forEach((signature: string) => {
          transactionToast(signature)
        })
        toast.success('Transfer transaction successful')
      }
      
      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-token-accounts', { endpoint: connection.rpcEndpoint, address }],
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Transfer failed! ${error}`)
    },
  })
}

export function useWithdrawCB({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const client = useQueryClient()
  const transactionToast = useTransactionToast()
  const wallet = useWallet()

  return useMutation({
    mutationKey: ['withdraw-cb', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async ({ amount, mintAddress }: { 
      amount: number,
      mintAddress: string
    }) => {
      try {
        if (!wallet.publicKey) {
          throw new Error("Wallet not connected")
        }

        // First, sign the messages for ElGamal and AES
        if (!wallet.signMessage) {
          throw new Error("Wallet does not support message signing")
        }
        
        // Sign the ElGamal message
        const elGamalMessageToSign = new TextEncoder().encode("ElGamalSecret")
        const elGamalSignature = await wallet.signMessage(elGamalMessageToSign)
        const elGamalSignatureBase64 = Buffer.from(elGamalSignature).toString('base64')
        
        console.log('ElGamal signature:', elGamalSignatureBase64)
        
        // Sign the AES message
        const aesMessageToSign = new TextEncoder().encode("AESKey")
        const aesSignature = await wallet.signMessage(aesMessageToSign)
        const aesSignatureBase64 = Buffer.from(aesSignature).toString('base64')
        
        console.log('AES signature:', aesSignatureBase64)

        // Get the recipient token account (which is the user's regular token account)
        const mintPublicKey = new PublicKey(mintAddress)
        const recipientTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          address,
          false,
          TOKEN_2022_PROGRAM_ID
        )
        
        // Get the recipient token account data
        const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount)
        if (!recipientAccountInfo) {
          throw new Error("Recipient token account not found")
        }
        
        // Get the mint account data
        const mintAccountInfo = await connection.getAccountInfo(mintPublicKey)
        if (!mintAccountInfo) {
          throw new Error("Mint account not found")
        }

        // Get the latest blockhash
        const latestBlockhash = await connection.getLatestBlockhash()
        
        // Add logging to debug
        console.log('Submitting withdraw request with amount:', amount)
        
        // Call the withdraw-cb endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/withdraw-cb`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            elgamal_signature: elGamalSignatureBase64,
            aes_signature: aesSignatureBase64,
            recipient_token_account: Buffer.from(recipientAccountInfo.data).toString('base64'),
            mint_account_info: Buffer.from(mintAccountInfo.data).toString('base64'),
            withdraw_amount_lamports: amount.toString(),
            priority_fee: "100000000",  // Add 0.1 SOL priority fee as string
            latest_blockhash: latestBlockhash.blockhash
          }),
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        
        const data = await response.json()
        
        // The response may contain multiple transactions
        // We need to sign and send each of them in sequence
        const signatures: string[] = []
        
        // Process each transaction in the response
        for (const transactionBase64 of data.transactions) {
          // Deserialize the transaction
          const serializedTransaction = Buffer.from(transactionBase64, 'base64')
          const transaction = VersionedTransaction.deserialize(serializedTransaction)
          
          // Verify the backend used our provided blockhash
          console.log(`Transaction blockhash: ${transaction.message.recentBlockhash}`)
          console.log(`Original provided blockhash: ${latestBlockhash.blockhash}`)
          
          try {
            // Simulate the transaction first to catch any potential errors
            console.log('Simulating transaction before sending...')
            const simulation = await connection.simulateTransaction(transaction)
            
            if (simulation.value.err) {
              console.error('Transaction simulation failed:', simulation.value.err)
              throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`)
            }
            
            console.log('Transaction simulation successful, proceeding to send')
            
            // Sign and send the transaction
            const signature = await wallet.sendTransaction(transaction, connection)
            signatures.push(signature)

            // Confirm the transaction
            await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
            console.log('Withdraw transaction signature:', signature)
          } catch (error) {
            console.error('Error processing transaction:', error)
            throw error
          }
        }
        
        return { 
          signatures,
          ...data 
        }
      } catch (error) {
        console.error('Error withdrawing from confidential balance:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      if (data.signatures && data.signatures.length > 0) {
        // Display toast for each signature
        data.signatures.forEach((signature: string) => {
          transactionToast(signature)
        })
        toast.success('Withdraw transaction successful')
      }
      
      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-token-accounts', { endpoint: connection.rpcEndpoint, address }],
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Withdraw failed! ${error}`)
    },
  })
}

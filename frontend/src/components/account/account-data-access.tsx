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

export function useInitializeAccount({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const client = useQueryClient()
  const transactionToast = useTransactionToast()
  const wallet = useWallet()

  return useMutation({
    mutationKey: ['initialize-account', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async () => {
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

        const mintBase64 = Buffer.from("GyRRg4bEhVN75JtoANe4vyEw2zpWYduuCGDxCEZu7KTe").toString('base64');
        const authorityBase64 = Buffer.from(address.toString()).toString('base64');
        
        // Now proceed with the transaction
        const response = await fetch('http://localhost:3003/create-cb-ata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mint: mintBase64,
            authority: authorityBase64,
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

export function useCreateConfidentialBalancesATA({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const client = useQueryClient()
  const transactionToast = useTransactionToast()
  const wallet = useWallet()

  return useMutation({
    mutationKey: ['create-cb-ata', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (input: { mint: PublicKey, authority: PublicKey }) => {
      try {
        // First, sign the messages for ElGamal and AES
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
        
        // Now proceed with the transaction
        const response = await fetch('http://localhost:3003/create-cb-ata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner: address.toString(),
            mint: input.mint.toString(),
            authority: input.authority.toString(),
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
        console.error('Error creating Confidential Balances ATA:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.signature) {
        transactionToast(data.signature);
        toast.success('Confidential Balances ATA created successfully');
      }
      
      if (data.elGamalSignature) {
        console.log('ElGamal signature collected:', data.elGamalSignature);
      }
      
      if (data.aesSignature) {
        console.log('AES signature collected:', data.aesSignature);
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
        toast.error(`Failed to create Confidential Balances ATA: ${error}`);
      }
    },
  });
}

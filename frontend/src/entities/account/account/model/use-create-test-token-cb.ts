import {
  createMintToInstruction,
  ExtensionType,
  getAssociatedTokenAddress,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/ui/toast'
import { processMultiTransaction } from './process-multi-transaction'
import { getCacheKey as getTokenAccountsCacheKey } from './use-get-token-accounts'

async function serverRequest({ account, mint }: { account: PublicKey; mint: PublicKey }) {
  // Now proceed with the transaction
  const route = `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/create-test-token`
  const response = await fetch(route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account: account.toBase58(),
      mint: mint.toBase58(),
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }

  const data = await response.json()

  return data
}

export const useCreateTestTokenCB = ({
  walletAddressPubkey,
}: {
  walletAddressPubkey: PublicKey
}) => {
  const { connection } = useConnection()
  const client = useQueryClient()
  const toast = useToast()
  const wallet = useWallet()

  return useMutation({
    mutationKey: [
      'create-token2022-test-mint',
      { endpoint: connection.rpcEndpoint, address: walletAddressPubkey },
    ],
    mutationFn: async () => {
      try {
        if (!wallet.publicKey) {
          throw new Error('Wallet not connected')
        }

        // Generate a new mint keypair
        const mintKeypair = Keypair.generate()
        console.log('Generated new mint address:', mintKeypair.publicKey.toBase58())

        // Calculate the required space for the mint account with extensions
        const extensions = [
          ExtensionType.ConfidentialTransferMint,
          ExtensionType.MintCloseAuthority,
        ]
        const mintSpace = getMintLen(extensions)
        console.log('Mint account space required:', mintSpace, 'bytes')

        // Get the minimum rent for the mint account
        const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace)
        console.log('Mint account rent required:', mintRent, 'lamports')

        const data = await serverRequest({ account: wallet.publicKey, mint: mintKeypair.publicKey })

        // Get the latest blockhash
        const latestBlockhash = await connection.getLatestBlockhash()

        // Deserialize the VersionedMessage from the server response
        const serializedMessage = Buffer.from(data.message, 'base64')
        console.log('Deserializing message from server...')

        let message = VersionedMessage.deserialize(serializedMessage)
        console.log('Message deserialized successfully')

        // Create a new VersionedTransaction from the message
        const transaction = new VersionedTransaction(message)

        // Update the transaction's blockhash to the latest one
        if (transaction.message.version === 0) {
          // For VersionedMessage V0
          transaction.message.recentBlockhash = latestBlockhash.blockhash
        } else {
          // For legacy messages
          ;(transaction.message as any).recentBlockhash = latestBlockhash.blockhash
        }

        // Clear existing signatures to prepare for fresh signing
        transaction.signatures = new Array(transaction.message.header.numRequiredSignatures).fill(
          new Uint8Array(64).fill(0)
        )

        // Sign the transaction with the mint keypair first
        // The mint keypair must sign because it's creating a new mint account
        transaction.sign([mintKeypair])
        console.log('Transaction signed with mint keypair')

        // Send the transaction with the wallet (this will prompt user to sign)
        const signature = await wallet.sendTransaction(transaction, connection, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })

        // Confirm the transaction
        await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
        console.log('Transaction confirmed with signature:', signature)

        return {
          signature,
          mintAddress: mintKeypair.publicKey.toBase58(),
        }
      } catch (error) {
        console.error('Error creating Token-2022 mint:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      if (data.signature) {
        toast.transaction(data.signature)
        toast.success(`Token-2022 mint created! Address: ${data.mintAddress}`)
      }

      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-balance',
            { endpoint: connection.rpcEndpoint, address: walletAddressPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            'get-signatures',
            { endpoint: connection.rpcEndpoint, address: walletAddressPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: getTokenAccountsCacheKey(connection.rpcEndpoint, walletAddressPubkey),
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Token mint creation failed! ${error}`)
    },
  })
}

export const useMintTestTokenCB = ({
  walletAddressPubkey,
  amount = 1000,
}: {
  walletAddressPubkey: PublicKey
  amount?: number
}) => {
  const { connection } = useConnection()
  const client = useQueryClient()
  const toast = useToast()
  const wallet = useWallet()

  return useMutation({
    mutationKey: [
      'mint-token2022-test-mint',
      { endpoint: connection.rpcEndpoint, address: walletAddressPubkey },
    ],
    mutationFn: async ({ mintAddressPubkey }: { mintAddressPubkey: PublicKey }) => {
      try {
        if (!wallet.publicKey) {
          throw new Error('Wallet not connected')
        }

        // Generate a new mint keypair
        // const mintKeypair = Keypair.generate()
        // console.log('Generated new mint address:', mintKeypair.publicKey.toBase58())

        // Calculate the required space for the mint account with extensions
        // const extensions = [
        //   ExtensionType.ConfidentialTransferMint,
        //   ExtensionType.MintCloseAuthority,
        // ]
        // const mintSpace = getMintLen(extensions)
        // console.log('Mint account space required:', mintSpace, 'bytes')

        // Get the minimum rent for the mint account
        // const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace)
        // console.log('Mint account rent required:', mintRent, 'lamports')

        const tokenAmount = amount * Math.pow(10, 9)

        const destination = await getAssociatedTokenAddress(
          mintAddressPubkey,
          wallet.publicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        )

        // Check if the ATA exists and is properly configured
        try {
          const accountInfo = await connection.getAccountInfo(destination)
          if (!accountInfo) {
            throw new Error(
              'Associated token account does not exist. Please create a confidential balance ATA first.'
            )
          }
          console.log('ATA exists, proceeding with mint')
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes('Associated token account does not exist')
          ) {
            throw error
          }
          throw new Error(
            'Failed to verify ATA. Please ensure the confidential balance ATA exists and is properly configured.'
          )
        }

        const transaction = new Transaction()
        transaction.add(
          createMintToInstruction(
            mintAddressPubkey,
            destination,
            wallet.publicKey,
            tokenAmount,
            undefined,
            TOKEN_2022_PROGRAM_ID
          )
        )

        // Get the latest blockhash
        const latestBlockhash = await connection.getLatestBlockhash()

        // Deserialize the transaction from the response
        // const serializedTransaction = Buffer.from(data.transaction, 'base64')
        // const transaction = VersionedTransaction.deserialize(serializedTransaction)

        // Update the transaction's blockhash
        transaction.recentBlockhash = latestBlockhash.blockhash

        // Sign and send the transaction
        const signature = await wallet.sendTransaction(transaction, connection)

        // Confirm the transaction
        await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
        console.log('Transaction signature:', signature)

        return {
          signature,
          mintAddress: mintAddressPubkey.toBase58(),
          amount,
          amountLamports: tokenAmount,
        }
      } catch (error) {
        console.error('Error creating Token-2022 mint:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      if (data.signature) {
        toast.transaction(data.signature)
        toast.success(`Token-2022 minted! Address: ${data.mintAddress}, amount=${data.amount}`)
      }

      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-balance',
            { endpoint: connection.rpcEndpoint, address: walletAddressPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            'get-signatures',
            { endpoint: connection.rpcEndpoint, address: walletAddressPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: getTokenAccountsCacheKey(connection.rpcEndpoint, walletAddressPubkey),
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Token minting failed! ${error}`)
    },
  })
}

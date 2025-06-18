import {
  createMintToInstruction,
  ExtensionType,
  getAssociatedTokenAddress,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import pluralize from 'pluralize'
import { useDevMode } from '@/entities/dev-mode'
import { useOperationLog } from '@/entities/operation-log'
import { useToast } from '@/shared/ui/toast'
import { latestMintAddressAtom } from './latest-mint-address'
import { queryKey as getBalanceQK } from './use-get-balance'
import { queryKey as getSignaturesQK } from './use-get-signatures'
import { queryKey as getTokenAccountsQK } from './use-get-token-accounts'

async function serverRequest(request: {
  account: string
  mint: string
  mint_rent: number
  latest_blockhash: string
  auditor_elgamal_pubkey?: string
}) {
  const route = `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/create-test-token`
  const response = await fetch(route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`😵 HTTP error! Status: ${response.status}`)
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
  const wallet = useWallet()
  const client = useQueryClient()

  const toast = useToast()
  const log = useOperationLog()
  const devMode = useDevMode()
  const setLatestMintAddress = useSetAtom(latestMintAddressAtom)

  return useMutation({
    mutationKey: [
      'create-token2022-test-mint',
      { endpoint: connection.rpcEndpoint, address: walletAddressPubkey },
    ],
    mutationFn: async ({ auditorElGamalPubkey }: { auditorElGamalPubkey?: string }) => {
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

        const requestBody = {
          account: wallet.publicKey.toBase58(),
          auditor_elgamal_pubkey: auditorElGamalPubkey ? auditorElGamalPubkey : undefined,
          mint: mintKeypair.publicKey.toBase58(),
          mint_rent: mintRent,
          latest_blockhash: (await connection.getLatestBlockhash()).blockhash,
        }

        const data = await serverRequest(requestBody)

        // Deserialize the transaction from the response
        const serializedTransaction = Buffer.from(data.transaction, 'base64')
        const transaction = VersionedTransaction.deserialize(serializedTransaction)

        // Get the latest blockhash
        const latestBlockhash = await connection.getLatestBlockhash()

        // Update the transaction's blockhash to the latest one
        if (transaction.message.version === 0) {
          // For VersionedMessage V0
          transaction.message.recentBlockhash = latestBlockhash.blockhash
        } else {
          // For legacy messages
          ;(transaction.message as any).recentBlockhash = latestBlockhash.blockhash
        }

        // Sign the transaction with the mint keypair first
        // The mint keypair must sign because it's creating a new mint account
        transaction.sign([mintKeypair])
        console.log('Transaction signed with mint keypair')

        // Sign and send the transaction
        const signature = await wallet.sendTransaction(transaction, connection)

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
        setLatestMintAddress(data.mintAddress)
        toast.address('Token-2022 mint created!', data.mintAddress)
        log.push({
          title: 'Create test token Operation - COMPLETE',
          content: `Token-2022 mint created\n  Wallet: ${walletAddressPubkey}\n  Mint address: ${data.mintAddress}\n  Signature: ${data.signature}`,
          variant: 'success',
        })
        devMode.set(1, {
          title: 'Create test token Operation - COMPLETE',
          result: `Token-2022 mint created\n  Wallet: ${walletAddressPubkey}\n  Mint address: ${data.mintAddress}\n  Signature: ${data.signature}`,
          success: true,
        })
      }

      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: getBalanceQK(connection.rpcEndpoint, walletAddressPubkey),
        }),
        client.invalidateQueries({
          queryKey: getSignaturesQK(connection.rpcEndpoint, walletAddressPubkey),
        }),
        client.invalidateQueries({
          queryKey: getTokenAccountsQK(connection.rpcEndpoint, walletAddressPubkey),
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Token mint creation failed! ${error}`)
      log.push({
        title: 'Create test token Operation - FAILED',
        content: `Token mint creation failed\n  Wallet: ${walletAddressPubkey}\n  Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      })
    },
  })
}

export const useMintTestTokenCB = ({
  walletAddressPubkey,
  amount: defaultAmount = 1000,
}: {
  walletAddressPubkey: PublicKey
  amount?: number
}) => {
  const { connection } = useConnection()
  const wallet = useWallet()
  const client = useQueryClient()

  const toast = useToast()
  const log = useOperationLog()
  const devMode = useDevMode()

  return useMutation({
    mutationKey: [
      'mint-token2022-test-mint',
      { endpoint: connection.rpcEndpoint, address: walletAddressPubkey },
    ],
    mutationFn: async ({
      mintAddressPubkey,
      mintAmount = defaultAmount,
    }: {
      mintAddressPubkey: PublicKey
      mintAmount?: number
    }) => {
      try {
        if (!wallet.publicKey) {
          throw new Error('Wallet not connected')
        }

        const tokenAmount = mintAmount * Math.pow(10, 9)

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
          amount: mintAmount,
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
        toast.address(`Token-2022 minted (${data.amount})!`, data.mintAddress)

        log.push({
          title: 'Mint token Operation - COMPLETE',
          content: `Token-2022 minted\n  Wallet: ${walletAddressPubkey}\n  Mint address: ${data.mintAddress}\n  Amount: ${pluralize('token', data.amount, true)}\n  Signature: ${data.signature}`,
          variant: 'success',
        })

        devMode.set(3, {
          title: 'Mint token Operation - COMPLETE',
          result: `Token-2022 minted\n  Wallet: ${walletAddressPubkey}\n  Mint address: ${data.mintAddress}\n  Amount: ${pluralize('token', data.amount, true)}\n  Signature: ${data.signature}`,
          success: true,
        })
      }

      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: getBalanceQK(connection.rpcEndpoint, walletAddressPubkey),
        }),
        client.invalidateQueries({
          queryKey: getSignaturesQK(connection.rpcEndpoint, walletAddressPubkey),
        }),
        client.invalidateQueries({
          queryKey: getTokenAccountsQK(connection.rpcEndpoint, walletAddressPubkey),
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Token minting failed! ${error}`)
      log.push({
        title: 'Mint token Operation - FAILED',
        content: `Token minting failed\n  Wallet: ${walletAddressPubkey}\n  Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      })
    },
  })
}

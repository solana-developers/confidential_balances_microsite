import { TOKEN_2022_PROGRAM_ID, unpackAccount } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AES_SEED_MESSAGE,
  ELGAMAL_SEED_MESSAGE,
  generateSeedSignature,
  processMultiTransaction,
} from '@/entities/account/account'
import { queryKey as confidentialVisibilityQK } from '@/entities/account/account/model/use-confidential-visibility'
import { queryKey as getBalanceQK } from '@/entities/account/account/model/use-get-balance'
import { queryKey as getSignaturesQK } from '@/entities/account/account/model/use-get-signatures'
import { queryKey as getTokenAccountsQK } from '@/entities/account/account/model/use-get-token-accounts'
import { queryKey as getTokenBalanceQK } from '@/entities/account/account/model/use-get-token-balance'
import { useToast } from '@/shared/ui/toast'

export const queryKey = (endpoint: string, address: PublicKey) => [
  'withdraw-cb',
  {
    endpoint,
    address,
  },
]

export const useWithdrawCB = ({ tokenAccountPubkey }: { tokenAccountPubkey: PublicKey }) => {
  const { connection } = useConnection()
  const client = useQueryClient()
  const wallet = useWallet()
  const toast = useToast()

  return useMutation({
    mutationKey: queryKey(connection.rpcEndpoint, tokenAccountPubkey), //['withdraw-cb', { endpoint: connection.rpcEndpoint, tokenAccountPubkey }],
    mutationFn: async ({ amount }: { amount: number }) => {
      try {
        if (!wallet.publicKey) {
          throw new Error('Wallet not connected')
        }

        // First, sign the messages for ElGamal and AES
        if (!wallet.signMessage) {
          throw new Error('Wallet does not support message signing')
        }

        // Sign the ElGamal message
        const elGamalSignature = await generateSeedSignature(wallet, ELGAMAL_SEED_MESSAGE)
        const elGamalSignatureBase64 = Buffer.from(elGamalSignature).toString('base64')
        console.log('ElGamal base64 signature:', elGamalSignatureBase64)

        // Sign the AES message
        const aesSignature = await generateSeedSignature(wallet, AES_SEED_MESSAGE)
        const aesSignatureBase64 = Buffer.from(aesSignature).toString('base64')
        console.log('AES base64 signature:', aesSignatureBase64)

        // Get the token account data
        const tokenAccountInfo = await connection.getAccountInfo(tokenAccountPubkey)
        if (!tokenAccountInfo) {
          throw new Error('Token account not found')
        }

        // Parse the token account data to get the mint
        const tokenAccount = unpackAccount(
          tokenAccountPubkey,
          tokenAccountInfo,
          TOKEN_2022_PROGRAM_ID
        )
        if (!tokenAccount) {
          throw new Error('Failed to parse token account data')
        }

        // Get the mint account data
        const mintAccountInfo = await connection.getAccountInfo(tokenAccount.mint)
        if (!mintAccountInfo) {
          throw new Error('Mint account not found')
        }

        // Get the latest blockhash
        const latestBlockhash = await connection.getLatestBlockhash()

        // Step 1: Get the space requirements for each proof account
        console.log('Fetching proof space requirements...')
        const spaceResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/withdraw-cb`,
          {
            method: 'GET',
          }
        )

        if (!spaceResponse.ok) {
          throw new Error(`HTTP error getting space requirements! Status: ${spaceResponse.status}`)
        }

        const spaceData = await spaceResponse.json()
        console.log('Space requirements:', spaceData)

        // Step 2: Calculate rent for each proof account
        console.log('Calculating rent for proof accounts...')
        const equalityProofRent = await connection.getMinimumBalanceForRentExemption(
          spaceData.equality_proof_space
        )
        const rangeProofRent = await connection.getMinimumBalanceForRentExemption(
          spaceData.range_proof_space
        )

        console.log('Rent requirements:')
        console.log('- Equality proof rent:', equalityProofRent, 'lamports')
        console.log('- Range proof rent:', rangeProofRent, 'lamports')

        // Add logging to debug
        console.log('Submitting withdraw request with amount:', amount)

        // Step 3: Call the withdraw-cb endpoint with rent information
        console.log('Submitting withdraw request...')
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/withdraw-cb`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              elgamal_signature: elGamalSignatureBase64,
              aes_signature: aesSignatureBase64,
              recipient_token_account: Buffer.from(tokenAccountInfo.data).toString('base64'),
              mint_account_info: Buffer.from(mintAccountInfo.data).toString('base64'),
              withdraw_amount_lamports: amount.toString(),
              latest_blockhash: latestBlockhash.blockhash,
              equality_proof_rent: equalityProofRent.toString(),
              range_proof_rent: rangeProofRent.toString(),
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()

        const { signatures } = await processMultiTransaction(
          data.transactions,
          wallet,
          connection,
          latestBlockhash,
          'Withdraw'
        )

        return {
          signatures,
          ...data,
        }
      } catch (error) {
        console.error('Error processing transaction:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      if (data.signatures && data.signatures.length > 0) {
        // Display toast for each signature
        data.signatures.forEach((signature: string) => {
          toast.transaction(signature)
        })
        toast.success('Withdraw transaction successful')
      }

      // Hide confidential balance using query cache
      client.setQueryData(confidentialVisibilityQK(tokenAccountPubkey), false)

      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: confidentialVisibilityQK(tokenAccountPubkey),
        }),
        client.invalidateQueries({
          queryKey: getBalanceQK(connection.rpcEndpoint, tokenAccountPubkey),
        }),
        client.invalidateQueries({
          queryKey: getSignaturesQK(connection.rpcEndpoint, tokenAccountPubkey),
        }),
        client.invalidateQueries({
          queryKey: getTokenAccountsQK(connection.rpcEndpoint, tokenAccountPubkey),
        }),
        client.invalidateQueries({
          queryKey: getTokenBalanceQK(connection.rpcEndpoint, tokenAccountPubkey),
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Withdraw failed! ${error}`)
    },
  })
}

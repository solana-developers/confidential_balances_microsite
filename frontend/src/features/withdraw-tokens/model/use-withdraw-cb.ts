import { TOKEN_2022_PROGRAM_ID, unpackAccount } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import pluralize from 'pluralize'
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
import { useOperationLog } from '@/entities/operation-log'
import { serverRequest } from '@/shared/api'
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
  const wallet = useWallet()
  const client = useQueryClient()

  const toast = useToast()
  const log = useOperationLog()

  return useMutation({
    mutationKey: queryKey(connection.rpcEndpoint, tokenAccountPubkey),
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
        const spaceData = await serverRequest('/withdraw-cb', undefined, 'GET')
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

        // Step 3: Call the withdraw-cb endpoint with rent information
        console.log('Submitting withdraw request...')
        const requestBody = {
          elgamal_signature: elGamalSignatureBase64,
          aes_signature: aesSignatureBase64,
          recipient_token_account: Buffer.from(tokenAccountInfo.data).toString('base64'),
          mint_account_info: Buffer.from(mintAccountInfo.data).toString('base64'),
          withdraw_amount_lamports: amount.toString(),
          latest_blockhash: latestBlockhash.blockhash,
          equality_proof_rent: equalityProofRent.toString(),
          range_proof_rent: rangeProofRent.toString(),
        }

        const data = await serverRequest('/withdraw-cb', requestBody)

        const { signatures } = await processMultiTransaction(
          data.transactions,
          wallet,
          connection,
          latestBlockhash,
          'Withdraw'
        )

        return {
          signatures,
          amount,
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

        log.push({
          title: 'Withdraw Operation - COMPLETE',
          content: `Withdraw transaction successful\n  Token account: ${tokenAccountPubkey}\n  Amount: ${pluralize('token unit', data.amount, true)}${data.signatures.map((signature: string, index: number) => `\n  Signature${data.signatures.length > 1 ? ` #${index + 1}` : ''}: ${signature}`).join('')}`,
          variant: 'success',
        })
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
      log.push({
        title: 'Withdraw Operation - FAILED',
        content: `Withdraw transaction failed\n  Token account: ${tokenAccountPubkey}\n  Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      })
    },
  })
}

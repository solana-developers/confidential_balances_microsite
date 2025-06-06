import { getAccount, getMint, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/ui/toast'
import { AES_SEED_MESSAGE } from './aes-seed-message'
import { ELGAMAL_SEED_MESSAGE } from './elgamal-seed-message'
import { generateSeedSignature } from './generate-seed-signature'

export const useApplyCB = ({ address }: { address: PublicKey }) => {
  const { connection } = useConnection()
  const client = useQueryClient()
  const toast = useToast()
  const wallet = useWallet()

  return useMutation({
    mutationKey: ['apply-pending-balance', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async () => {
      try {
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

        // Get the token account address from the provided string
        const tokenAccountAddress = new PublicKey(address)

        // Fetch the token account data
        const accountInfo = await connection.getAccountInfo(tokenAccountAddress)
        if (!accountInfo) {
          throw new Error('Token account not found')
        }

        // Prepare the request to the backend
        // Convert pubkeys to base58 strings and then base64 encode them
        const ataAuthorityBase58 = await (async () => {
          const tokenAccountInfo = await getAccount(
            connection,
            address,
            'confirmed',
            TOKEN_2022_PROGRAM_ID
          )
          return tokenAccountInfo.owner.toBase58()
        })()

        const request = {
          ata_authority: Buffer.from(ataAuthorityBase58).toString('base64'),
          elgamal_signature: elGamalSignatureBase64,
          aes_signature: aesSignatureBase64,
          token_account_data: Buffer.from(accountInfo.data).toString('base64'),
        }

        // Send the request to the backend
        const route = `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/apply-cb`
        const response = await fetch(route, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
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
          ;(transaction.message as any).recentBlockhash = latestBlockhash.blockhash
        }

        // Sign and send the transaction
        const signature = await wallet.sendTransaction(transaction, connection, {
          skipPreflight: true, // Skip client-side verification to avoid potential issues
        })

        // Confirm the transaction
        await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

        console.log('Apply pending balance transaction signature:', signature)
        return {
          signature,
          elGamalSignature: elGamalSignatureBase64,
          aesSignature: aesSignatureBase64,
          ...data,
        }
      } catch (error) {
        console.error('Error applying pending balance:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      if (data.signature) {
        toast.transaction(data.signature)
        toast.success('Pending balance applied successfully')
      }

      // Hide confidential balance using query cache
      client.setQueryData(['confidential-visibility', address.toString()], false)

      // Directly set has-pending-balance to false to hide the prompt
      console.log('Setting has-pending-balance to false after successful apply')
      client.setQueryData(
        [
          'has-pending-balance',
          {
            endpoint: connection.rpcEndpoint,
            tokenAccountPubkey: address.toString(),
          },
        ],
        false
      )

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
      if (error instanceof Error && error.message.includes('message signing')) {
        toast.error(`Message signing failed: ${error.message}`)
      } else {
        toast.error(`Failed to apply pending balance: ${error}`)
      }
    },
  })
}

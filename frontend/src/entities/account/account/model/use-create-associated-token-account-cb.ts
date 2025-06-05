import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useTransactionToast } from '../ui/transaction-toast'
import { AES_SEED_MESSAGE } from './aes-seed-message'
import { ELGAMAL_SEED_MESSAGE } from './elgamal-seed-message'
import { generateSeedSignature } from './generate-seed-signature'
import { getCacheKey as getTokenAccountsCacheKey } from './use-get-token-accounts'

export const useCreateAssociatedTokenAccountCB = ({
  walletAddressPubkey,
}: {
  walletAddressPubkey: PublicKey
}) => {
  const { connection } = useConnection()
  const client = useQueryClient()
  const transactionToast = useTransactionToast()
  const wallet = useWallet()

  return useMutation({
    mutationKey: ['initialize-account', { endpoint: connection.rpcEndpoint, walletAddressPubkey }],
    mutationFn: async (params: { mintAddress: string }) => {
      try {
        // First, sign the message ELGAMAL_SEED_MESSAGE
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

        const mintAddress = params.mintAddress
        const mintBase64 = Buffer.from(mintAddress).toString('base64')
        const authorityBase64 = Buffer.from(walletAddressPubkey.toString()).toString('base64')

        // Now proceed with the transaction
        const route = `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/create-cb-ata`
        const response = await fetch(route, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mint: mintBase64,
            ata_authority: authorityBase64,
            elgamal_signature: elGamalSignatureBase64,
            aes_signature: aesSignatureBase64,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()

        console.log({ data })

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
        const signature = await wallet.sendTransaction(transaction, connection)

        // Confirm the transaction
        await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

        console.log('Transaction signature:', signature)
        return {
          signature,
          elGamalSignature: elGamalSignatureBase64,
          aesSignature: aesSignatureBase64,
          ...data,
        }
      } catch (error) {
        console.error('Error initializing account:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      if (data.signature) {
        transactionToast(data.signature)
        toast.success('Account initialize txn created ')
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
      if (error instanceof Error && error.message.includes('message signing')) {
        toast.error(`Message signing failed: ${error.message}`)
      } else {
        toast.error(`Initialization failed! ${error}`)
      }
    },
  })
}

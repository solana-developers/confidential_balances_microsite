import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDevMode } from '@/entities/dev-mode'
import { useOperationLog } from '@/entities/operation-log'
import { serverRequest } from '@/shared/api'
import { useToast } from '@/shared/ui/toast'
import { AES_SEED_MESSAGE } from './aes-seed-message'
import { ELGAMAL_SEED_MESSAGE } from './elgamal-seed-message'
import { generateSeedSignature } from './generate-seed-signature'
import { queryKey as getBalanceQK } from './use-get-balance'
import { queryKey as getSignaturesQK } from './use-get-signatures'
import { queryKey as getTokenAccountsQK } from './use-get-token-accounts'

export const useCreateAssociatedTokenAccountCB = ({
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

        const requestBody = {
          mint: mintBase64,
          ata_authority: authorityBase64,
          elgamal_signature: elGamalSignatureBase64,
          aes_signature: aesSignatureBase64,
          latest_blockhash: (await connection.getLatestBlockhash()).blockhash,
        }

        const data = await serverRequest('/create-cb-ata', requestBody)

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
        toast.transaction(data.signature)
        toast.success('Account initialize txn created')

        log.push({
          title: 'Create account Operation - COMPLETE',
          content: `Account initialize txn created\n  Wallet: ${walletAddressPubkey}\n  Signature: ${data.signature}`,
          variant: 'success',
        })
        devMode.set(2, {
          title: 'Create account Operation - COMPLETE',
          result: `Account initialize txn created\n  Wallet: ${walletAddressPubkey}\n  Signature: ${data.signature}`,
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
      if (error instanceof Error && error.message.includes('message signing')) {
        toast.error(`Message signing failed: ${error.message}`)
        log.push({
          title: 'Create account Operation - FAILED',
          content: `Message signing failed\n  Wallet: ${walletAddressPubkey}\n  Error: ${error.message}`,
          variant: 'error',
        })
      } else {
        toast.error(`Initialization failed! ${error}`)
        log.push({
          title: 'Create account Operation - FAILED',
          content: `Account initialization failed\n  Wallet: ${walletAddressPubkey}\n  Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'success',
        })
      }
    },
  })
}

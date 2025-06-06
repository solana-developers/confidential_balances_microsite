import { getAccount, getMint, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/ui/toast'

export const useDepositCb = ({ tokenAccountPubkey }: { tokenAccountPubkey: PublicKey }) => {
  const { connection } = useConnection()
  const client = useQueryClient()
  const toast = useToast()
  const wallet = useWallet()

  return useMutation({
    mutationKey: ['deposit-cb', { endpoint: connection.rpcEndpoint, tokenAccountPubkey }],
    mutationFn: async ({ lamportAmount }: { lamportAmount: string }) => {
      try {
        if (!wallet.publicKey) {
          throw new Error('Wallet not connected')
        }

        // Get ATA account info
        const ataAccountInfo = await connection.getAccountInfo(tokenAccountPubkey)
        if (!ataAccountInfo) {
          throw new Error('Account not found')
        }

        // Get mint decimals using a temporary scope
        const decimals = await (async () => {
          const splTokenAccount = await getAccount(
            connection,
            tokenAccountPubkey,
            'confirmed',
            TOKEN_2022_PROGRAM_ID
          )

          const mint = await getMint(
            connection,
            splTokenAccount.mint,
            'confirmed',
            TOKEN_2022_PROGRAM_ID
          )

          return mint.decimals
        })()

        // Call the deposit-cb endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/deposit-cb`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token_account_data: Buffer.from(ataAccountInfo.data).toString('base64'),
            lamport_amount: lamportAmount,
            mint_decimals: decimals,
          }),
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
        const signature = await wallet.sendTransaction(transaction, connection)

        // Confirm the transaction
        await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

        console.log('Deposit transaction signature:', signature)
        return {
          signature,
          ...data,
        }
      } catch (error) {
        console.error('Error depositing to confidential balance account:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      if (data.signature) {
        toast.transaction(data.signature)
        toast.success('Deposit transaction successful')
      }

      // Log that we're going to invalidate the has-pending-balance query
      console.log('Invalidating has-pending-balance query after successful deposit')

      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, tokenAccountPubkey }],
        }),
        client.invalidateQueries({
          queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, tokenAccountPubkey }],
        }),
        client.invalidateQueries({
          queryKey: [
            'get-token-accounts',
            { endpoint: connection.rpcEndpoint, tokenAccountPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            'get-token-balance',
            {
              endpoint: connection.rpcEndpoint,
              tokenAccountPubkey: tokenAccountPubkey.toString(),
            },
          ],
        }),
        client
          .invalidateQueries({
            queryKey: [
              'has-pending-balance',
              {
                endpoint: connection.rpcEndpoint,
                tokenAccountPubkey: tokenAccountPubkey.toString(),
              },
            ],
          })
          .then(() => {
            console.log('Successfully invalidated has-pending-balance query, will trigger refetch')
          }),
      ]).then(() => {
        console.log('All queries invalidated after deposit')
      })
    },
    onError: (error) => {
      toast.error(`Deposit failed! ${error}`)
    },
  })
}

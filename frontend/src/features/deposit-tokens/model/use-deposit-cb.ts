import { getAccount, getMint, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKey as getBalanceQK } from '@/entities/account/account/model/use-get-balance'
import { queryKey as getSignaturesQK } from '@/entities/account/account/model/use-get-signatures'
import { queryKey as getTokenAccountsQK } from '@/entities/account/account/model/use-get-token-accounts'
import { queryKey as getTokenBalanceQK } from '@/entities/account/account/model/use-get-token-balance'
import { useDevMode } from '@/entities/dev-mode'
import { useOperationLog } from '@/entities/operation-log'
import { useToast } from '@/shared/ui/toast'

async function serverRequest(request: {
  token_account_data: string
  lamport_amount: string
  mint_decimals: number
  latest_blockhash: string
}) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/deposit-cb`, {
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

export const useDepositCb = ({ tokenAccountPubkey }: { tokenAccountPubkey: PublicKey }) => {
  const { connection } = useConnection()
  const wallet = useWallet()
  const client = useQueryClient()

  const toast = useToast()
  const log = useOperationLog()
  const devMode = useDevMode()

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

        const requestBody = {
          token_account_data: Buffer.from(ataAccountInfo.data).toString('base64'),
          lamport_amount: lamportAmount,
          mint_decimals: decimals,
          latest_blockhash: (await connection.getLatestBlockhash()).blockhash,
        }
        console.log('📤 Frontend request body:', JSON.stringify(requestBody, null, 2))

        // Call the deposit-cb endpoint
        const data = await serverRequest(requestBody)

        // Deserialize the transaction from the response
        const serializedTransaction = Buffer.from(data.transaction, 'base64')
        const transaction = VersionedTransaction.deserialize(serializedTransaction)

        // Get the latest blockhash for the transaction
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
          lamportAmount,
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

        log.push({
          title: 'Deposit Operation - COMPLETE',
          content: `Deposit transaction successful\n  Token account: ${tokenAccountPubkey}\n  Lamport amount: ${data.lamportAmount}\n  Signature: ${data.signature}`,
          variant: 'success',
        })

        devMode.set(4, {
          title: 'Deposit Operation - COMPLETE',
          result: `Deposit transaction successful\n  Token account: ${tokenAccountPubkey}\n  Lamport amount: ${data.lamportAmount}\n  Signature: ${data.signature}`,
          success: true,
        })
      }

      // Log that we're going to invalidate the has-pending-balance query
      console.log('Invalidating has-pending-balance query after successful deposit')

      // Invalidate relevant queries to refresh data
      return Promise.all([
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
      log.push({
        title: 'Deposit Operation - FAILED',
        content: `Deposit transaction failed\n  Token account: ${tokenAccountPubkey}\n  Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      })
    },
  })
}

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, TransactionSignature } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKey as getBalanceQK } from '@/entities/account/account/model/use-get-balance'
import { queryKey as getSignaturesQK } from '@/entities/account/account/model/use-get-signatures'
import { useToast } from '@/shared/ui/toast'
import { createTransaction } from './create-transaction'

export const useTransferSol = ({ address }: { address: PublicKey }) => {
  const { connection } = useConnection()
  const toast = useToast()
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
        toast.info(signature)
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: getBalanceQK(connection.rpcEndpoint, address),
        }),
        client.invalidateQueries({
          queryKey: getSignaturesQK(connection.rpcEndpoint, address),
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`)
    },
  })
}

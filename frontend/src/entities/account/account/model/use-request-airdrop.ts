import { useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/ui/toast'
import { queryKey as getBalanceQK } from './use-get-balance'
import { queryKey as getSignaturesQK } from './use-get-signatures'

export const useRequestAirdrop = ({ address }: { address: PublicKey }) => {
  const { connection } = useConnection()
  const toast = useToast()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['airdrop', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (amount: number = 1) => {
      const [latestBlockhash, signature] = await Promise.all([
        connection.getLatestBlockhash(),
        connection.requestAirdrop(address, amount * LAMPORTS_PER_SOL),
      ])

      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
      return signature
    },
    onSuccess: (signature) => {
      toast.transaction(signature)
      return Promise.all([
        client.invalidateQueries({
          queryKey: getBalanceQK(connection.rpcEndpoint, address),
        }),
        client.invalidateQueries({
          queryKey: getSignaturesQK(connection.rpcEndpoint, address),
        }),
      ])
    },
  })
}

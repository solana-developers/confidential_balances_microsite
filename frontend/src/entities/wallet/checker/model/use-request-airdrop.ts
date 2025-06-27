import { useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import pluralize from 'pluralize'
import { queryKey as getBalaceQK } from '@/entities/account/account/model/use-get-balance'
import { useOperationLog } from '@/entities/operation-log'
import { useToast } from '@/shared/ui/toast'

export const useRequestAirdrop = ({ address }: { address: PublicKey }) => {
  const { connection } = useConnection()
  const client = useQueryClient()

  const toast = useToast()
  const log = useOperationLog()

  return useMutation({
    mutationKey: ['airdrop', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (amount: number = 1) => {
      const [latestBlockhash, signature] = await Promise.all([
        connection.getLatestBlockhash(),
        connection.requestAirdrop(address, amount * LAMPORTS_PER_SOL),
      ])

      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
      return { signature, amount }
    },
    onSuccess: ({ signature, amount }) => {
      toast.transaction(signature)
      log.push({
        title: 'Airdrop Operation - COMPLETE',
        content: `Address: ${address}\n  Requested ${pluralize('token', amount, true)}\n  Signature: ${signature}`,
        variant: 'success',
      })

      return Promise.all([
        client.invalidateQueries({
          queryKey: getBalaceQK(connection.rpcEndpoint, address),
        }),
        client.invalidateQueries({
          queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
        }),
      ])
    },
    onError: (error) => {
      log.push({
        title: 'Airdrop Operation - FAILED',
        content: `Address: ${address}\n  Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      })
    },
  })
}

import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

export const queryKey = (endpoint: string, address: PublicKey) => [
  'get-token-balance',
  {
    endpoint,
    tokenAccountPubkey: address,
  },
]

// New hook for getting token balance
export const useGetTokenBalance = ({ tokenAccountPubkey }: { tokenAccountPubkey?: PublicKey }) => {
  const { connection } = useConnection()

  return useQuery({
    queryKey: queryKey(connection.rpcEndpoint, tokenAccountPubkey ?? PublicKey.default),
    queryFn: async () => {
      if (!tokenAccountPubkey) return '0'

      try {
        const response = await connection.getTokenAccountBalance(tokenAccountPubkey)
        return response?.value?.uiAmountString || '0'
      } catch (error) {
        console.error('Error fetching token balance:', error)
        throw error
      }
    },
    retry: 3,
  })
}

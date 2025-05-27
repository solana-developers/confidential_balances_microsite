import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

// New hook for getting token balance
export const useGetTokenBalance = ({ tokenAccountPubkey }: { tokenAccountPubkey: PublicKey }) => {
  const { connection } = useConnection()

  return useQuery({
    queryKey: [
      'get-token-balance',
      {
        endpoint: connection.rpcEndpoint,
        tokenAccountPubkey: tokenAccountPubkey.toString(),
      },
    ],
    queryFn: async () => {
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

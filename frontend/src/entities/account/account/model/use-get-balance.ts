import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

export const queryKey = (endpoint: string, address: PublicKey) => [
  'get-balance',
  { endpoint, address },
]

export const useGetBalance = ({ address }: { address: PublicKey }) => {
  const { connection } = useConnection()

  return useQuery({
    queryKey: queryKey(connection.rpcEndpoint, address),
    queryFn: () => connection.getBalance(address),
  })
}

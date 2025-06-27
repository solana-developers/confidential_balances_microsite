import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

export const queryKey = (endpoint: string, address: PublicKey) => [
  'get-balance',
  { endpoint, address },
]

/**
 *
 * @param param.address - The public key address to fetch balance for
 * @param opts
 * @param opts.enabled - Controls whether the query should run. If false or absent when address is not provided,
 *  the query won't fetch any balance.
 */
export const useGetBalance = ({ address }: { address: PublicKey | null }, opts?: any) => {
  const { connection } = useConnection()

  const notEnabled = () => Boolean(address)

  return useQuery({
    enabled: opts?.enabled ?? notEnabled,
    queryKey: queryKey(connection.rpcEndpoint, address ?? PublicKey.default),
    queryFn: () => connection.getBalance(address ?? PublicKey.default),
  })
}

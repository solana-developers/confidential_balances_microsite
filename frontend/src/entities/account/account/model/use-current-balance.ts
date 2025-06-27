import { useParams } from 'next/navigation'
import { PublicKey } from '@solana/web3.js'
import { useGetTokenBalance } from './use-get-token-balance'

/**
 * Hook to get the current token balance for an account address from the URL params
 * @returns Object containing:
 * - balance: The current token balance as a number (defaults to 0 if no balance)
 * - loading: Boolean indicating if the balance is being loaded
 */
export const useCurrentBalance = () => {
  // Get current address from URL
  const params = useParams()
  const address = params?.address ? new PublicKey(params.address as string) : undefined

  // Get balance for current address
  const { data: balance, isLoading: loading } = useGetTokenBalance({
    tokenAccountPubkey: address,
  })

  return { balance: Number(balance) || 0, loading }
}

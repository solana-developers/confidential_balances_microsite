import { PublicKey } from '@solana/web3.js'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export const queryKey = (address: PublicKey) => [
  'confidential-visibility',
  { address: address.toString() },
]

// Simple hook to manage confidential balance visibility
export const useConfidentialVisibility = (tokenAccountPubkey: PublicKey) => {
  console.log(1, { tokenAccountPubkey: tokenAccountPubkey.toBase58() })

  const client = useQueryClient()
  const qk = queryKey(tokenAccountPubkey) //['confidential-visibility', { address: tokenAccountPubkey.toString() }]

  // Get current visibility state
  const { data: isVisible = false } = useQuery({
    queryKey: qk,
    queryFn: () => false, // Default to hidden
    staleTime: Infinity, // Don't refetch automatically
  })

  // Function to show confidential balance
  const showBalance = () => {
    client.setQueryData(qk, true)
  }

  // Function to hide confidential balance
  const hideBalance = () => {
    client.setQueryData(qk, false)
  }

  return { isVisible, showBalance, hideBalance }
}

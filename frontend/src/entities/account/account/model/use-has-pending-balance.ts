import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

// Hook to check if token account has pending balance
export const useHasPendingBalance = ({ tokenAccountPubkey }: { tokenAccountPubkey: PublicKey }) => {
  const { connection } = useConnection()

  return useQuery({
    queryKey: [
      'has-pending-balance',
      {
        endpoint: connection.rpcEndpoint,
        tokenAccountPubkey: tokenAccountPubkey.toString(),
      },
    ],
    queryFn: async () => {
      try {
        // Get token account info
        const accountInfo = await connection.getParsedAccountInfo(tokenAccountPubkey)

        // Check if account exists and has data
        if (!accountInfo?.value?.data || typeof accountInfo.value.data !== 'object') {
          console.log('No account data found for pending balance check')
          return false
        }

        const parsedData = accountInfo.value.data

        // Check for token account with extensions
        if ('parsed' in parsedData && parsedData.parsed?.info?.extensions) {
          // Find confidentialTransferAccount extension
          const ctExtension = parsedData.parsed.info.extensions.find(
            (ext: any) => ext.extension === 'confidentialTransferAccount'
          )

          // If we found the extension and it has a state
          if (ctExtension?.state) {
            // Check if pendingBalanceCreditCounter is greater than 0
            const pendingCounter = ctExtension.state.pendingBalanceCreditCounter

            // Log the pending counter value for debugging
            console.log('Pending balance credit counter:', pendingCounter)

            if (typeof pendingCounter === 'number' && pendingCounter > 0) {
              console.log('Detected pending balance for account:', tokenAccountPubkey.toString())
              return true
            }
          } else {
            console.log('No confidentialTransferAccount state found in extension')
          }
        } else {
          console.log('No extensions found in token account')
        }

        return false
      } catch (error) {
        console.error('Error checking for pending balance:', error)
        return false
      }
    },
    // Refetch regularly to check for changes
    refetchInterval: 10000, // Check every 10 seconds
    // Stale time to reduce unnecessary fetches
    staleTime: 5000, // Consider data fresh for 5 seconds
    // Retry on error
    retry: 3,
  })
}

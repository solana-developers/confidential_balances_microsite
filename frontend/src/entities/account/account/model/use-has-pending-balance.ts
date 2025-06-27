import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { RPC_NUMBER_OF_RETRIES, RPC_REFRESH_TIMEOUT, RPC_STALE_TIME } from '@/shared/solana'

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
    refetchInterval: RPC_REFRESH_TIMEOUT,
    // Stale time to reduce unnecessary fetches
    staleTime: RPC_STALE_TIME,
    // Retry on error
    retry: RPC_NUMBER_OF_RETRIES,
  })
}

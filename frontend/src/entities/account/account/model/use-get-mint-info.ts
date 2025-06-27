import { getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

// Add a hook to get mint account information
export const useGetMintInfo = ({
  mintAddress,
  enabled = true,
}: {
  mintAddress: string
  enabled?: boolean
}) => {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-mint-info', { endpoint: connection.rpcEndpoint, mintAddress }],
    queryFn: async () => {
      try {
        const mintPublicKey = new PublicKey(mintAddress)

        // Try to get the mint info using Token-2022 program first
        try {
          console.log('Attempting to fetch mint info using Token-2022 program...')
          const mintInfo = await getMint(
            connection,
            mintPublicKey,
            'confirmed',
            TOKEN_2022_PROGRAM_ID
          )
          console.log('Successfully fetched Token-2022 mint:', mintInfo)
          return {
            ...mintInfo,
            isToken2022: true,
          }
        } catch (error) {
          console.log('Not a Token-2022 mint, trying standard Token program...', error)

          // If that fails, try the standard Token program
          try {
            const mintInfo = await getMint(connection, mintPublicKey, 'confirmed', TOKEN_PROGRAM_ID)
            console.log('Successfully fetched standard Token mint:', mintInfo)
            return {
              ...mintInfo,
              isToken2022: false,
            }
          } catch (secondError) {
            console.error('Failed to fetch mint with standard Token program:', secondError)

            // Check if the account exists but is not a token mint
            const accountInfo = await connection.getAccountInfo(mintPublicKey)
            if (accountInfo) {
              console.log('Account exists but is not a token mint:', accountInfo)
              throw new Error(
                `Account exists but is not owned by a Token program. Owner: ${accountInfo.owner.toBase58()}`
              )
            } else {
              console.log('Account does not exist')
              throw new Error('Mint account does not exist')
            }
          }
        }
      } catch (error) {
        console.error('Error fetching mint info:', error)
        throw error
      }
    },
    enabled: enabled && !!mintAddress,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

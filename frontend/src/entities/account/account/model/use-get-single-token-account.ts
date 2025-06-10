import { getAccount, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

/* eslint-disable no-unused-vars */
export enum StatusReasons {
  NOT_ATA = 'Account is not owned by Token Program',
  NOT_EXISTS = 'Account does not exist',
  PARSE_ERROR = 'Failed to parse token account data',
  NETWORK_ERROR = 'Network or RPC error',
  LOADING = 'Query not started',
}
/* eslint-enable no-unused-vars */

export const useGetSingleTokenAccount = ({ address }: { address: PublicKey }) => {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-single-token-account', { endpoint: connection.rpcEndpoint, address }],
    queryFn: async () => {
      try {
        // First, check if the account exists and what program owns it
        const accountInfo = await connection.getAccountInfo(address, 'confirmed')

        // If account doesn't exist at all
        if (!accountInfo) {
          return {
            tokenAccount: null,
            error: null,
            reason: StatusReasons.NOT_EXISTS,
          }
        }

        // Check if the account is owned by either Token Program
        const isOwnedByTokenProgram =
          accountInfo.owner.equals(TOKEN_PROGRAM_ID) ||
          accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)

        if (!isOwnedByTokenProgram) {
          return {
            tokenAccount: null,
            error: null,
            reason: StatusReasons.NOT_ATA,
          }
        }

        // Now we know it's likely a token account, try to parse it
        // First try TOKEN_2022_PROGRAM_ID
        try {
          const tokenAccount = await getAccount(
            connection,
            address,
            'confirmed',
            TOKEN_2022_PROGRAM_ID
          )
          return {
            tokenAccount,
            error: null,
            reason: null,
          }
        } catch (token2022Error) {
          // If that fails, try the regular TOKEN_PROGRAM_ID
          try {
            const tokenAccount = await getAccount(
              connection,
              address,
              'confirmed',
              TOKEN_PROGRAM_ID
            )
            return {
              tokenAccount,
              error: null,
              reason: null,
            }
          } catch (tokenError) {
            // If both fail but the account is owned by a token program,
            // it's likely a token account with an unexpected structure
            return {
              tokenAccount: null,
              error: 'Account is owned by Token Program but could not be parsed as a token account',
              reason: StatusReasons.PARSE_ERROR,
            }
          }
        }
      } catch (error: any) {
        // This is an actual error (network error, etc.)
        console.error('Error fetching account info:', error)
        return {
          tokenAccount: null,
          error: error.message || 'Unknown error',
          reason: StatusReasons.NETWORK_ERROR,
        }
      }
    },
    // Set an initial data value to ensure data is never undefined
    initialData: {
      tokenAccount: null,
      error: null,
      reason: StatusReasons.LOADING,
    },
  })
}

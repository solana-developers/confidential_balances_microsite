import { PublicKey } from '@solana/web3.js'
import { useGetMintInfo } from './use-get-mint-info'
import { useGetSingleTokenAccount } from './use-get-single-token-account'

export const useMint = (tokenAccountPubkey: PublicKey) => {
  // Get token account info to extract the mint
  const tokenAccountQuery = useGetSingleTokenAccount({
    address: tokenAccountPubkey,
  })

  // Use the mint from the token account to get mint info
  const mintInfoQuery = useGetMintInfo({
    mintAddress: tokenAccountQuery.data?.tokenAccount?.mint?.toBase58() || '',
    enabled: !!tokenAccountQuery.data?.tokenAccount?.mint,
  })

  return {
    tokenAccount: tokenAccountQuery.data?.tokenAccount,
    mintInfo: mintInfoQuery.data,
    error: mintInfoQuery.error,
    isLoading: tokenAccountQuery.isLoading || mintInfoQuery.isLoading,
  }
}

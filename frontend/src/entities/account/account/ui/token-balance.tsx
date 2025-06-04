import { FC } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useGetTokenBalance } from '../model/use-get-token-balance'

type TokenBalanceProps = {
  tokenAccountPubkey: PublicKey
}

/** @deprecated balance functionality is coverred by AccountHeader */
export const TokenBalance: FC<TokenBalanceProps> = ({ tokenAccountPubkey }) => {
  const tokenBalanceQuery = useGetTokenBalance({ tokenAccountPubkey })

  return (
    <div>
      <h1 className="text-5xl font-bold">
        {tokenBalanceQuery.isLoading
          ? '...'
          : tokenBalanceQuery.isError
            ? 'Error'
            : `${tokenBalanceQuery.data} Tokens`}
      </h1>
    </div>
  )
}

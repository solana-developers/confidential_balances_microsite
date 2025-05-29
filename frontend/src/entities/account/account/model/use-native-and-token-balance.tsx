import { NATIVE_MINT } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import * as web3 from '@solana/web3.js'
import { QueryObserverOptions, useQuery } from '@tanstack/react-query'
import { nativeToUiAmount } from './native-to-ui-amount'

const WSOL_DECIMALS = 9
const REFRESH_TIMEOUT = 12_000
const NUMBER_OF_RETRIES = 3

type InfoTokenAmount = {
  amount: string
  decimals: number
  uiAmount: number
  uiAmountString: string
}

const empty: InfoTokenAmount = {
  amount: '0',
  decimals: -1,
  uiAmount: 0,
  uiAmountString: '0',
}

export { empty as placeholderData }

export function useNativeAndTokenBalance(
  address: web3.PublicKey | string | undefined,
  opts?: Pick<
    QueryObserverOptions<InfoTokenAmount>,
    'refetchInterval' | 'refetchIntervalInBackground' | 'placeholderData'
  >
) {
  const { connection } = useConnection()
  const { wallet } = useWallet()
  const publicKey = wallet?.adapter.publicKey

  const {
    data: balance,
    error,
    isLoading,
  } = useQuery({
    enabled: Boolean(address && publicKey),
    placeholderData: opts?.placeholderData,
    queryFn: async (): Promise<InfoTokenAmount> => {
      // no token selected yet
      if (!address) {
        return empty
      }

      if (typeof address === 'string') {
        address = new web3.PublicKey(address)
      }

      if (!publicKey) {
        // no wallet connected yet on solana
        return empty
      }

      if (NATIVE_MINT.equals(new web3.PublicKey(address))) {
        const balance = await connection.getBalance(publicKey)
        const ui = nativeToUiAmount(balance)

        return {
          amount: String(balance),
          decimals: WSOL_DECIMALS,
          uiAmount: ui.uiAmount,
          uiAmountString: ui.uiAmountString,
        }
      } else {
        // Get the initial solana token balance
        const results = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: address })

        for (const item of results.value) {
          // FEAT: use schema to parse values
          const tokenInfo = {
            mint: item.account.data.parsed.info.mint as string,
            tokenAmount: item.account.data.parsed.info.tokenAmount as InfoTokenAmount,
          }
          const mintAddress = tokenInfo.mint
          if (mintAddress === address.toString()) {
            return tokenInfo.tokenAmount
          }
        }
      }
      return empty
    },
    queryKey: ['useTokenBalance', String(address), String(publicKey)],
    refetchInterval: opts?.refetchInterval ?? REFRESH_TIMEOUT,
    refetchIntervalInBackground: opts?.refetchIntervalInBackground,
    retry: NUMBER_OF_RETRIES,
  })

  return { balance, error, loading: isLoading }
}

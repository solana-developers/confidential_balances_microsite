import { NATIVE_MINT } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
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

export const queryKey = (endpoint: string, address: PublicKey | null, token: PublicKey) => [
  'use-token-balance-by-mint',
  { endpoint, address, token },
]

export { empty as placeholderData }

const isPublicKey = (address: string | PublicKey): address is PublicKey => {
  if (address instanceof PublicKey) {
    return true
  }
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

export function useNativeAndTokenBalance(
  address: PublicKey | string,
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
      if (!address || !isPublicKey(address) || !publicKey) {
        return empty
      }

      const pubKey = address instanceof PublicKey ? address : new PublicKey(address)

      if (NATIVE_MINT.equals(pubKey)) {
        const balance = await connection.getBalance(publicKey)
        const ui = nativeToUiAmount(balance)

        return {
          amount: String(balance),
          decimals: WSOL_DECIMALS,
          uiAmount: ui.uiAmount,
          uiAmountString: ui.uiAmountString,
        }
      }

      const results = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: pubKey })

      for (const item of results.value) {
        const tokenInfo = {
          mint: item.account.data.parsed.info.mint as string,
          tokenAmount: item.account.data.parsed.info.tokenAmount as InfoTokenAmount,
        }
        const mintAddress = tokenInfo.mint
        if (mintAddress === pubKey.toString()) {
          return tokenInfo.tokenAmount
        }
      }

      return empty
    },
    queryKey: queryKey(
      connection.rpcEndpoint,
      publicKey ?? null,
      address instanceof PublicKey ? address : new PublicKey(address)
    ),
    refetchInterval: opts?.refetchInterval ?? REFRESH_TIMEOUT,
    refetchIntervalInBackground: opts?.refetchIntervalInBackground,
    retry: NUMBER_OF_RETRIES,
  })

  return { balance, error, loading: isLoading }
}

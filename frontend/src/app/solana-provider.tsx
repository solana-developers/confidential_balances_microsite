'use client'

import { FC, PropsWithChildren, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { WalletError } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { useCluster } from '@/shared/solana'

import '@solana/wallet-adapter-react-ui/styles.css'

export const WalletButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  {
    ssr: false,
  }
)

export const SolanaProvider: FC<PropsWithChildren> = ({ children }) => {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])
  const onError = useCallback((error: WalletError) => {
    console.error(error)
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} onError={onError} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

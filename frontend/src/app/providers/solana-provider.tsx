'use client'

// import wallet styles to not redeclare every style
import '@solana/wallet-adapter-react-ui/styles.css'

import { FC, PropsWithChildren, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { WalletError } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { LedgerWalletAdapter } from '@solana/wallet-adapter-wallets'
import { useCluster } from '@/shared/solana'
import { useToast } from '@/shared/ui/toast'

export const WalletButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  {
    ssr: false,
  }
)

export const SolanaProvider: FC<PropsWithChildren> = ({ children }) => {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])
  const toast = useToast()

  const onError = useCallback(
    (error: WalletError) => {
      toast.error(`Wallet Error: ${error.message}`)
    },
    [toast]
  )

  const wallets = useMemo(() => [new LedgerWalletAdapter()], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

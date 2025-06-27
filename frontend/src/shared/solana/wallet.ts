import { useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

export const useWalletDisconnected = (onDisconnect: () => void | Promise<void>) => {
  const { wallet } = useWallet()

  useEffect(() => {
    if (!wallet?.adapter) return

    wallet.adapter.on('disconnect', onDisconnect)

    return () => {
      wallet.adapter.off('disconnect', onDisconnect)
    }
  }, [wallet, onDisconnect])
}

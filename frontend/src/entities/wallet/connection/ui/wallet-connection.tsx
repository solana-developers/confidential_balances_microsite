import { FC, useCallback } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@solana-foundation/ms-tools-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

export const WalletConnection: FC = () => {
  const { connected } = useWallet()
  const { setVisible } = useWalletModal()

  const connectWallet = useCallback(() => setVisible(true), [setVisible])

  return !connected ? (
    <Alert className="cursor-pointer" variant="warning" onClick={connectWallet}>
      <AlertTitle>Wallet is not connected</AlertTitle>
      <AlertDescription>Please select the wallet to connect.</AlertDescription>
    </Alert>
  ) : undefined
}

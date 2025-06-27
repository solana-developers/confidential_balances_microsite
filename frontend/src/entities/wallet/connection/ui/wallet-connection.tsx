import { ComponentProps, FC, useCallback } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@solana-foundation/ms-tools-ui/components/alert'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { cn } from '@/shared/utils'

export const WalletConnection: FC<ComponentProps<'div'>> = ({ className }) => {
  const { connected } = useWallet()
  const { setVisible } = useWalletModal()

  const connectWallet = useCallback(() => setVisible(true), [setVisible])

  return !connected ? (
    <Alert
      className={cn('z-50 max-h-14 cursor-pointer p-3 [&_svg]:shrink-0', className)}
      variant="warning"
      onClick={connectWallet}
    >
      <AlertTitle className="text-sm font-medium">Wallet is not connected</AlertTitle>
      <AlertDescription className="text-xs">Please select the wallet to connect.</AlertDescription>
    </Alert>
  ) : undefined
}

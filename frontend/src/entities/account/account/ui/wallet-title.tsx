import { ComponentProps, FC } from 'react'
import { Address } from '@solana-foundation/ms-tools-ui/components/address'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { cn } from '@/shared/utils'

export const WalletTitle: FC<
  {
    address?: PublicKey
  } & ComponentProps<'div'>
> = ({ address, ...props }) => {
  const { connected, wallet, publicKey } = useWallet()
  return (
    <WalletTitleView {...{ connected, wallet, publicKey, walletAddress: address }} {...props} />
  )
}

export function WalletTitleView({
  className,
  connected,
  wallet,
  publicKey,
  walletAddress,
}: Pick<ReturnType<typeof useWallet>, 'connected' | 'wallet' | 'publicKey'> & {
  walletAddress?: PublicKey
} & ComponentProps<'div'>) {
  const address = walletAddress?.toBase58() ?? publicKey?.toBase58()

  return (
    <>
      {connected && wallet && address ? (
        <div className={cn('flex flex-col', className)}>
          <span className="text-xs">
            <Address address={address} asChild>
              <span className="text-(color:--accent)">{address}</span>
            </Address>
          </span>
        </div>
      ) : (
        <span className="text-muted font-mono text-[12px] leading-4">No wallet connected</span>
      )}
    </>
  )
}

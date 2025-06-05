import { ComponentProps, FC } from 'react'
import { Address } from '@solana-foundation/ms-tools-ui'
import { useWallet } from '@solana/wallet-adapter-react'

export const WalletTitle: FC<ComponentProps<'div'>> = () => {
  const { connected, wallet, publicKey } = useWallet()
  return <WalletTitleView {...{ connected, wallet, publicKey }} />
}

export function WalletTitleView({
  connected,
  wallet,
  publicKey,
}: Pick<ReturnType<typeof useWallet>, 'connected' | 'wallet' | 'publicKey'>) {
  const address = publicKey?.toBase58()

  return (
    <>
      {connected && wallet && address ? (
        <div className="flex flex-col">
          <span className="text-xs">
            <Address address={address} asChild>
              <span className="text-(color:--accent)">{address}</span>
            </Address>
          </span>
        </div>
      ) : (
        // make font smaller than text-sm to not import additional font
        <span className="text-muted font-mono text-[12px] leading-4">No wallet connected</span>
      )}
    </>
  )
}

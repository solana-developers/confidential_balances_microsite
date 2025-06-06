import { FC } from 'react'
import { WalletButton } from '@/app/providers/solana-provider'

export const List: FC = () => (
  <div className="hero py-[64px]">
    <div className="hero-content text-center">
      <WalletButton />
    </div>
  </div>
)

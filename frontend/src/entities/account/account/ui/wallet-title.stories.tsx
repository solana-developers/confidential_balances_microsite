import { WalletReadyState } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { Keypair } from '@solana/web3.js'
import type { Meta, StoryObj } from '@storybook/react'
import { WalletTitleView } from './wallet-title'

const meta = {
  title: 'WalletTitleView',
  component: WalletTitleView,
  args: {},
} satisfies Meta<typeof WalletTitleView>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    wallet: null,
    publicKey: null,
    connected: false,
  },
}

export const Connected: Story = {
  args: {
    connected: true,
    wallet: { adapter: new PhantomWalletAdapter(), readyState: WalletReadyState.Installed },
    publicKey: Keypair.generate().publicKey,
  },
}

import { WalletReadyState } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { Keypair } from '@solana/web3.js'
import type { Meta, StoryObj } from '@storybook/react'
import { WalletTitleView } from './wallet-title'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'WalletTitleView',
  component: WalletTitleView,
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {},
} satisfies Meta<typeof WalletTitleView>

export default meta

type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
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

import { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { CardBalance } from './card-balance'

type Props = ComponentProps<typeof CardBalance>

export default {
  title: 'Card/Balance',
  component: CardBalance,
  argTypes: {
    title: { control: 'text' },
    balance: { control: 'text' },
  },
  args: {
    title: 'Wallet balance',
    balance: '20',
    symbol: 'SOL',
  },
} satisfies Meta<Props>

type Story = StoryObj<Props>

export const Default: Story = {
  name: 'Balance',
}

export const Empty: Story = {
  args: {
    balance: undefined,
  },
}

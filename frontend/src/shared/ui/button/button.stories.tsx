import { ComponentProps, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import * as Icons from 'lucide-react'
import { Button } from './button'
import { DevModeButton } from './dev-mode-button'
import { WalletButton } from './wallet-button'

type Props = ComponentProps<typeof Button> & {
  hasIcon: boolean
  wallet: string
}

export default {
  title: 'Button',
  component: Button,
  argTypes: {
    hasIcon: { name: 'icon', control: 'boolean', table: { category: 'content' } },
    children: { control: 'text', table: { category: 'content' } },
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      table: { category: 'variant' },
    },
    size: { control: 'select', options: ['default', 'sm'], table: { category: 'variant' } },
    loading: { control: 'boolean', table: { category: 'state' } },
    disabled: { control: 'boolean', table: { category: 'state' } },
    wallet: { control: 'text', table: { disable: true } },
    onClick: { table: { disable: true } },
  },
  args: {
    hasIcon: false,
    variant: 'primary',
    size: 'default',
    children: 'Button',
    loading: false,
    disabled: false,
    onClick: fn(),
  },
} satisfies Meta<Props>

type Story = StoryObj<Props>

export const Default: Story = {
  name: 'Button',
  render: ({ hasIcon, ...args }) => <Button {...args} icon={hasIcon ? Icons.Network : undefined} />,
}

export const Wallet: Story = {
  parameters: {
    controls: { include: ['wallet', 'loading', 'disabled'] },
  },
  args: {
    wallet: 'B5fc4JaSjC27kz7KsDaoi1Mo211v6bQwZWJj93jgtrnt',
  },
  argTypes: {
    wallet: { table: { disable: false } },
  },
  render: ({ wallet, loading, disabled, onClick }) => (
    <WalletButton address={wallet} loading={loading} disabled={disabled} onClick={onClick} />
  ),
}

export const DevMode: Story = {
  parameters: {
    controls: { include: ['loading', 'disabled'] },
  },
  render: ({ loading, disabled, onClick }) => {
    const [state, setState] = useState<boolean>(false)
    return (
      <DevModeButton
        state={state}
        loading={loading}
        disabled={disabled}
        onClick={() => {
          onClick?.()
          setState((state) => !state)
        }}
      />
    )
  },
}

export const ConnectTestAccount: Story = {
  parameters: {
    controls: { include: ['loading', 'disabled'] },
  },
  render: ({ loading, disabled, onClick }) => (
    <Button
      variant="secondary"
      size="sm"
      loading={loading}
      disabled={disabled}
      icon={Icons.PlusCircle}
      onClick={onClick}
    >
      Create test account with 1000 tokens
    </Button>
  ),
}

export const Deposit: Story = {
  parameters: {
    controls: { include: ['loading', 'disabled'] },
  },
  render: ({ loading, disabled, onClick }) => (
    <Button
      variant="secondary"
      size="sm"
      loading={loading}
      disabled={disabled}
      icon={Icons.ArrowUp}
      onClick={onClick}
    >
      Deposit
    </Button>
  ),
}

export const Withdraw: Story = {
  parameters: {
    controls: { include: ['loading', 'disabled'] },
  },
  render: ({ loading, disabled, onClick }) => (
    <Button
      variant="secondary"
      size="sm"
      loading={loading}
      disabled={disabled}
      icon={Icons.ArrowDown}
      onClick={onClick}
    >
      Withdraw
    </Button>
  ),
}

export const Transfer: Story = {
  parameters: {
    controls: { include: ['loading', 'disabled'] },
  },
  render: ({ loading, disabled, onClick }) => (
    <Button
      variant="secondary"
      size="sm"
      loading={loading}
      disabled={disabled}
      icon={Icons.Send}
      onClick={onClick}
    >
      Transfer
    </Button>
  ),
}

export const DecryptAvailableBalance: Story = {
  parameters: {
    controls: { include: ['loading', 'disabled'] },
  },
  render: ({ loading, disabled, onClick }) => (
    <Button
      variant="secondary"
      size="sm"
      loading={loading}
      disabled={disabled}
      icon={Icons.Unlock}
      onClick={onClick}
    >
      Decrypt available balance
    </Button>
  ),
}

export const EncryptAvailableBalance: Story = {
  parameters: {
    controls: { include: ['loading', 'disabled'] },
  },
  render: ({ loading, disabled, onClick }) => (
    <Button
      variant="secondary"
      size="sm"
      loading={loading}
      disabled={disabled}
      icon={Icons.Lock}
      onClick={onClick}
    >
      Encrypt available balance
    </Button>
  ),
}

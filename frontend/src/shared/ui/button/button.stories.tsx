import { ComponentProps, useState } from 'react'
import { Button } from '@solana-foundation/ms-tools-ui/components/button'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { DevModeButton } from './dev-mode-button'

type Props = ComponentProps<typeof Button> & {
  hasIcon: boolean
  wallet: string
}

export default {
  title: 'Button',
  component: Button,
  args: {
    onClick: fn(),
  },
} satisfies Meta<Props>

type Story = StoryObj<Props>

export const DevMode: Story = {
  parameters: {
    controls: { include: ['loading', 'disabled'] },
  },
  render: ({ onClick }) => {
    const [state, setState] = useState<boolean>(false)
    return (
      <DevModeButton
        state={state}
        onClick={(e) => {
          onClick?.(e)
          setState((state) => !state)
        }}
      />
    )
  },
}

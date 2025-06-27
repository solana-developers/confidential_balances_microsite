import type { Meta, StoryObj } from '@storybook/react'
import { fn, userEvent, within } from '@storybook/test'
import { PlusCircle } from 'lucide-react'
import { DataTable } from './index'

const meta = {
  title: 'DataTable',
  component: DataTable,
  args: { onClick: fn() },
} satisfies Meta<typeof DataTable>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Data table contents',
  },
}

export const WithActions: Story = {
  args: {
    title: 'Data table contents',
    actions: [
      {
        action: 'createTokens',
        title: 'Create test account with 1000 tokens',
        onClick: fn(),
        icon: <PlusCircle />,
      },
      {
        action: 'createCTA',
        title: 'Create account',
        onClick: fn(),
      },
    ],
  },
  async play({ canvasElement }) {
    const context = within(canvasElement)
    const act1 = context.getByLabelText('createTokens')
    userEvent.click(act1)
    const act2 = context.getByLabelText('createCTA')
    userEvent.click(act2)
  },
}

export const WithRecordsOnly: Story = {
  args: {
    title: 'Data table contents',
    rows: [
      ['Field 1', 'Field 2'],
      ['Field 2.1', 'Field 2.2'],
    ],
  },
}

export const WithRecordsAndHeaders: Story = {
  args: {
    rows: [['Account address', 'Wallet address']],
    headers: ['Account', 'Wallet'],
  },
}

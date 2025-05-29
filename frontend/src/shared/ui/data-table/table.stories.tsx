import type { Meta, StoryObj } from '@storybook/react'
import { fn, userEvent, within } from '@storybook/test'
// import { Address } from './address'
import { PlusCircle } from 'lucide-react'
import { DataTable } from './index'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'DataTable',
  component: DataTable,
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onClick: fn() },
} satisfies Meta<typeof DataTable>

export default meta

type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    title: 'Data table contents',
  },
}

// TODO: it seems that using addon-interactions breaks actions. should check API to make it back to work
export const WithActions: Story = {
  args: {
    title: 'Data table contents',
    actions: [
      {
        action: 'createTokens',
        title: 'Create test account with 1000 tokens',
        onClick: fn(),
        icon: PlusCircle,
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

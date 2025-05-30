import { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { userEvent, within } from '@storybook/test'
import { BackwardControl } from './backward-control'

type Props = ComponentProps<typeof BackwardControl>

export default {
  title: 'BackwardControl',
  component: BackwardControl,
  args: {
    children: 'Go back',
    href: 'javascript:void(0)',
  },
} satisfies Meta<Props>

type Story = StoryObj<Props>

export const Default: Story = {
  async play({ canvasElement }) {
    const context = within(canvasElement)
    const linkEl = context.getByLabelText('backward-control')
    await userEvent.click(linkEl)
  },
}

import { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Panel } from './panel'

type Props = ComponentProps<typeof Panel>

export default {
  title: 'Panel',
  component: Panel,
  argTypes: {
    children: { control: 'text' },
  },
  args: {
    title: 'Panel title',
    children: 'Panel content',
  },
} satisfies Meta<Props>

type Story = StoryObj<Props>

export const Default: Story = {
  name: 'Panel',
}

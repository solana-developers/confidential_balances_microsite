import { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Text } from './text'

type Props = ComponentProps<typeof Text>

export default {
  title: 'Text',
  component: Text,
  argTypes: {
    variant: {
      control: 'select',
      options: ['header1', 'text', 'textSmall'],
    },
  },
  args: {
    variant: 'text',
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
} satisfies Meta<Props>

type Story = StoryObj<Props>

export const Default: Story = {
  name: 'Text',
}

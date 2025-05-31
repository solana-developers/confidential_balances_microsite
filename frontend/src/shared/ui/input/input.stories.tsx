import { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'

type Props = ComponentProps<typeof Input>

export default {
  title: 'Input',
  component: Input,
  args: {
    value: 1000,
  },
} satisfies Meta<Props>

type Story = StoryObj<Props>

export const Default: Story = {}

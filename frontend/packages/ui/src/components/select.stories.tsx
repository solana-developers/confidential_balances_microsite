import { SelectGroup } from '@radix-ui/react-select'
import { Meta, StoryObj } from '@storybook/react'
import { Apple, Carrot, Citrus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select'

export default {
  title: 'Select',
  component: Select,
  argTypes: {
    size: { control: 'select', options: ['sm', 'default'] },
    disabled: { control: 'boolean' },
  },
} as Meta<typeof Select>

const DEFAULT_ARGUMENTS = {
  size: 'default',
  disabled: false,
}

type Story = StoryObj<typeof Select>

export const Default: Story = {
  args: DEFAULT_ARGUMENTS,
  render: (args) => (
    <Select {...args}>
      <SelectTrigger>
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">Option 1</SelectItem>
        <SelectItem value="2">Option 2</SelectItem>
        <SelectItem value="3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const Disabled: Story = {
  args: { ...DEFAULT_ARGUMENTS, disabled: true },
  render: (args) => (
    <Select {...args}>
      <SelectTrigger>
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">Option 1</SelectItem>
        <SelectItem value="2">Option 2</SelectItem>
        <SelectItem value="3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const GroupedOptions: Story = {
  args: DEFAULT_ARGUMENTS,
  render: (args) => (
    <Select {...args}>
      <SelectTrigger>
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Group 1</SelectLabel>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Group 2</SelectLabel>
          <SelectItem value="3">Option 3</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const WithIcon: Story = {
  args: DEFAULT_ARGUMENTS,
  render: (args) => (
    <Select {...args}>
      <SelectTrigger>
        <SelectValue placeholder="Select an option" />
        <span className="absolute right-2 flex size-3.5 items-center justify-center">
          <span className="text-muted-foreground">Icon</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">
          <Carrot /> Option 1
        </SelectItem>
        <SelectItem value="2">
          <Citrus /> Option 2
        </SelectItem>
        <SelectItem value="3">
          <Apple /> Option 3
        </SelectItem>
      </SelectContent>
    </Select>
  ),
}

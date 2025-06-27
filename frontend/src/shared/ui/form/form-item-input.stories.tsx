import { ComponentProps } from 'react'
import { Form, FormField } from '@solana-foundation/ms-tools-ui/components/form'
import type { Meta, StoryObj } from '@storybook/react'
import { useForm } from 'react-hook-form'
import { FormItemInput } from './form-item-input'

type Props = ComponentProps<typeof FormItemInput>

export default {
  title: 'FormItemInput',
  component: FormItemInput,
  args: {},
} satisfies Meta<Props>

type Story = StoryObj<Props>

export const Default: Story = {
  args: {
    label: 'Amount (tokens)',
  },
  render(args) {
    const form = useForm({
      defaultValues: {
        input: 1000,
      },
    })
    return (
      <Form {...form}>
        <form>
          <FormField
            control={form.control}
            name="input"
            render={({ field }) => <FormItemInput {...args} {...field} />}
          ></FormField>
        </form>
      </Form>
    )
  },
}

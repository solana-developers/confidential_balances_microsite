import { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CardStep } from "./card-step";

type Props = ComponentProps<typeof CardStep>;

export default {
  title: "Card/Step",
  component: CardStep,
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    step: { control: "number" },
  },
  args: {
    title: "Create test account",
    description:
      "Receive 1000 free tokens in your account for testing purposes",
    step: 1,
  },
} satisfies Meta<Props>;

type Story = StoryObj<Props>;

export const Default: Story = {
  name: "Step",
};

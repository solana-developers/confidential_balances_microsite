import type { Meta, StoryObj } from "@storybook/react";
import { TestButton } from "../TestButton";

// Meta configuration for the component
const meta: Meta<typeof TestButton> = {
  title: "UI/TestButton",
  component: TestButton,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TestButton>;

// Default story
export const Default: Story = {
  args: {
    children: "Click me",
  },
};

// Size variations
export const Small: Story = {
  args: {
    size: "small",
    children: "Small Button",
  },
};

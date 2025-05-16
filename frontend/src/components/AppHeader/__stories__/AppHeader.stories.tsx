import type { Meta, StoryObj } from "@storybook/react";
import { AppHeader } from "../AppHeader";

import "../../ui/themes/dark/styles.scss";
import "../../ui/atoms/app-button.scss";
import "../../ui/atoms/flex.scss";
import "../app-header.scss";

const meta = {
  title: "Layout/AppHeader",
  component: AppHeader,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

import type { Meta, StoryObj } from "@storybook/react";
import { AppLink } from "../AppLink";

import "../../themes/dark/styles.scss";
import "../../atoms/app-button.scss";
import "../../atoms/flex.scss";

const meta = {
  title: "UI/AppLink",
  component: AppLink,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AppLink>;

export default meta;
type Story = StoryObj<typeof meta>;

const linkStyles = [
  "primary",
  "secondary",
  "light",
  "success",
  "warning",
  "danger",
  "info",
  "ghost",
] as const;

const LinkRow = ({
  size,
  title,
}: {
  size?: "small" | "medium" | "large" | "jumbo";
  title: string;
}) => (
  <div className="flex flex--col gap16">
    <h3 style={{ margin: 0, textTransform: "capitalize" }}>{title}</h3>
    <div className="flex gap16">
      {linkStyles.map((style) => (
        <AppLink
          key={style}
          href="#"
          style={style}
          size={size}
          onClick={(e) => {
            e.preventDefault();
            console.log(`Clicked ${style} link`);
          }}
        >
          {style}
        </AppLink>
      ))}
    </div>
  </div>
);

export const AllSizes: Story = {
  args: {
    children: "Link",
    href: "#",
  },
  render: () => (
    <div className="flex flex--col gap24">
      <LinkRow title="default links" />
      <LinkRow size="small" title="small links" />
      <LinkRow size="medium" title="medium links" />
      <LinkRow size="large" title="large links" />
      <LinkRow size="jumbo" title="jumbo links" />
    </div>
  ),
};

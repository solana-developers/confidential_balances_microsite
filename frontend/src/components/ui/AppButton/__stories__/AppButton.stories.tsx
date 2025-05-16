import type { Meta, StoryObj } from "@storybook/react";
import { AppButton } from "../AppButton";

import "../../themes/dark/styles.scss";
import "../../atoms/app-button.scss";
import "../../atoms/flex.scss";

const meta = {
  title: "UI/AppButton",
  component: AppButton,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AppButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const buttonStyles = [
  "primary",
  "secondary",
  "light",
  "success",
  "warning",
  "danger",
  "info",
  "ghost",
] as const;

const RegularButtonRow = ({
  size,
  title,
}: {
  size?: "small" | "medium" | "large" | "jumbo";
  title: string;
}) => (
  <div className="flex flex--col gap16">
    <h3 style={{ margin: 0, textTransform: "capitalize" }}>{title}</h3>
    <div className="flex gap16">
      {buttonStyles.map((style) => (
        <AppButton key={style} style={style} size={size}>
          {style}
        </AppButton>
      ))}
    </div>
  </div>
);

const IconButtonRow = ({
  size,
  title,
}: {
  size?: "small" | "medium" | "large" | "jumbo";
  title: string;
}) => (
  <div className="flex flex--col gap16">
    <h3 style={{ margin: 0, textTransform: "capitalize" }}>{title}</h3>
    <div className="flex gap16">
      {buttonStyles.map((style) => (
        <AppButton key={style} style={style} size={size}>
          <>
            <i className="fa-solid fa-code"></i>
            <span>{style}</span>
          </>
        </AppButton>
      ))}
    </div>
  </div>
);

export const AllSizes: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div className="flex flex--col gap24">
      <RegularButtonRow title="default buttons" />
      <RegularButtonRow size="small" title="small buttons" />
      <RegularButtonRow size="medium" title="medium buttons" />
      <RegularButtonRow size="large" title="large buttons" />
      <RegularButtonRow size="jumbo" title="jumbo buttons" />
      <IconButtonRow title="buttons with icon" />
      <IconButtonRow size="small" title="small buttons with icon" />
      <IconButtonRow size="medium" title="medium buttons with icon" />
      <IconButtonRow size="large" title="large buttons with icon" />
      <IconButtonRow size="jumbo" title="jumbo buttons with icon" />
    </div>
  ),
};

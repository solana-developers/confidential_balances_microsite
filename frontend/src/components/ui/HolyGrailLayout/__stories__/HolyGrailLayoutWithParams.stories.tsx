import type { Meta, StoryObj } from "@storybook/react";
import HolyGrailLayoutWithParams from "../HolyGrailLayoutWithParams";

import "./stories.scss";

const meta: Meta<typeof HolyGrailLayoutWithParams> = {
  title: "1-Layouts/2-HolyGrailLayoutWithParams",
  component: HolyGrailLayoutWithParams,
  parameters: {
    docs: { disable: true },
  },
};

export default meta;
type Story = StoryObj<typeof HolyGrailLayoutWithParams>;

// Basic layout without sidebars
export const Default: Story = {
  render: () => (
    <HolyGrailLayoutWithParams
      layoutRoot="#storybook-root"
      header={<h1 className="holy-grail--text">Header</h1>}
      content={
        <>
          <h2 className="holy-grail--text">Main Content</h2>
          <p className="holy-grail--text">Basic layout without sidebars</p>
        </>
      }
      footer={<p className="holy-grail--text">Footer content</p>}
    />
  ),
};

// Layout with left sidebar
export const WithLeftSidebar: Story = {
  render: () => (
    <HolyGrailLayoutWithParams
      layoutRoot="#storybook-root"
      header={<h1 className="holy-grail--text">Header</h1>}
      leftSidebar={
        <>
          <h2 className="holy-grail--text">Left Sidebar</h2>
          <p className="holy-grail--text">Navigation menu</p>
        </>
      }
      content={
        <>
          <h2 className="holy-grail--text">Main Content</h2>
          <p className="holy-grail--text">Layout with left sidebar</p>
        </>
      }
      footer={<p className="holy-grail--text">Footer content</p>}
    />
  ),
};

// Layout with right sidebar
export const WithRightSidebar: Story = {
  render: () => (
    <HolyGrailLayoutWithParams
      layoutRoot="#storybook-root"
      header={<h1 className="holy-grail--text">Header</h1>}
      content={
        <>
          <h2 className="holy-grail--text">Main Content</h2>
          <p className="holy-grail--text">Layout with right sidebar</p>
        </>
      }
      rightSidebar={
        <>
          <h2 className="holy-grail--text">Right Sidebar</h2>
          <p className="holy-grail--text">Additional info</p>
        </>
      }
      footer={<p className="holy-grail--text">Footer content</p>}
    />
  ),
};

// Layout with both sidebars
export const WithBothSidebars: Story = {
  render: () => (
    <HolyGrailLayoutWithParams
      layoutRoot="#storybook-root"
      header={<h1 className="holy-grail--text">Header</h1>}
      leftSidebar={
        <>
          <h2 className="holy-grail--text">Left Sidebar</h2>
          <p className="holy-grail--text">Navigation menu</p>
        </>
      }
      content={
        <>
          <h2 className="holy-grail--text">Main Content</h2>
          <p className="holy-grail--text">Layout with both sidebars</p>
        </>
      }
      rightSidebar={
        <>
          <h2 className="holy-grail--text">Right Sidebar</h2>
          <p className="holy-grail--text">Additional info</p>
        </>
      }
      footer={<p className="holy-grail--text">Footer content</p>}
    />
  ),
};

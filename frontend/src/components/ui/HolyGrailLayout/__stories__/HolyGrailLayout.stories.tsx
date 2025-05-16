import type { Meta, StoryObj } from "@storybook/react";
import HolyGrailLayout, {
  Header,
  Footer,
  AsideLeft,
  AsideRight,
  MainContent,
  MainColumns
} from "..";
import "./stories.scss";

const meta: Meta<typeof HolyGrailLayout> = {
  title: "1-Layouts/1-HolyGrailLayout",
  component: HolyGrailLayout,
  parameters: {
    docs: { disable: true }
  }
};

export default meta;
type Story = StoryObj<typeof HolyGrailLayout>;

// Basic layout without sidebars
export const Default: Story = {
  render: () => (
    <HolyGrailLayout layoutRoot="#storybook-root">
      <Header>
        <h1 className="holy-grail--text">Header</h1>
      </Header>
      <MainColumns>
        <MainContent>
          <h2 className="holy-grail--text">Main Content</h2>
          <p className="holy-grail--text">Basic layout without sidebars</p>
        </MainContent>
      </MainColumns>
      <Footer>
        <p className="holy-grail--text">Footer content</p>
      </Footer>
    </HolyGrailLayout>
  )
};

// Layout with left sidebar
export const WithLeftSidebar: Story = {
  render: () => (
    <HolyGrailLayout layoutRoot="#storybook-root">
      <Header>
        <h1 className="holy-grail--text">Header</h1>
      </Header>
      <MainColumns>
        <AsideLeft>
          <h2 className="holy-grail--text">Left Sidebar</h2>
          <p className="holy-grail--text">Navigation menu</p>
        </AsideLeft>
        <MainContent>
          <h2 className="holy-grail--text">Main Content</h2>
          <p className="holy-grail--text">Layout with left sidebar</p>
        </MainContent>
      </MainColumns>
      <Footer>
        <p className="holy-grail--text">Footer content</p>
      </Footer>
    </HolyGrailLayout>
  )
};

// Layout with right sidebar
export const WithRightSidebar: Story = {
  render: () => (
    <HolyGrailLayout layoutRoot="#storybook-root">
      <Header>
        <h1 className="holy-grail--text">Header</h1>
      </Header>
      <MainColumns>
        <MainContent>
          <h2 className="holy-grail--text">Main Content</h2>
          <p className="holy-grail--text">Layout with right sidebar</p>
        </MainContent>
        <AsideRight>
          <h2 className="holy-grail--text">Right Sidebar</h2>
          <p className="holy-grail--text">Additional info</p>
        </AsideRight>
      </MainColumns>
      <Footer>
        <p className="holy-grail--text">Footer content</p>
      </Footer>
    </HolyGrailLayout>
  )
};

// Layout with both sidebars
export const WithBothSidebars: Story = {
  render: () => (
    <HolyGrailLayout layoutRoot="#storybook-root">
      <Header>
        <h1 className="holy-grail--text">Header</h1>
      </Header>
      <MainColumns>
        <AsideLeft>
          <h2 className="holy-grail--text">Left Sidebar</h2>
          <p className="holy-grail--text">Navigation menu</p>
        </AsideLeft>
        <MainContent>
          <h2 className="holy-grail--text">Main Content</h2>
          <p className="holy-grail--text">Layout with both sidebars</p>
        </MainContent>
        <AsideRight>
          <h2 className="holy-grail--text">Right Sidebar</h2>
          <p className="holy-grail--text">Additional info</p>
        </AsideRight>
      </MainColumns>
      <Footer>
        <p className="holy-grail--text">Footer content</p>
      </Footer>
    </HolyGrailLayout>
  )
};

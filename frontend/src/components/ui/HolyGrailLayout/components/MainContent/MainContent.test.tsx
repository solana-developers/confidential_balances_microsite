import { render, screen } from "@testing-library/react";
import MainContent from "./MainContent";

describe("MainContent", () => {
  it("should render children correctly", () => {
    const testContent = "Main Content";
    render(<MainContent>{testContent}</MainContent>);

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it("should have correct CSS class", () => {
    const { container } = render(<MainContent>Content</MainContent>);

    const mainElement = container.firstChild as HTMLElement;
    expect(mainElement).toHaveClass("holy-grail--content");
  });

  it("should render as main HTML element", () => {
    const { container } = render(<MainContent>Content</MainContent>);

    const mainElement = container.firstChild as HTMLElement;
    expect(mainElement.tagName.toLowerCase()).toBe("main");
  });

  it("should render multiple children correctly", () => {
    render(
      <MainContent>
        <div>Section 1</div>
        <div>Section 2</div>
      </MainContent>
    );

    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByText("Section 2")).toBeInTheDocument();
  });
});

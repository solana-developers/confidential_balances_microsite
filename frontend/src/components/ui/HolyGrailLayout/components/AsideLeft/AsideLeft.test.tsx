import { render, screen } from "@testing-library/react";
import AsideLeft from "./AsideLeft";

describe("AsideLeft", () => {
  it("should render children correctly", () => {
    const testContent = "Test Content";
    render(<AsideLeft>{testContent}</AsideLeft>);

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it("should have correct CSS class", () => {
    const { container } = render(<AsideLeft>Content</AsideLeft>);

    const asideElement = container.firstChild as HTMLElement;
    expect(asideElement).toHaveClass("holy-grail--aside");
  });

  it("should render as aside HTML element", () => {
    const { container } = render(<AsideLeft>Content</AsideLeft>);

    const asideElement = container.firstChild as HTMLElement;
    expect(asideElement.tagName.toLowerCase()).toBe("aside");
  });

  it("should render multiple children correctly", () => {
    render(
      <AsideLeft>
        <div>Child 1</div>
        <div>Child 2</div>
      </AsideLeft>
    );

    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
  });
});

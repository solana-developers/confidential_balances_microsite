import { render, screen } from "@testing-library/react";
import AsideRight from "./AsideRight";

describe("AsideRight", () => {
  it("should render children correctly", () => {
    const testContent = "Test Content";
    render(<AsideRight>{testContent}</AsideRight>);

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it("should have correct CSS class", () => {
    const { container } = render(<AsideRight>Content</AsideRight>);

    const asideElement = container.firstChild as HTMLElement;
    expect(asideElement).toHaveClass("holy-grail--aside");
  });

  it("should render as aside HTML element", () => {
    const { container } = render(<AsideRight>Content</AsideRight>);

    const asideElement = container.firstChild as HTMLElement;
    expect(asideElement.tagName.toLowerCase()).toBe("aside");
  });

  it("should render multiple children correctly", () => {
    render(
      <AsideRight>
        <div>Child 1</div>
        <div>Child 2</div>
      </AsideRight>
    );

    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
  });
});

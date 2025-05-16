import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

describe("Footer", () => {
  it("should render children correctly", () => {
    const testContent = "Footer Content";
    render(<Footer>{testContent}</Footer>);

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it("should have correct CSS classes", () => {
    const { container } = render(<Footer>Content</Footer>);

    const footerElement = container.firstChild as HTMLElement;
    expect(footerElement).toHaveClass("holy-grail--footer");
    expect(footerElement.firstChild).toHaveClass("holy-grail--container");
  });

  it("should render as footer HTML element", () => {
    const { container } = render(<Footer>Content</Footer>);

    const footerElement = container.firstChild as HTMLElement;
    expect(footerElement.tagName.toLowerCase()).toBe("footer");
  });

  it("should render nested container div", () => {
    const { container } = render(<Footer>Content</Footer>);

    const containerDiv = container.querySelector(".holy-grail--container");
    expect(containerDiv).toBeInTheDocument();
  });
});

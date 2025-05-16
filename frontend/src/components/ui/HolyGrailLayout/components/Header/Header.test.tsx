import { render, screen } from "@testing-library/react";
import Header from "./Header";

describe("Header", () => {
  it("should render children correctly", () => {
    const testContent = "Header Content";
    render(<Header>{testContent}</Header>);

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it("should have correct CSS classes", () => {
    const { container } = render(<Header>Content</Header>);

    const headerElement = container.firstChild as HTMLElement;
    expect(headerElement).toHaveClass("holy-grail--header");
    expect(headerElement.firstChild).toHaveClass("holy-grail--container");
  });

  it("should render as header HTML element", () => {
    const { container } = render(<Header>Content</Header>);

    const headerElement = container.firstChild as HTMLElement;
    expect(headerElement.tagName.toLowerCase()).toBe("header");
  });

  it("should render nested container div", () => {
    const { container } = render(<Header>Content</Header>);

    const containerDiv = container.querySelector(".holy-grail--container");
    expect(containerDiv).toBeInTheDocument();
  });
});

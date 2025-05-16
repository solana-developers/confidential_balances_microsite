import { render, screen } from "@testing-library/react";
import MainColumns from "./MainColumns";

describe("MainColumns", () => {
  it("should render children correctly", () => {
    const testContent = "Main Columns Content";
    render(<MainColumns>{testContent}</MainColumns>);

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it("should have correct CSS classes", () => {
    const { container } = render(<MainColumns>Content</MainColumns>);

    const mainElement = container.firstChild as HTMLElement;
    expect(mainElement).toHaveClass("holy-grail--main");
    expect(mainElement.firstChild).toHaveClass(
      "holy-grail--container",
      "holy-grail--main-columns"
    );
  });

  it("should render nested container div with correct classes", () => {
    const { container } = render(<MainColumns>Content</MainColumns>);

    const containerDiv = container.querySelector(".holy-grail--container");
    expect(containerDiv).toHaveClass("holy-grail--main-columns");
  });

  it("should render multiple children correctly", () => {
    render(
      <MainColumns>
        <div>Column 1</div>
        <div>Column 2</div>
      </MainColumns>
    );

    expect(screen.getByText("Column 1")).toBeInTheDocument();
    expect(screen.getByText("Column 2")).toBeInTheDocument();
  });
});

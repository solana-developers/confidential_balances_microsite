import { render, screen } from "@testing-library/react";
import HolyGrailLayoutWithParams from "../HolyGrailLayout/HolyGrailLayoutWithParams";

describe("HolyGrailLayoutWithParams", () => {
  it("should render only required content when optional props are not provided", () => {
    const content = "Main Content";
    render(<HolyGrailLayoutWithParams content={content} />);

    expect(screen.getByText(content)).toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument(); // header
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument(); // asides
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument(); // footer
  });

  it("should render all sections when all props are provided", () => {
    const props = {
      header: "Header Content",
      leftSidebar: "Left Sidebar",
      content: "Main Content",
      rightSidebar: "Right Sidebar",
      footer: "Footer Content",
    };

    render(<HolyGrailLayoutWithParams {...props} />);

    expect(screen.getByText(props.header)).toBeInTheDocument();
    expect(screen.getByText(props.leftSidebar)).toBeInTheDocument();
    expect(screen.getByText(props.content)).toBeInTheDocument();
    expect(screen.getByText(props.rightSidebar)).toBeInTheDocument();
    expect(screen.getByText(props.footer)).toBeInTheDocument();
  });

  it("should add holy-grail class to layoutRoot element", () => {
    // Create a div to serve as layoutRoot
    const layoutRoot = document.createElement("div");
    layoutRoot.id = "test-root";
    document.body.appendChild(layoutRoot);

    render(
      <HolyGrailLayoutWithParams
        layoutRoot="#test-root"
        content="Test Content"
      />
    );

    expect(layoutRoot).toHaveClass("holy-grail");

    // Cleanup
    document.body.removeChild(layoutRoot);
  });

  it("should render complex content in each section", () => {
    const complexContent = {
      header: <div data-testid="complex-header">Complex Header</div>,
      leftSidebar: <div data-testid="complex-left">Complex Left</div>,
      content: <div data-testid="complex-main">Complex Main</div>,
      rightSidebar: <div data-testid="complex-right">Complex Right</div>,
      footer: <div data-testid="complex-footer">Complex Footer</div>,
    };

    render(<HolyGrailLayoutWithParams {...complexContent} />);

    expect(screen.getByTestId("complex-header")).toBeInTheDocument();
    expect(screen.getByTestId("complex-left")).toBeInTheDocument();
    expect(screen.getByTestId("complex-main")).toBeInTheDocument();
    expect(screen.getByTestId("complex-right")).toBeInTheDocument();
    expect(screen.getByTestId("complex-footer")).toBeInTheDocument();
  });
});

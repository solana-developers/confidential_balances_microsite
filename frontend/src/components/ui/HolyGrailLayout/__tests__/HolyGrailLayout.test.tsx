import { render, screen } from "@testing-library/react";
import HolyGrailLayout from "../HolyGrailLayout";

describe("HolyGrailLayout", () => {
  const mockConsoleWarn = jest.spyOn(console, "warn").mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render children correctly", () => {
    const testContent = "Test Content";
    render(<HolyGrailLayout>{testContent}</HolyGrailLayout>);

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it("should render multiple children correctly", () => {
    render(
      <HolyGrailLayout>
        <div>Child 1</div>
        <div>Child 2</div>
      </HolyGrailLayout>
    );

    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
  });

  it("should add holy-grail class to layoutRoot element", () => {
    // Create a div to serve as layoutRoot
    const layoutRoot = document.createElement("div");
    layoutRoot.id = "test-root";
    document.body.appendChild(layoutRoot);

    render(<HolyGrailLayout layoutRoot="#test-root">Content</HolyGrailLayout>);

    expect(layoutRoot).toHaveClass("holy-grail");

    // Cleanup
    document.body.removeChild(layoutRoot);
  });

  it("should warn when layoutRoot element is not found", () => {
    const nonExistentSelector = "#non-existent-element";
    render(
      <HolyGrailLayout layoutRoot={nonExistentSelector}>
        Content
      </HolyGrailLayout>
    );

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      `Element with selector "${nonExistentSelector}" not found`
    );
  });
});

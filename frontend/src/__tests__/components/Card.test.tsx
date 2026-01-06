import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "@/components/Card";

describe("Card", () => {
  it("renders children correctly", () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders with title", () => {
    render(<Card title="Card Title">Content</Card>);
    expect(screen.getByText("Card Title")).toBeInTheDocument();
  });

  it("renders with title and description", () => {
    render(
      <Card title="Card Title" description="Card description">
        Content
      </Card>
    );
    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card description")).toBeInTheDocument();
  });

  it("renders without header when no title provided", () => {
    render(<Card>Content only</Card>);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("has correct base styles", () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toHaveClass("bg-white", "rounded-xl", "shadow-card");
  });
});

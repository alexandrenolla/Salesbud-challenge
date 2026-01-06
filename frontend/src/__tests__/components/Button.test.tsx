import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/Button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders primary variant by default", () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("from-primary-500", "to-primary-600");
  });

  it("renders secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-white", "border-gray-300");
  });

  it("renders danger variant", () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("from-red-500", "to-red-600");
  });

  it("renders small size", () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-3", "py-1.5", "text-sm");
  });

  it("renders medium size by default", () => {
    render(<Button>Medium</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-4", "py-2");
  });

  it("renders large size", () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-6", "py-2.5", "text-base");
  });

  it("shows loading spinner when isLoading is true", () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    const spinner = button.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Click
      </Button>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("does not call onClick when loading", () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Click
      </Button>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });
});

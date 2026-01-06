import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default medium size", () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("w-8", "h-8");
  });

  it("renders small size", () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("w-4", "h-4");
  });

  it("renders large size", () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("w-12", "h-12");
  });

  it("has animation class", () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("animate-spin");
  });

  it("applies custom className to wrapper", () => {
    const { container } = render(<LoadingSpinner className="custom-spinner" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-spinner");
  });

  it("has primary color by default", () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("text-primary-600");
  });
});

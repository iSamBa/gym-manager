import { describe, it, expect, vi, beforeEach } from "vitest";
import { cn } from "../utils";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Mock the dependencies
vi.mock("clsx", () => ({
  clsx: vi.fn(),
}));

vi.mock("tailwind-merge", () => ({
  twMerge: vi.fn(),
}));

const mockClsx = vi.mocked(clsx);
const mockTwMerge = vi.mocked(twMerge);

describe("cn utility function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call clsx with provided inputs", () => {
    const inputs = ["class1", "class2", { active: true }];
    mockClsx.mockReturnValue("clsx-output");
    mockTwMerge.mockReturnValue("merged-output");

    cn(...inputs);

    expect(mockClsx).toHaveBeenCalledWith(inputs);
    expect(mockClsx).toHaveBeenCalledTimes(1);
  });

  it("should call twMerge with clsx output", () => {
    const clsxOutput = "clsx-result";
    mockClsx.mockReturnValue(clsxOutput);
    mockTwMerge.mockReturnValue("merged-output");

    cn("test-class");

    expect(mockTwMerge).toHaveBeenCalledWith(clsxOutput);
    expect(mockTwMerge).toHaveBeenCalledTimes(1);
  });

  it("should return twMerge output", () => {
    const expectedOutput = "final-merged-classes";
    mockClsx.mockReturnValue("clsx-output");
    mockTwMerge.mockReturnValue(expectedOutput);

    const result = cn("test-class");

    expect(result).toBe(expectedOutput);
  });

  it("should handle no arguments", () => {
    mockClsx.mockReturnValue("");
    mockTwMerge.mockReturnValue("");

    const result = cn();

    expect(mockClsx).toHaveBeenCalledWith([]);
    expect(result).toBe("");
  });

  it("should handle single string argument", () => {
    const className = "single-class";
    mockClsx.mockReturnValue(className);
    mockTwMerge.mockReturnValue(className);

    const result = cn(className);

    expect(mockClsx).toHaveBeenCalledWith([className]);
    expect(result).toBe(className);
  });

  it("should handle multiple string arguments", () => {
    const classes = ["class1", "class2", "class3"];
    mockClsx.mockReturnValue("combined-classes");
    mockTwMerge.mockReturnValue("merged-classes");

    const result = cn(...classes);

    expect(mockClsx).toHaveBeenCalledWith(classes);
    expect(result).toBe("merged-classes");
  });

  it("should handle conditional classes object", () => {
    const conditionalClasses = { active: true, disabled: false };
    mockClsx.mockReturnValue("active");
    mockTwMerge.mockReturnValue("active");

    const result = cn(conditionalClasses);

    expect(mockClsx).toHaveBeenCalledWith([conditionalClasses]);
    expect(result).toBe("active");
  });

  it("should handle mixed arguments", () => {
    const mixedInputs = [
      "base-class",
      { active: true, disabled: false },
      "additional-class",
    ];
    mockClsx.mockReturnValue("base-class active additional-class");
    mockTwMerge.mockReturnValue("base-class active additional-class");

    const result = cn(...mixedInputs);

    expect(mockClsx).toHaveBeenCalledWith(mixedInputs);
    expect(result).toBe("base-class active additional-class");
  });

  it("should handle array of classes", () => {
    const arrayInput = [["class1", "class2"], "class3"];
    mockClsx.mockReturnValue("class1 class2 class3");
    mockTwMerge.mockReturnValue("class1 class2 class3");

    const result = cn(...arrayInput);

    expect(mockClsx).toHaveBeenCalledWith(arrayInput);
    expect(result).toBe("class1 class2 class3");
  });

  it("should handle undefined and null values", () => {
    const inputsWithNulls = ["class1", undefined, null, "class2"];
    mockClsx.mockReturnValue("class1 class2");
    mockTwMerge.mockReturnValue("class1 class2");

    const result = cn(...inputsWithNulls);

    expect(mockClsx).toHaveBeenCalledWith(inputsWithNulls);
    expect(result).toBe("class1 class2");
  });
});

// Integration test with mocked behavior simulation
describe("cn utility function - integration behavior", () => {
  beforeEach(() => {
    // Reset mocks and set up realistic behavior
    mockClsx.mockImplementation((...args) =>
      args
        .flat()
        .filter(Boolean)
        .map((arg) =>
          typeof arg === "string"
            ? arg
            : Object.entries(arg || {})
                .filter(([, value]) => value)
                .map(([key]) => key)
                .join(" ")
        )
        .join(" ")
    );
    mockTwMerge.mockImplementation((input) => input);
  });

  it("should demonstrate the expected workflow", () => {
    const result = cn(
      "px-4 py-2",
      { active: true, disabled: false },
      "bg-red-500"
    );

    // Verify the functions were called in the expected order
    expect(mockClsx).toHaveBeenCalledWith([
      "px-4 py-2",
      { active: true, disabled: false },
      "bg-red-500",
    ]);
    expect(mockTwMerge).toHaveBeenCalledWith("px-4 py-2 active bg-red-500");
    expect(result).toBe("px-4 py-2 active bg-red-500");
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import "@testing-library/jest-dom";

// Global test setup
import { beforeEach, afterEach, vi } from "vitest";
import {
  globalTestCleanup,
  cleanupDialogState,
  setupRadixUITestEnvironment,
} from "./src/test/mock-helpers";

// Configure test timeout to 1000ms for Radix UI components
vi.setConfig({ testTimeout: 1000 });

// Setup Radix UI testing environment globally
setupRadixUITestEnvironment();

// Mock ResizeObserver for components that use it
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock DOM methods that may not be available in jsdom
Object.defineProperty(Element.prototype, "scrollIntoView", {
  value: vi.fn(),
  writable: true,
});

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock PointerEvent for Radix UI components
global.PointerEvent = class PointerEvent extends Event {
  constructor(type: string, eventInitDict?: PointerEventInit) {
    super(type, eventInitDict);
    this.pointerId = eventInitDict?.pointerId ?? 0;
    this.pointerType = eventInitDict?.pointerType ?? "mouse";
  }
  pointerId: number;
  pointerType: string;
} as any;

// Mock DOMRect for getBoundingClientRect
global.DOMRect = class DOMRect {
  constructor(
    public x = 0,
    public y = 0,
    public width = 0,
    public height = 0
  ) {
    this.left = x;
    this.top = y;
    this.right = x + width;
    this.bottom = y + height;
  }
  left: number;
  top: number;
  right: number;
  bottom: number;

  static fromRect(other?: DOMRectInit): DOMRect {
    return new DOMRect(other?.x, other?.y, other?.width, other?.height);
  }
  toJSON() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      left: this.left,
      top: this.top,
      right: this.right,
      bottom: this.bottom,
    };
  }
};

// Mock getBoundingClientRect for all elements
Element.prototype.getBoundingClientRect = vi.fn(
  () => new DOMRect(0, 0, 100, 100)
);

// Mock getComputedStyle for CSS-in-JS libraries
window.getComputedStyle = vi.fn((_element) => {
  return {
    getPropertyValue: vi.fn(() => ""),
    display: "block",
    visibility: "visible",
    opacity: "1",
    transform: "none",
    transition: "none",
    animation: "none",
    position: "static",
    zIndex: "auto",
    top: "auto",
    left: "auto",
    right: "auto",
    bottom: "auto",
    width: "100px",
    height: "100px",
    margin: "0px",
    padding: "0px",
    border: "0px",
    fontSize: "16px",
    lineHeight: "normal",
    fontFamily: "Arial",
    color: "rgb(0, 0, 0)",
    backgroundColor: "rgba(0, 0, 0, 0)",
  } as unknown as CSSStyleDeclaration;
});

// Mock matchMedia for responsive design tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.requestAnimationFrame for animations
window.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16) as unknown as number;
});
window.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// Mock HTMLElement methods for Radix UI
HTMLElement.prototype.scrollIntoView = vi.fn();
HTMLElement.prototype.releasePointerCapture = vi.fn();
HTMLElement.prototype.setPointerCapture = vi.fn();
HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);

// Mock focus and blur for accessibility testing
HTMLElement.prototype.focus = vi.fn();
HTMLElement.prototype.blur = vi.fn();

// Mock Range and Selection APIs for text selection
global.Range = class Range {
  static readonly START_TO_START = 0;
  static readonly START_TO_END = 1;
  static readonly END_TO_END = 2;
  static readonly END_TO_START = 3;

  readonly START_TO_START = 0;
  readonly START_TO_END = 1;
  readonly END_TO_END = 2;
  readonly END_TO_START = 3;

  startContainer: Node = document.createElement("div");
  endContainer: Node = document.createElement("div");
  startOffset: number = 0;
  endOffset: number = 0;
  collapsed: boolean = true;
  commonAncestorContainer: Node = document.createElement("div");

  cloneContents(): DocumentFragment {
    return document.createDocumentFragment();
  }

  deleteContents(): void {}
  extractContents(): DocumentFragment {
    return document.createDocumentFragment();
  }

  insertNode(_node: Node): void {}
  selectNode(_node: Node): void {}
  selectNodeContents(_node: Node): void {}
  setEnd(_node: Node, _offset: number): void {}
  setEndAfter(_node: Node): void {}
  setEndBefore(_node: Node): void {}
  setStart(_node: Node, _offset: number): void {}
  setStartAfter(_node: Node): void {}
  setStartBefore(_node: Node): void {}
  surroundContents(_newParent: Node): void {}

  cloneRange(): Range {
    return new Range();
  }

  collapse(_toStart?: boolean): void {
    this.collapsed = true;
  }

  compareBoundaryPoints(_how: number, _sourceRange: Range): number {
    return 0;
  }

  comparePoint(_node: Node, _offset: number): number {
    return 0;
  }

  createContextualFragment(_fragment: string): DocumentFragment {
    return document.createDocumentFragment();
  }

  detach(): void {}

  getBoundingClientRect(): DOMRect {
    return new DOMRect();
  }

  getClientRects(): DOMRectList {
    return [] as any;
  }

  intersectsNode(_node: Node): boolean {
    return false;
  }

  isPointInRange(_node: Node, _offset: number): boolean {
    return false;
  }

  toString(): string {
    return "";
  }
};

document.createRange = () => new Range();

// Mock window.getSelection
window.getSelection = vi.fn(() => ({
  anchorNode: null,
  anchorOffset: 0,
  direction: "forward" as const,
  focusNode: null,
  focusOffset: 0,
  baseNode: null,
  baseOffset: 0,
  extentNode: null,
  extentOffset: 0,
  rangeCount: 0,
  isCollapsed: true,
  type: "None",
  addRange: vi.fn(),
  removeAllRanges: vi.fn(),
  removeRange: vi.fn(),
  getRangeAt: vi.fn(() => new Range()),
  collapse: vi.fn(),
  extend: vi.fn(),
  collapseToStart: vi.fn(),
  collapseToEnd: vi.fn(),
  selectAllChildren: vi.fn(),
  deleteFromDocument: vi.fn(),
  containsNode: vi.fn(() => false),
  empty: vi.fn(),
  getComposedRanges: vi.fn(() => []),
  modify: vi.fn(),
  setBaseAndExtent: vi.fn(),
  setPosition: vi.fn(),
  toString: vi.fn(() => ""),
}));

// Mock CSS support for CSS-in-JS libraries
if (typeof window !== "undefined") {
  (window as any).CSS = {
    supports: vi.fn(() => true),
    escape: vi.fn((value: string) => value),
  };

  // Mock viewport dimensions for responsive testing
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1024,
  });

  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: 768,
  });
}

// Mock environment variables for tests with default values
beforeEach(() => {
  // Reset environment variables before each test
  vi.unstubAllEnvs();

  // Set default environment variables for Supabase
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

  // Reset any modal/dialog state before each test
  cleanupDialogState();
});

afterEach(() => {
  // Clean up dialog state first
  cleanupDialogState();

  // Comprehensive cleanup after each test
  globalTestCleanup();
});

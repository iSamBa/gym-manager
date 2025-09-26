import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// Centralized mock management for consistent test setup

// Global mocks for Supabase - must be hoisted
const {
  mockChannel: globalMockChannel,
  mockSupabaseClient: globalMockSupabaseClient,
} = vi.hoisted(() => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockImplementation((callback) => {
      if (typeof callback === "function") {
        // Simulate successful subscription asynchronously
        setTimeout(() => callback("SUBSCRIBED"), 0);
      }
      return mockChannel;
    }),
    unsubscribe: vi.fn().mockReturnThis(),
    track: vi.fn(),
    untrack: vi.fn(),
    presenceState: vi.fn().mockReturnValue({}),
  };

  const mockSupabaseClient = {
    auth: {
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://example.com/test.jpg" },
        }),
      }),
    },
    // Add realtime/channel support
    channel: vi.fn().mockReturnValue(mockChannel),
  } as unknown as SupabaseClient & { channel: typeof mockChannel };

  return { mockChannel, mockSupabaseClient };
});

// Apply the global mock
vi.mock("@/lib/supabase", () => ({
  supabase: globalMockSupabaseClient,
}));

// Export global mocks for direct use in tests
export { globalMockSupabaseClient, globalMockChannel };

/**
 * Setup Supabase mocks to prevent multiple client instance warnings
 * and provide consistent mocking patterns across all tests
 */
export function setupSupabaseMocks() {
  // Return the globally hoisted mocks
  return {
    mockSupabaseClient: globalMockSupabaseClient,
    mockChannel: globalMockChannel,
  };
}

/**
 * Setup localStorage mocks with isolated storage per test
 */
export function setupLocalStorageMocks() {
  const localStorageData: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: vi
      .fn()
      .mockImplementation((key: string) => localStorageData[key] || null),
    setItem: vi.fn().mockImplementation((key: string, value: string) => {
      localStorageData[key] = value;
    }),
    removeItem: vi.fn().mockImplementation((key: string) => {
      delete localStorageData[key];
    }),
    clear: vi.fn().mockImplementation(() => {
      Object.keys(localStorageData).forEach(
        (key) => delete localStorageData[key]
      );
    }),
    key: vi.fn().mockImplementation((index: number) => {
      const keys = Object.keys(localStorageData);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(localStorageData).length;
    },
  };

  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    writable: true,
  });

  // Return cleanup function
  return () => {
    Object.keys(localStorageData).forEach(
      (key) => delete localStorageData[key]
    );
  };
}

/**
 * Setup timer mocks compatible with QueryClient
 */
export function setupTimerMocks() {
  // Mock setTimeout/setInterval to work with fake timers
  vi.useFakeTimers({
    shouldAdvanceTime: true,
    toFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "Date",
    ],
  });

  return () => {
    vi.useRealTimers();
  };
}

/**
 * Setup window and DOM mocks for components that need them
 */
export function setupDOMMocks() {
  // Mock window methods commonly used in components
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

  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })),
  });

  // Mock scrollTo
  window.scrollTo = vi.fn();

  // Mock focus
  Element.prototype.scrollIntoView = vi.fn();
}

/**
 * Setup Next.js router mocks
 */
export function setupNextRouterMocks() {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockBack = vi.fn();
  const mockReload = vi.fn();

  const mockRouter = {
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    reload: mockReload,
    pathname: "/",
    query: {},
    asPath: "/",
    basePath: "",
    isLocaleDomain: true,
    isPreview: false,
    isReady: true,
    route: "/",
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  };

  vi.mock("next/router", () => ({
    useRouter: () => mockRouter,
  }));

  return mockRouter;
}

/**
 * Create test data factories for common entities
 */
export const createTestData = {
  user: (overrides = {}) => ({
    id: "user-1",
    email: "test@example.com",
    role: "admin",
    first_name: "Test",
    last_name: "User",
    avatar_url: null,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  }),

  member: (overrides = {}) => ({
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    phone: "+1234567890",
    date_of_birth: "1990-01-01",
    status: "active" as const,
    membership_type: "monthly",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "+1234567891",
    medical_conditions: null,
    fitness_goals: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  }),

  memberFilters: (overrides = {}) => ({
    search: "",
    status: undefined,
    membershipType: undefined,
    ...overrides,
  }),
};

/**
 * Cleanup dialog and modal state for Radix UI components
 */
export function cleanupDialogState() {
  if (typeof document === "undefined") return;

  // Remove all Radix UI portals
  const portals = document.querySelectorAll("[data-radix-portal]");
  portals.forEach((portal) => portal.remove());

  // Remove any overlays that might be left behind
  const overlays = document.querySelectorAll("[data-radix-dialog-overlay]");
  overlays.forEach((overlay) => overlay.remove());

  // Remove any content containers
  const contents = document.querySelectorAll("[data-radix-dialog-content]");
  contents.forEach((content) => content.remove());

  // Reset body classes that dialogs might have added
  document.body.className = document.body.className
    .split(" ")
    .filter(
      (className) =>
        !className.includes("radix") && !className.includes("dialog")
    )
    .join(" ");

  // Reset body styles that might prevent scrolling
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.body.style.pointerEvents = "";

  // Remove any aria-hidden attributes
  document.body.removeAttribute("aria-hidden");

  // Reset any inert attributes
  document.body.removeAttribute("inert");

  // Clear any focus traps or focus management
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
}

/**
 * Setup Radix UI testing environment
 */
export function setupRadixUITestEnvironment() {
  // Mock Radix UI's focus management
  const originalFocus = HTMLElement.prototype.focus;
  const originalBlur = HTMLElement.prototype.blur;

  HTMLElement.prototype.focus = vi.fn(function (
    this: HTMLElement,
    options?: FocusOptions
  ) {
    // Call the original focus method if it exists
    if (originalFocus) {
      originalFocus.call(this, options);
    }
    // Simulate focus event
    this.dispatchEvent(new Event("focus", { bubbles: true }));
  });

  HTMLElement.prototype.blur = vi.fn(function (this: HTMLElement) {
    // Call the original blur method if it exists
    if (originalBlur) {
      originalBlur.call(this);
    }
    // Simulate blur event
    this.dispatchEvent(new Event("blur", { bubbles: true }));
  });

  // Mock document.activeElement management
  let mockActiveElement: Element | null = document.body;
  Object.defineProperty(document, "activeElement", {
    get: () => mockActiveElement,
    set: (element: Element | null) => {
      mockActiveElement = element;
    },
    configurable: true,
  });

  // Return cleanup function
  return () => {
    HTMLElement.prototype.focus = originalFocus;
    HTMLElement.prototype.blur = originalBlur;
    cleanupDialogState();
  };
}

/**
 * Wait for Radix UI animations and state changes to complete
 */
export async function waitForRadixUITransitions() {
  // Wait for any pending microtasks (React state updates)
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Wait for any CSS transitions/animations
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Wait for any additional async operations
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Global test cleanup function for comprehensive reset
 */
export function globalTestCleanup() {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset modules to clear any cached imports
  vi.resetModules();

  // Clear all timers
  vi.clearAllTimers();

  // Reset environment variables
  vi.unstubAllEnvs();

  // Clean up dialog state
  cleanupDialogState();

  // Clear any global variables that might have been set
  if (typeof window !== "undefined") {
    // Clear any test-specific window properties
    delete (window as unknown as { testData?: unknown }).testData;
  }
}

/**
 * Setup complete test environment with all necessary mocks
 */
export function setupTestEnvironment() {
  const { mockSupabaseClient, mockChannel } = setupSupabaseMocks();
  const localStorageCleanup = setupLocalStorageMocks();
  const timerCleanup = setupTimerMocks();
  const radixUICleanup = setupRadixUITestEnvironment();
  setupDOMMocks();
  setupNextRouterMocks();

  // Return cleanup function that cleans up everything
  return {
    cleanup: () => {
      localStorageCleanup();
      timerCleanup();
      radixUICleanup();
      globalTestCleanup();
    },
    mockSupabaseClient,
    mockChannel,
  };
}

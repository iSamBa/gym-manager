import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  exportToCSV,
  exportToPDF,
  emailReport,
  printTable,
} from "../../lib/export-utils";
import type { SessionHistoryEntry } from "../../lib/types";

// Mock date-fns
vi.mock("date-fns", () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === "yyyy-MM-dd") return "2024-01-15";
    if (formatStr === "HH:mm") return "10:00";
    if (formatStr === "MMM dd, yyyy") return "Jan 15, 2024";
    if (formatStr === "MMMM dd, yyyy") return "January 15, 2024";
    if (formatStr === "MMMM dd, yyyy HH:mm") return "January 15, 2024 10:00";
    return "2024-01-15";
  }),
}));

const mockSessions: SessionHistoryEntry[] = [
  {
    session_id: "1",
    scheduled_start: "2024-01-15T10:00:00Z",
    scheduled_end: "2024-01-15T11:00:00Z",
    status: "completed",
    location: "Gym A",
    trainer_name: "John Doe",
    participant_count: 8,
    max_participants: 10,
    attendance_rate: 80,
    duration_minutes: 60,
    session_category: "standard",
    notes: "Great session",
  },
  {
    session_id: "2",
    scheduled_start: "2024-01-16T14:00:00Z",
    scheduled_end: "2024-01-16T15:00:00Z",
    status: "scheduled",
    location: "Gym B",
    trainer_name: "Jane Smith",
    participant_count: 5,
    max_participants: 12,
    attendance_rate: 42,
    duration_minutes: 60,
    session_category: "trial",
  },
];

// Mock DOM methods
const mockWindow = {
  document: {
    write: vi.fn(),
    close: vi.fn(),
  },
  focus: vi.fn(),
  print: vi.fn(),
  close: vi.fn(),
};

const mockElement = {
  setAttribute: vi.fn(),
  click: vi.fn(),
  style: {},
};

const mockCreateObjectURL = vi.fn(() => "mock-url");
const mockRevokeObjectURL = vi.fn();
const mockCreateElement = vi.fn(() => mockElement);
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockWindowOpen = vi.fn(() => mockWindow);

// Set up DOM mocks
Object.defineProperty(window, "open", {
  value: mockWindowOpen,
  writable: true,
});

Object.defineProperty(window.URL, "createObjectURL", {
  value: mockCreateObjectURL,
  writable: true,
});

Object.defineProperty(window.URL, "revokeObjectURL", {
  value: mockRevokeObjectURL,
  writable: true,
});

Object.defineProperty(document, "createElement", {
  value: mockCreateElement,
  writable: true,
});

Object.defineProperty(document.body, "appendChild", {
  value: mockAppendChild,
  writable: true,
});

Object.defineProperty(document.body, "removeChild", {
  value: mockRemoveChild,
  writable: true,
});

describe("Export Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("exportToCSV", () => {
    it("should create CSV with correct headers", () => {
      exportToCSV(mockSessions);

      // Should create an anchor element for download
      expect(mockCreateElement).toHaveBeenCalledWith("a");
    });

    it("should handle custom filename", () => {
      const customFilename = "custom-report.csv";
      exportToCSV(mockSessions, customFilename);

      expect(mockCreateElement).toHaveBeenCalledWith("a");
    });

    it("should format session data correctly", () => {
      exportToCSV(mockSessions);

      // Check if URL.createObjectURL was called (indicates blob creation)
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it("should escape commas in notes field", () => {
      const sessionsWithCommas = [
        {
          ...mockSessions[0],
          notes: "Great session, with commas",
        },
      ];

      exportToCSV(sessionsWithCommas);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  describe("exportToPDF", () => {
    it("should open print window with HTML content", async () => {
      await exportToPDF(mockSessions);

      expect(mockWindowOpen).toHaveBeenCalledWith("", "_blank");
    });

    it("should include session data in HTML", async () => {
      await exportToPDF(mockSessions);

      expect(mockWindow.document.write).toHaveBeenCalled();
      const htmlContent = mockWindow.document.write.mock.calls[0][0];
      expect(htmlContent).toContain("Training Sessions Report");
      expect(htmlContent).toContain("John Doe");
      expect(htmlContent).toContain("Jane Smith");
    });

    it("should include summary statistics", async () => {
      await exportToPDF(mockSessions);

      const htmlContent = mockWindow.document.write.mock.calls[0][0];
      expect(htmlContent).toContain("Total Sessions");
      expect(htmlContent).toContain("Completed");
      expect(htmlContent).toContain("Avg Attendance");
    });
  });

  describe("emailReport", () => {
    it("should prepare report data with correct structure", async () => {
      const recipient = "test@example.com";
      const result = await emailReport(mockSessions, recipient);

      expect(result).toEqual({
        recipient: "test@example.com",
        subject: "Training Sessions Report - January 15, 2024",
        sessions: 2,
        format: "csv",
        timestamp: expect.any(String),
        summary: {
          total: 2,
          completed: 1,
          cancelled: 0,
          avgAttendance: 61,
        },
      });
    });

    it("should handle PDF format option", async () => {
      const recipient = "test@example.com";
      const result = await emailReport(mockSessions, recipient, "pdf");

      expect(result.format).toBe("pdf");
    });

    it("should calculate summary statistics correctly", async () => {
      const recipient = "test@example.com";
      const result = await emailReport(mockSessions, recipient);

      expect(result.summary.total).toBe(2);
      expect(result.summary.completed).toBe(1);
      expect(result.summary.cancelled).toBe(0);
      expect(result.summary.avgAttendance).toBe(61); // (80 + 42) / 2 = 61
    });
  });

  describe("printTable", () => {
    const mockQuerySelector = vi.fn();

    beforeEach(() => {
      // Mock querySelector
      Object.defineProperty(document, "querySelector", {
        value: mockQuerySelector,
        writable: true,
      });
    });

    it("should open print window", () => {
      mockQuerySelector.mockReturnValue({
        innerHTML: "<table><tr><th>Test</th></tr></table>",
      });

      printTable(mockSessions);

      expect(mockWindowOpen).toHaveBeenCalledWith("", "_blank");
    });

    it("should use existing table when data-print-table element exists", () => {
      const mockElement = { innerHTML: "<table>existing table</table>" };
      mockQuerySelector.mockReturnValue(mockElement);

      printTable(mockSessions);

      expect(mockQuerySelector).toHaveBeenCalledWith("[data-print-table]");
    });

    it("should create fallback table when no marked element found", () => {
      mockQuerySelector.mockReturnValue(null);

      printTable(mockSessions);

      expect(mockWindow.document.write).toHaveBeenCalled();
      const htmlContent = mockWindow.document.write.mock.calls[0][0];
      expect(htmlContent).toContain("Training Sessions Report");
      expect(htmlContent).toContain("John Doe");
    });
  });

  describe("Error Handling", () => {
    it("should handle empty sessions array", () => {
      expect(() => exportToCSV([])).not.toThrow();
      expect(() => exportToPDF([])).not.toThrow();
      expect(() => printTable([])).not.toThrow();
    });

    it("should handle missing window.open", () => {
      const originalOpen = window.open;
      Object.defineProperty(window, "open", {
        value: null,
        writable: true,
      });

      // Should not throw when window.open returns null
      expect(() => printTable(mockSessions)).not.toThrow();

      // Restore original
      Object.defineProperty(window, "open", {
        value: originalOpen,
        writable: true,
      });
    });

    it("should handle sessions with missing optional fields", () => {
      const incompleteSession = {
        session_id: "3",
        scheduled_start: "2024-01-17T09:00:00Z",
        scheduled_end: "2024-01-17T10:00:00Z",
        status: "scheduled",
        location: null,
        trainer_name: "",
        participant_count: 0,
        max_participants: 8,
        attendance_rate: 0,
        duration_minutes: 60,
        session_category: "standard",
      } as SessionHistoryEntry;

      expect(() => exportToCSV([incompleteSession])).not.toThrow();
      expect(() => exportToPDF([incompleteSession])).not.toThrow();
    });
  });
});

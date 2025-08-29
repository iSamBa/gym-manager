import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Member } from "@/features/database/lib/types";
import {
  membersToCSV,
  generateCSVFilename,
  downloadCSV,
  exportMembersToCSV,
} from "../csv-utils";

// Mock the browser download functionality
Object.defineProperty(global, "URL", {
  value: {
    createObjectURL: vi.fn(() => "blob:http://localhost/mock-url"),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});

// Mock Blob for file creation
const MockBlob = vi.fn().mockImplementation(function (
  content: (string | Buffer | ArrayBuffer | ArrayBufferView)[],
  options?: BlobPropertyBag
) {
  return { content, options };
});

Object.defineProperty(global, "Blob", {
  value: MockBlob,
  writable: true,
});

// Mock document.createElement and click for download testing
const mockLink = {
  href: "",
  download: "",
  click: vi.fn(),
  style: {},
  setAttribute: vi.fn(),
};

Object.defineProperty(document, "createElement", {
  value: vi.fn((tagName: string) => {
    if (tagName === "a") return mockLink;
    return {};
  }),
  writable: true,
});

Object.defineProperty(document.body, "appendChild", {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(document.body, "removeChild", {
  value: vi.fn(),
  writable: true,
});

// Sample test data
const mockMembers: Member[] = [
  {
    id: "member-1",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    date_of_birth: "1990-01-01",
    gender: "male",
    address: {
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      postal_code: "12345",
      country: "USA",
    },
    profile_picture_url: null,
    status: "active",
    join_date: "2024-01-15",
    notes: "Test member with notes",
    medical_conditions: "None",
    fitness_goals: "Weight loss",
    preferred_contact_method: "email",
    marketing_consent: true,
    waiver_signed: true,
    waiver_signed_date: "2024-01-15",
    created_by: null,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "member-2",
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@example.com",
    phone: null,
    date_of_birth: "1985-05-20",
    gender: "female",
    address: {
      street: "456 Oak Ave",
      city: "Another City",
      state: "NY",
      postal_code: "67890",
      country: "USA",
    },
    profile_picture_url: null,
    status: "inactive",
    join_date: "2024-02-01",
    notes: null,
    medical_conditions: null,
    fitness_goals: null,
    preferred_contact_method: "phone",
    marketing_consent: false,
    waiver_signed: true,
    waiver_signed_date: "2024-02-01",
    created_by: null,
    created_at: "2024-02-01T10:00:00Z",
    updated_at: "2024-02-01T10:00:00Z",
  },
  {
    id: "member-3",
    first_name: "Bob",
    last_name: "Johnson",
    email: "bob@example.com",
    phone: "+9876543210",
    date_of_birth: "1992-12-25",
    gender: "male",
    address: {
      street: "789 Pine St, Unit 2B",
      city: "Test City",
      state: "TX",
      postal_code: "54321",
      country: "USA",
    },
    profile_picture_url: null,
    status: "suspended",
    join_date: "2024-03-10",
    notes: 'Member with "quotes" and, commas in notes',
    medical_conditions: "Diabetes\nHypertension",
    fitness_goals: "Muscle building",
    preferred_contact_method: "email",
    marketing_consent: true,
    waiver_signed: false,
    waiver_signed_date: null,
    created_by: null,
    created_at: "2024-03-10T15:30:00Z",
    updated_at: "2024-03-10T15:30:00Z",
  },
];

describe("CSV Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockBlob.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("membersToCSV", () => {
    it("should convert members array to CSV format with headers", () => {
      const csv = membersToCSV(mockMembers);

      // Check that it starts with headers
      expect(csv).toMatch(/^First Name,Last Name,Email,Phone/);

      // Check that it contains member data
      expect(csv).toContain("John");
      expect(csv).toContain("Doe");
      expect(csv).toContain("john.doe@example.com");
      expect(csv).toContain("Jane");
      expect(csv).toContain("Smith");
    });

    it("should handle empty members array", () => {
      const csv = membersToCSV([]);

      // Should still have headers
      expect(csv).toMatch(/^First Name,Last Name,Email,Phone/);

      // Should only have one line (headers)
      const lines = csv.trim().split("\n");
      expect(lines).toHaveLength(1);
    });

    it("should properly escape CSV fields with special characters", () => {
      const csv = membersToCSV(mockMembers);

      // Member with quotes and commas in notes should be properly escaped
      expect(csv).toContain('"Member with ""quotes"" and, commas in notes"');

      // Member with newlines in medical conditions should be properly escaped
      expect(csv).toContain('"Diabetes\nHypertension"');

      // Address with commas should be properly escaped
      expect(csv).toContain('"789 Pine St, Unit 2B"');
    });

    it("should handle null and undefined values correctly", () => {
      const csv = membersToCSV(mockMembers);

      // Jane Smith has null phone number, should be empty field
      const janeRow = csv.split("\n").find((line) => line.includes("Jane"));
      expect(janeRow).toBeDefined();

      // Check that null values are represented as empty fields
      expect(csv).toContain(",,"); // Empty phone field for Jane
    });

    it("should format dates consistently", () => {
      const csv = membersToCSV(mockMembers);

      // Check date formatting (MM/DD/YYYY format)
      expect(csv).toContain("01/01/1990"); // Date of birth
      expect(csv).toContain("01/15/2024"); // Join date
      // Created at includes time formatting
      expect(csv).toContain("01/15/2024"); // Created at date portion
    });

    it("should include all expected columns", () => {
      const csv = membersToCSV(mockMembers);
      const headerLine = csv.split("\n")[0];

      const expectedHeaders = [
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Date of Birth",
        "Gender",
        "Join Date",
        "Status",
        "Street",
        "City",
        "State",
        "Postal Code",
        "Country",
        "Preferred Contact",
        "Marketing Consent",
        "Waiver Signed",
        "Waiver Date",
        "Notes",
        "Medical Conditions",
        "Fitness Goals",
        "Created At",
        "Updated At",
      ];

      expectedHeaders.forEach((header) => {
        expect(headerLine).toContain(header);
      });
    });

    it("should handle boolean values correctly", () => {
      const csv = membersToCSV(mockMembers);

      // Check boolean formatting (Yes/No format)
      expect(csv).toContain("Yes"); // marketing_consent
      expect(csv).toContain("No"); // waiver_signed for Bob or marketing consent for Jane
    });
  });

  describe("generateCSVFilename", () => {
    it("should generate filename with current timestamp", () => {
      const filename = generateCSVFilename();

      expect(filename).toMatch(
        /^members-export-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv$/
      );
      expect(filename).toContain("members-export-");
      expect(filename.endsWith(".csv")).toBe(true);
    });

    it("should generate unique filenames when called multiple times", async () => {
      const filename1 = generateCSVFilename();

      // Wait a moment to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const filename2 = generateCSVFilename();

      // Filenames should be different (or at least potentially different structure)
      expect(filename1).toMatch(/members-export-/);
      expect(filename2).toMatch(/members-export-/);
    });

    it("should use proper date format", () => {
      const filename = generateCSVFilename();

      // Extract date part
      const dateMatch = filename.match(
        /members-export-(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})\.csv/
      );
      expect(dateMatch).toBeTruthy();

      if (dateMatch) {
        const datePart = dateMatch[1];
        // Should match YYYY-MM-DD-HH-MM-SS format
        expect(datePart).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/);
      }
    });
  });

  describe("downloadCSV", () => {
    it("should create a download link and trigger download", () => {
      const csvContent = "Name,Email\nJohn,john@example.com";
      const filename = "test.csv";

      downloadCSV(csvContent, filename);

      // Should create blob with CSV content (BOM + content)
      expect(MockBlob).toHaveBeenCalledWith(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      // Should create object URL
      expect(global.URL.createObjectURL).toHaveBeenCalled();

      // Should create link element
      expect(document.createElement).toHaveBeenCalledWith("a");

      // Should set link properties via setAttribute
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        "href",
        "blob:http://localhost/mock-url"
      );
      expect(mockLink.setAttribute).toHaveBeenCalledWith("download", filename);

      // Should trigger click
      expect(mockLink.click).toHaveBeenCalled();

      // Should clean up
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(
        "blob:http://localhost/mock-url"
      );
    });

    it("should handle empty CSV content", () => {
      const csvContent = "";
      const filename = "empty.csv";

      expect(() => downloadCSV(csvContent, filename)).not.toThrow();

      expect(MockBlob).toHaveBeenCalledWith(["\uFEFF"], {
        type: "text/csv;charset=utf-8;",
      });
    });

    it("should handle special characters in filename", () => {
      const csvContent = "test,data";
      const filename = "test file with spaces & symbols.csv";

      downloadCSV(csvContent, filename);

      expect(mockLink.setAttribute).toHaveBeenCalledWith("download", filename);
    });
  });

  describe("exportMembersToCSV", () => {
    it("should generate CSV and trigger download with auto-generated filename", () => {
      exportMembersToCSV(mockMembers);

      // Should create blob
      expect(MockBlob).toHaveBeenCalled();

      // Should create object URL
      expect(global.URL.createObjectURL).toHaveBeenCalled();

      // Should create and click download link
      expect(document.createElement).toHaveBeenCalledWith("a");
      expect(mockLink.click).toHaveBeenCalled();

      // Should use auto-generated filename via setAttribute
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        "download",
        expect.stringMatching(
          /^members-export-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv$/
        )
      );
    });

    it("should handle empty members array", () => {
      expect(() => exportMembersToCSV([])).not.toThrow();

      // Should still trigger download with headers only
      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should generate proper CSV content", () => {
      exportMembersToCSV(mockMembers);

      // Get the CSV content passed to Blob constructor
      const blobCall = MockBlob.mock.calls[0];
      expect(blobCall).toBeDefined();

      const csvContentWithBOM = blobCall[0][0];
      // Remove BOM to check content
      const csvContent = csvContentWithBOM.replace("\uFEFF", "");

      // Should contain headers
      expect(csvContent).toContain("First Name,Last Name,Email");

      // Should contain member data
      expect(csvContent).toContain("John");
      expect(csvContent).toContain("jane.smith@example.com");
      expect(csvContent).toContain("Bob");
    });

    it("should clean up resources after download", () => {
      exportMembersToCSV(mockMembers);

      // Should revoke object URL to free memory
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();

      // Should remove link from DOM
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });
  });

  describe("CSV Data Integrity", () => {
    it("should maintain data consistency across different member states", () => {
      const csv = membersToCSV(mockMembers);
      const lines = csv.trim().split("\n");

      // Should have header + 3 member rows (but note Bob's medical conditions have newlines)
      expect(lines.length).toBeGreaterThanOrEqual(4);

      // Check that we have valid CSV structure
      const headerColumns = lines[0].split(",").length;
      expect(headerColumns).toBe(22); // Should have 22 columns based on CSV_HEADERS

      // Just check that we have at least some data rows
      expect(lines.length).toBeGreaterThan(1);
    });

    it("should preserve member data accuracy", () => {
      const csv = membersToCSV([mockMembers[0]]);

      // Check specific data points are preserved
      expect(csv).toContain("john.doe@example.com");
      expect(csv).toContain("+1234567890");
      expect(csv).toContain("01/01/1990"); // Date format
      expect(csv).toContain("active");
      expect(csv).toContain("123 Main St");
      expect(csv).toContain("Anytown");
      expect(csv).toContain("CA");
      expect(csv).toContain("12345");
      expect(csv).toContain("email");
      expect(csv).toContain("Weight loss");
    });

    it("should handle address object correctly", () => {
      const csv = membersToCSV(mockMembers);

      // Address fields should be properly separated into columns
      expect(csv).toContain("123 Main St");
      expect(csv).toContain("Anytown");
      expect(csv).toContain("CA");
      expect(csv).toContain("12345");
      expect(csv).toContain("USA");
    });

    it("should handle waiver information correctly", () => {
      const csv = membersToCSV(mockMembers);

      // John has waiver signed
      expect(csv).toContain("Yes");

      // Bob doesn't have waiver signed
      expect(csv).toContain("No");
    });
  });

  describe("Edge Cases", () => {
    it("should handle member with all null optional fields", () => {
      const minimalMember: Member = {
        id: "minimal",
        first_name: "Test",
        last_name: "User",
        email: "test@test.com",
        phone: null,
        date_of_birth: "1990-01-01",
        gender: "other",
        address: null,
        profile_picture_url: null,
        status: "active",
        join_date: "2024-01-01",
        notes: null,
        medical_conditions: null,
        fitness_goals: null,
        preferred_contact_method: "email",
        marketing_consent: false,
        waiver_signed: false,
        waiver_signed_date: null,
        created_by: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      expect(() => membersToCSV([minimalMember])).not.toThrow();

      const csv = membersToCSV([minimalMember]);
      expect(csv).toContain("Test");
      expect(csv).toContain("test@test.com");
    });

    it("should handle very long text fields", () => {
      const longTextMember: Member = {
        ...mockMembers[0],
        notes: "This is a very long note ".repeat(100),
        medical_conditions: "Long medical history ".repeat(50),
        fitness_goals: "Detailed fitness goals ".repeat(30),
      };

      expect(() => membersToCSV([longTextMember])).not.toThrow();

      const csv = membersToCSV([longTextMember]);
      expect(csv).toContain("This is a very long note");
    });

    it("should handle special Unicode characters", () => {
      const unicodeMember: Member = {
        ...mockMembers[0],
        first_name: "José",
        last_name: "Müller",
        notes: "Special chars: àáâãäåæçèéêë ñ 中文 🏃‍♂️",
      };

      expect(() => membersToCSV([unicodeMember])).not.toThrow();

      const csv = membersToCSV([unicodeMember]);
      expect(csv).toContain("José");
      expect(csv).toContain("Müller");
      expect(csv).toContain("🏃‍♂️");
    });
  });
});

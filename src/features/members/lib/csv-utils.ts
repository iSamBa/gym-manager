import type { Member } from "@/features/database/lib/types";

// CSV column headers in the desired order
const CSV_HEADERS = [
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

/**
 * Escapes a CSV field value by wrapping in quotes if it contains special characters
 */
function escapeCSVField(value: string | undefined | null): string {
  if (!value) return "";

  const stringValue = String(value);

  // If the value contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (
    stringValue.includes('"') ||
    stringValue.includes(",") ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Formats a date string for CSV export
 */
function formatDateForCSV(dateString: string | undefined): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats a datetime string for CSV export
 */
function formatDateTimeForCSV(dateString: string | undefined): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateString;
  }
}

/**
 * Converts a member object to a CSV row array
 */
function memberToCSVRow(member: Member): string[] {
  return [
    member.first_name,
    member.last_name,
    member.email,
    member.phone || "",
    formatDateForCSV(member.date_of_birth),
    member.gender || "",
    formatDateForCSV(member.join_date),
    member.status,
    member.address?.street || "",
    member.address?.city || "",
    member.address?.state || "",
    member.address?.postal_code || "",
    member.address?.country || "",
    member.preferred_contact_method,
    member.marketing_consent ? "Yes" : "No",
    member.waiver_signed ? "Yes" : "No",
    formatDateForCSV(member.waiver_signed_date),
    member.notes || "",
    member.medical_conditions || "",
    member.fitness_goals || "",
    formatDateTimeForCSV(member.created_at),
    formatDateTimeForCSV(member.updated_at),
  ];
}

/**
 * Converts an array of members to CSV format
 */
export function membersToCSV(members: Member[]): string {
  // Start with headers
  const csvRows = [CSV_HEADERS.map(escapeCSVField).join(",")];

  // Add data rows
  members.forEach((member) => {
    const row = memberToCSVRow(member);
    csvRows.push(row.map(escapeCSVField).join(","));
  });

  return csvRows.join("\n");
}

/**
 * Generates a filename for the CSV export
 */
export function generateCSVFilename(): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "-")
    .substring(0, 19); // Remove milliseconds and timezone

  return `members-export-${timestamp}.csv`;
}

/**
 * Downloads a CSV string as a file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Create a Blob with UTF-8 BOM for proper Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Create download link and trigger download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the object URL
  URL.revokeObjectURL(url);
}

/**
 * Main export function that handles the complete CSV export process
 */
export function exportMembersToCSV(members: Member[]): void {
  try {
    const csvContent = membersToCSV(members);
    const filename = generateCSVFilename();
    downloadCSV(csvContent, filename);
  } catch (error) {
    console.error("Failed to export members to CSV:", error);
    throw new Error("Failed to generate CSV file");
  }
}

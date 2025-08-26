import type {
  Trainer,
  TrainerWithProfile,
} from "@/features/database/lib/types";

// CSV column headers in the desired order
const CSV_HEADERS = [
  "Trainer Code",
  "First Name",
  "Last Name",
  "Email",
  "Phone",
  "Date of Birth",
  "Hourly Rate",
  "Commission Rate",
  "Years Experience",
  "Max Clients Per Session",
  "Certifications",
  "Specializations",
  "Languages",
  "Accepting New Clients",
  "Emergency Contact Name",
  "Emergency Contact Relationship",
  "Emergency Contact Phone",
  "Insurance Policy Number",
  "Background Check Date",
  "CPR Certification Expires",
  "Notes",
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
 * Formats currency for CSV export
 */
function formatCurrencyForCSV(value: number | undefined): string {
  if (value === undefined || value === null) return "";
  return `$${value.toFixed(2)}`;
}

/**
 * Formats percentage for CSV export
 */
function formatPercentageForCSV(value: number | undefined): string {
  if (value === undefined || value === null) return "";
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Formats array fields for CSV export
 */
function formatArrayForCSV(array: string[] | undefined): string {
  if (!array || array.length === 0) return "";
  return array.join("; ");
}

/**
 * Converts a trainer object to a CSV row array
 */
function trainerToCSVRow(trainer: Trainer | TrainerWithProfile): string[] {
  // Handle user profile data if available (for TrainerWithProfile)
  const userProfile =
    "user_profile" in trainer ? trainer.user_profile : undefined;

  return [
    trainer.trainer_code,
    userProfile?.first_name || "",
    userProfile?.last_name || "",
    userProfile?.email || "",
    userProfile?.phone || "",
    formatDateForCSV(userProfile?.date_of_birth),
    formatCurrencyForCSV(trainer.hourly_rate),
    formatPercentageForCSV(trainer.commission_rate),
    trainer.years_experience?.toString() || "",
    trainer.max_clients_per_session?.toString() || "",
    formatArrayForCSV(trainer.certifications),
    formatArrayForCSV(trainer.specializations),
    formatArrayForCSV(trainer.languages),
    trainer.is_accepting_new_clients ? "Yes" : "No",
    trainer.emergency_contact?.name || "",
    trainer.emergency_contact?.relationship || "",
    trainer.emergency_contact?.phone || "",
    trainer.insurance_policy_number || "",
    formatDateForCSV(trainer.background_check_date),
    formatDateForCSV(trainer.cpr_certification_expires),
    trainer.notes || "",
    formatDateTimeForCSV(trainer.created_at),
    formatDateTimeForCSV(trainer.updated_at),
  ];
}

/**
 * Converts an array of trainers to CSV format
 */
export function trainersToCSV(
  trainers: (Trainer | TrainerWithProfile)[]
): string {
  // Start with headers
  const csvRows = [CSV_HEADERS.map(escapeCSVField).join(",")];

  // Add data rows
  trainers.forEach((trainer) => {
    const row = trainerToCSVRow(trainer);
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

  return `trainers-export-${timestamp}.csv`;
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
export function exportTrainersToCSV(
  trainers: (Trainer | TrainerWithProfile)[]
): void {
  try {
    const csvContent = trainersToCSV(trainers);
    const filename = generateCSVFilename();
    downloadCSV(csvContent, filename);
  } catch (error) {
    console.error("Failed to export trainers to CSV:", error);
    throw new Error("Failed to generate CSV file");
  }
}

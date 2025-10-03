/**
 * Centralized CSV utilities - replaces duplicate implementations
 * in features/members/lib/csv-utils.ts and features/trainers/lib/csv-utils.ts
 */

/**
 * Escapes a CSV field value by wrapping in quotes if it contains special characters
 */
export function escapeCSVField(value: string | undefined | null): string {
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
export function formatDateForCSV(dateString: string | undefined): string {
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
export function formatDateTimeForCSV(dateString: string | undefined): string {
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
export function formatCurrencyForCSV(value: number | undefined): string {
  if (value === undefined || value === null) return "";
  return `$${value.toFixed(2)}`;
}

/**
 * Formats percentage for CSV export
 */
export function formatPercentageForCSV(value: number | undefined): string {
  if (value === undefined || value === null) return "";
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Formats array fields for CSV export
 */
export function formatArrayForCSV(array: string[] | undefined): string {
  if (!array || array.length === 0) return "";
  return array.join("; ");
}

/**
 * Formats boolean values for CSV export
 */
export function formatBooleanForCSV(value: boolean | undefined): string {
  if (value === undefined) return "";
  return value ? "Yes" : "No";
}

/**
 * Generates a timestamped filename for CSV export
 */
export function generateCSVFilename(prefix: string): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "-")
    .substring(0, 19); // Remove milliseconds and timezone

  return `${prefix}-export-${timestamp}.csv`;
}

/**
 * Downloads a CSV string as a file with proper UTF-8 BOM for Excel compatibility
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
 * Generic function to convert data to CSV format
 */
export function arrayToCSV<T>(
  data: T[],
  headers: string[],
  rowMapper: (item: T) => string[]
): string {
  // Start with headers
  const csvRows = [headers.map(escapeCSVField).join(",")];

  // Add data rows
  data.forEach((item) => {
    const row = rowMapper(item);
    csvRows.push(row.map(escapeCSVField).join(","));
  });

  return csvRows.join("\n");
}

/**
 * Complete CSV export process with error handling
 */
export function exportToCSV<T>(
  data: T[],
  headers: string[],
  rowMapper: (item: T) => string[],
  filenamePrefix: string
): void {
  try {
    const csvContent = arrayToCSV(data, headers, rowMapper);
    const filename = generateCSVFilename(filenamePrefix);
    downloadCSV(csvContent, filename);
  } catch (error) {
    console.error(`Failed to export ${filenamePrefix} to CSV:`, error);
    throw new Error("Failed to generate CSV file");
  }
}

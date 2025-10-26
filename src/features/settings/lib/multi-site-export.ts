/**
 * Multi-Site Sessions Export Utilities
 * Functions for exporting multi-site session data to CSV and Excel formats
 */

import type { MultiSiteSession, MultiSiteSessionExportData } from "./types";

/**
 * Transform session data for export
 * @param sessions - Array of multi-site sessions
 * @returns Array of export data
 */
function prepareExportData(
  sessions: MultiSiteSession[]
): MultiSiteSessionExportData[] {
  return sessions.map((session) => {
    const fullName =
      `${session.guest_first_name || ""} ${session.guest_last_name || ""}`.trim();

    return {
      date: session.session_date,
      full_name: fullName || "N/A",
      origin_studio: session.guest_gym_name || "N/A",
    };
  });
}

/**
 * Convert data array to CSV string
 * @param data - Array of export data
 * @returns CSV string
 */
function arrayToCSV(data: MultiSiteSessionExportData[]): string {
  if (data.length === 0) {
    return "Date,Full Name,Origin Studio\n";
  }

  const headers = ["Date", "Full Name", "Origin Studio"];
  const rows = data.map((row) => {
    const values = [row.date, row.full_name, row.origin_studio];
    // Escape values that contain commas or quotes
    return values
      .map((value) => {
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Trigger download of a file
 * @param content - File content
 * @param filename - Name of file to download
 * @param mimeType - MIME type of file
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export multi-site sessions to CSV
 * @param sessions - Array of multi-site sessions
 * @param filename - Optional custom filename
 */
export function exportToCSV(
  sessions: MultiSiteSession[],
  filename?: string
): void {
  const exportData = prepareExportData(sessions);
  const csv = arrayToCSV(exportData);
  const date = new Date().toISOString().split("T")[0];
  const finalFilename = filename || `multi-site-sessions-${date}.csv`;

  downloadFile(csv, finalFilename, "text/csv;charset=utf-8;");
}

/**
 * Export multi-site sessions to Excel (using CSV format with .xlsx extension)
 * Note: For true Excel format, consider using a library like xlsx
 * @param sessions - Array of multi-site sessions
 * @param filename - Optional custom filename
 */
export function exportToExcel(
  sessions: MultiSiteSession[],
  filename?: string
): void {
  const exportData = prepareExportData(sessions);
  const csv = arrayToCSV(exportData);
  const date = new Date().toISOString().split("T")[0];
  const finalFilename = filename || `multi-site-sessions-${date}.xlsx`;

  // Note: This creates a CSV file with .xlsx extension
  // For better Excel compatibility, consider using the 'xlsx' library
  downloadFile(
    csv,
    finalFilename,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

import type { Member } from "@/features/database/lib/types";
import {
  formatDateForCSV,
  formatDateTimeForCSV,
  formatBooleanForCSV,
  arrayToCSV,
  exportToCSV,
} from "@/lib/csv-utils";

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
 * Converts a member object to a CSV row array
 */
function memberToCSVRow(member: Member): string[] {
  return [
    member.first_name,
    member.last_name,
    member.email || "",
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
    formatBooleanForCSV(member.marketing_consent),
    formatBooleanForCSV(member.waiver_signed),
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
  return arrayToCSV(members, CSV_HEADERS, memberToCSVRow);
}

/**
 * Main export function that handles the complete CSV export process
 */
export function exportMembersToCSV(members: Member[]): void {
  exportToCSV(members, CSV_HEADERS, memberToCSVRow, "members");
}

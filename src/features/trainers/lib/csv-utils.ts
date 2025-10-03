import type {
  Trainer,
  TrainerWithProfile,
} from "@/features/database/lib/types";
import {
  formatDateForCSV,
  formatDateTimeForCSV,
  formatCurrencyForCSV,
  formatPercentageForCSV,
  formatArrayForCSV,
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
 * Converts a trainer object to a CSV row array
 */
function trainerToCSVRow(trainer: Trainer | TrainerWithProfile): string[] {
  // Handle user profile data if available (for TrainerWithProfile)
  const userProfile =
    "user_profile" in trainer ? trainer.user_profile : undefined;

  return [
    userProfile?.first_name || "",
    userProfile?.last_name || "",
    userProfile?.email || "",
    userProfile?.phone || "",
    formatCurrencyForCSV(trainer.hourly_rate),
    formatPercentageForCSV(trainer.commission_rate),
    trainer.years_experience?.toString() || "",
    trainer.max_clients_per_session?.toString() || "",
    formatArrayForCSV(trainer.certifications),
    formatArrayForCSV(trainer.specializations),
    formatArrayForCSV(trainer.languages),
    formatBooleanForCSV(trainer.is_accepting_new_clients),
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
  return arrayToCSV(trainers, CSV_HEADERS, trainerToCSVRow);
}

/**
 * Main export function that handles the complete CSV export process
 */
export function exportTrainersToCSV(
  trainers: (Trainer | TrainerWithProfile)[]
): void {
  exportToCSV(trainers, CSV_HEADERS, trainerToCSVRow, "trainers");
}

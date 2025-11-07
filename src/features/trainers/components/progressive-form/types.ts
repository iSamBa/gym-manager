import { z } from "zod";
import type { UseFormReturn } from "react-hook-form";
import type { TrainerWithProfile } from "@/features/database/lib/types";

// Schema for each step
export const personalInfoSchema = z.object({
  first_name: z
    .string()
    .min(1, "Please enter your first name")
    .max(50, "First name must be 50 characters or less"),
  last_name: z
    .string()
    .min(1, "Please enter your last name")
    .max(50, "Last name must be 50 characters or less"),
  date_of_birth: z.string().min(1, "Please select your date of birth"),
  email: z
    .string()
    .email("Please enter a valid email address (e.g., john@example.com)"),
  phone: z.string().optional(),
});

export const professionalDetailsSchema = z.object({
  hourly_rate: z.number().min(0, "Hourly rate must be positive").optional(),
  commission_rate: z
    .union([
      z
        .number()
        .min(0, "Commission rate must be positive")
        .max(100, "Commission rate cannot exceed 100%"),
      z.string().length(0),
    ])
    .optional(),
  years_experience: z
    .number()
    .min(0, "Experience cannot be negative")
    .optional(),
});

export const specializationsSchema = z.object({
  certifications: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  languages: z.array(z.string()).min(1, "At least one language is required"),
});

export const capacitySchema = z.object({
  max_clients_per_session: z
    .union([
      z
        .number()
        .min(1, "Must allow at least 1 client")
        .max(50, "Maximum 50 clients per session"),
      z.string().length(0),
    ])
    .optional(),
  is_accepting_new_clients: z.boolean(),
});

export const complianceSchema = z.object({
  insurance_policy_number: z.string().optional(),
  background_check_date: z.string().optional(),
  cpr_certification_expires: z.string().optional(),
  notes: z.string().optional(),
});

// Complete form schema
export const trainerFormSchema = personalInfoSchema
  .merge(professionalDetailsSchema)
  .merge(specializationsSchema)
  .merge(capacitySchema)
  .merge(complianceSchema);

export type TrainerFormData = z.infer<typeof trainerFormSchema>;

export interface FormStepProps {
  form: UseFormReturn<TrainerFormData>;
  trainer?: TrainerWithProfile | null;
}

export interface StepInfo {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  schema: z.ZodSchema;
  isOptional?: boolean;
}

// Common certifications options
export const certificationOptions = [
  "NASM-CPT",
  "ACE-CPT",
  "ACSM-CPT",
  "NSCA-CSCS",
  "ISSA-CPT",
  "NCCPT",
  "CPR/AED",
  "First Aid",
  "CES (Corrective Exercise Specialist)",
  "PES (Performance Enhancement Specialist)",
  "Youth Exercise Specialist",
  "Senior Fitness Specialist",
  "Nutrition Coach",
  "Yoga Teacher Training (RYT)",
  "Pilates Instructor",
];

// Common languages - restricted to required languages only
export const languageOptions = ["English", "French", "Arabic"];

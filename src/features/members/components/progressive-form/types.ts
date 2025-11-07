import { z } from "zod";
import type { UseFormReturn } from "react-hook-form";
import type { Member } from "@/features/database/lib/types";

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
  gender: z.enum(["male", "female"], { message: "Please select your gender" }),
});

export const contactInfoSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address (e.g., john@example.com)"),
  phone: z.string().optional(),
  preferred_contact_method: z.enum(["email", "phone", "sms"], {
    message: "Please select your preferred contact method",
  }),
});

export const addressSchema = z.object({
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }),
});

export const healthInfoSchema = z.object({
  fitness_goals: z.string().optional(),
  medical_conditions: z.string().optional(),
});

export const settingsSchema = z.object({
  status: z.enum(["active", "inactive", "suspended", "expired", "pending"], {
    message: "Please select a member status",
  }),
  notes: z.string().optional(),
  marketing_consent: z.boolean(),
  waiver_signed: z.boolean(),
});

export const equipmentSchema = z.object({
  uniform_size: z.enum(["XS", "S", "M", "L", "XL"]),
  uniform_received: z.boolean(),
  vest_size: z.enum([
    "V1",
    "V2",
    "V2_SMALL_EXT",
    "V2_LARGE_EXT",
    "V2_DOUBLE_EXT",
  ]),
  hip_belt_size: z.enum(["V1", "V2"]),
});

export const referralSchema = z.object({
  referral_source: z.enum([
    "instagram",
    "member_referral",
    "website_ib",
    "prospection",
    "studio",
    "phone",
    "chatbot",
  ]),
  referred_by_member_id: z.string().uuid().optional(),
});

export const trainingPreferenceSchema = z.object({
  training_preference: z.enum(["mixed", "women_only"]).optional(),
});

export const memberTypeSchema = z.object({
  member_type: z.enum(["trial", "full", "collaboration"], {
    message: "Please select a member type",
  }),
});

export const partnershipSchema = z.object({
  partnership_company: z.string().optional(),
  partnership_type: z
    .enum(["influencer", "corporate", "brand", "media", "other"])
    .optional(),
  partnership_contract_start: z.string().optional(),
  partnership_contract_end: z.string().optional(),
  partnership_notes: z.string().optional(),
});

// Complete form schema with validation
export const memberFormSchema = personalInfoSchema
  .merge(contactInfoSchema)
  .merge(addressSchema)
  .merge(memberTypeSchema)
  .merge(partnershipSchema)
  .merge(equipmentSchema)
  .merge(referralSchema)
  .merge(trainingPreferenceSchema)
  .merge(healthInfoSchema)
  .merge(settingsSchema)
  .refine(
    (data) => {
      // Conditional validation: referred_by required if member_referral
      if (
        data.referral_source === "member_referral" &&
        !data.referred_by_member_id
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Please select the referring member",
      path: ["referred_by_member_id"],
    }
  )
  .refine(
    (data) => {
      // Conditional validation: training_preference only for females
      if (data.training_preference && data.gender !== "female") {
        return false;
      }
      return true;
    },
    {
      message: "Training preference only applies to female members",
      path: ["training_preference"],
    }
  )
  .refine(
    (data) => {
      // Conditional validation: partnership_company required if collaboration
      if (data.member_type === "collaboration" && !data.partnership_company) {
        return false;
      }
      return true;
    },
    {
      message: "Company name is required for collaboration members",
      path: ["partnership_company"],
    }
  )
  .refine(
    (data) => {
      // Conditional validation: partnership_contract_end required if collaboration
      if (
        data.member_type === "collaboration" &&
        !data.partnership_contract_end
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Contract end date is required for collaboration members",
      path: ["partnership_contract_end"],
    }
  )
  .refine(
    (data) => {
      // Conditional validation: partnership_contract_end must be future date
      if (
        data.member_type === "collaboration" &&
        data.partnership_contract_end
      ) {
        // Import isFutureDate inline to avoid circular dependencies
        const date = new Date(data.partnership_contract_end);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date <= today) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Contract end date must be in the future",
      path: ["partnership_contract_end"],
    }
  );

export type MemberFormData = z.infer<typeof memberFormSchema>;

export interface FormStepProps {
  form: UseFormReturn<MemberFormData>;
  member?: Member | null;
}

export interface StepInfo {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  schema: z.ZodSchema;
  isOptional?: boolean;
}

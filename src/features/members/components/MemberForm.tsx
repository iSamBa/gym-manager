import React, { useCallback, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Member } from "@/features/database/lib/types";
import {
  PersonalInfoSection,
  ContactInfoSection,
  AddressSection,
  FitnessHealthSection,
  StatusSettingsSection,
  EquipmentSection,
  ReferralSection,
  TrainingPreferenceSection,
} from "./form-sections";

const memberFormSchema = z
  .object({
    first_name: z.string().min(1, "First name is required").max(50),
    last_name: z.string().min(1, "Last name is required").max(50),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    date_of_birth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["male", "female"]),
    address: z.object({
      street: z.string().min(1, "Street address is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      postal_code: z.string().min(1, "Postal code is required"),
      country: z.string().min(1, "Country is required"),
    }),
    status: z.enum(["active", "inactive", "suspended", "expired", "pending"]),
    fitness_goals: z.string().optional(),
    medical_conditions: z.string().optional(),
    notes: z.string().optional(),
    preferred_contact_method: z.enum(["email", "phone", "sms"]),
    marketing_consent: z.boolean(),
    waiver_signed: z.boolean(),

    // Equipment fields (US-001)
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

    // Referral fields (US-001)
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

    // Training preference field (US-001)
    training_preference: z.enum(["mixed", "women_only"]).optional(),
  })
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
  );

type MemberFormData = z.infer<typeof memberFormSchema>;

interface MemberFormProps {
  member?: Member | null;
  onSubmit: (data: MemberFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

const MemberForm = memo(function MemberForm({
  member,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: MemberFormProps) {
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: member
      ? {
          first_name: member.first_name,
          last_name: member.last_name,
          email: member.email,
          phone: member.phone || "",
          date_of_birth: member.date_of_birth,
          gender: member.gender,
          address: member.address || {
            street: "",
            city: "",
            state: "",
            postal_code: "",
            country: "USA",
          },
          status: member.status,
          fitness_goals: member.fitness_goals || "",
          medical_conditions: member.medical_conditions || "",
          notes: member.notes || "",
          preferred_contact_method: member.preferred_contact_method as
            | "email"
            | "phone"
            | "sms",
          marketing_consent: member.marketing_consent,
          waiver_signed: member.waiver_signed,
          // Equipment fields (US-001)
          uniform_size: member.uniform_size,
          uniform_received: member.uniform_received,
          vest_size: member.vest_size,
          hip_belt_size: member.hip_belt_size,
          // Referral fields (US-001)
          referral_source: member.referral_source,
          referred_by_member_id: member.referred_by_member_id || undefined,
          // Training preference (US-001)
          training_preference: member.training_preference || undefined,
        }
      : {
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          date_of_birth: "",
          gender: "male",
          address: {
            street: "",
            city: "",
            state: "",
            postal_code: "",
            country: "USA",
          },
          status: "active",
          fitness_goals: "",
          medical_conditions: "",
          notes: "",
          preferred_contact_method: "email",
          marketing_consent: false,
          waiver_signed: false,
          // Equipment fields (US-001)
          uniform_size: "M",
          uniform_received: false,
          vest_size: "V1",
          hip_belt_size: "V1",
          // Referral fields (US-001)
          referral_source: "studio",
          referred_by_member_id: undefined,
          // Training preference (US-001)
          training_preference: undefined,
        },
  });

  const handleSubmit = useCallback(
    async (data: MemberFormData) => {
      await onSubmit(data);
    },
    [onSubmit]
  );

  return (
    <div className={cn("space-y-6", className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <PersonalInfoSection control={form.control} />
          <ContactInfoSection control={form.control} />
          <AddressSection control={form.control} />
          <EquipmentSection control={form.control} />
          <ReferralSection control={form.control} />
          <TrainingPreferenceSection
            control={form.control}
            setValue={form.setValue}
          />
          <FitnessHealthSection control={form.control} />
          <StatusSettingsSection control={form.control} />

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {member ? "Update Member" : "Create Member"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});

export { MemberForm };

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Save,
  X,
  User,
  DollarSign,
  GraduationCap,
  Award,
  Users,
  Languages,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainerWithProfile } from "@/features/database/lib/types";
import type { CreateTrainerData } from "@/features/database/lib/utils";

const trainerFormSchema = z.object({
  // User Profile fields
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),

  // Trainer-specific fields
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
  max_clients_per_session: z
    .union([
      z
        .number()
        .min(1, "Must allow at least 1 client")
        .max(50, "Maximum 50 clients per session"),
      z.string().length(0),
    ])
    .optional(),
  years_experience: z
    .number()
    .min(0, "Experience cannot be negative")
    .optional(),

  // Professional details
  certifications: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),

  // Capacity and availability
  is_accepting_new_clients: z.boolean(),

  // Compliance and safety
  insurance_policy_number: z.string().optional(),
  background_check_date: z.string().optional(),
  cpr_certification_expires: z.string().optional(),

  // Additional info
  notes: z.string().optional(),
});

type TrainerFormData = z.infer<typeof trainerFormSchema>;

interface TrainerFormProps {
  trainer?: TrainerWithProfile | null;
  onSubmit: (data: CreateTrainerData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

// Note: Specializations are now fetched dynamically from the database

// Common certifications options
const certificationOptions = [
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
const languageOptions = ["English", "French", "Arabic"];

export function TrainerForm({
  trainer,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: TrainerFormProps) {
  const [availableSpecializations, setAvailableSpecializations] = useState<
    { id: string; name: string }[]
  >([]);

  // Fetch available specializations on component mount
  useEffect(() => {
    const fetchSpecializations = async () => {
      const { data, error } = await supabase
        .from("trainer_specializations")
        .select("id, name")
        .order("name");

      if (!error && data) {
        setAvailableSpecializations(data);
      }
    };

    fetchSpecializations();
  }, []);

  // Helper function to convert specialization names to UUIDs
  const convertNamesToUuids = (names: string[]): string[] => {
    return names.map((name) => {
      const spec = availableSpecializations.find((s) => s.name === name);
      return spec ? spec.id : name; // Fallback to name if not found
    });
  };

  const form = useForm<TrainerFormData>({
    resolver: zodResolver(trainerFormSchema),
    defaultValues: trainer
      ? {
          // User profile data
          first_name: trainer.user_profile?.first_name || "",
          last_name: trainer.user_profile?.last_name || "",
          email: trainer.user_profile?.email || "",
          phone: trainer.user_profile?.phone || "",

          // Trainer data
          hourly_rate: trainer.hourly_rate || undefined,
          commission_rate: trainer.commission_rate ?? "",
          max_clients_per_session: trainer.max_clients_per_session ?? "",
          years_experience: trainer.years_experience || undefined,

          certifications: trainer.certifications || [],
          specializations: trainer.specializations || [],
          languages: trainer.languages || ["English"],

          is_accepting_new_clients: trainer.is_accepting_new_clients,

          insurance_policy_number: trainer.insurance_policy_number || "",
          background_check_date: trainer.background_check_date || "",
          cpr_certification_expires: trainer.cpr_certification_expires || "",

          notes: trainer.notes || "",
        }
      : {
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          hourly_rate: undefined,
          commission_rate: "",
          max_clients_per_session: "",
          years_experience: undefined,
          certifications: [],
          specializations: [],
          languages: ["English"],
          is_accepting_new_clients: true,
          insurance_policy_number: "",
          background_check_date: "",
          cpr_certification_expires: "",
          notes: "",
        },
  });

  const addSpecialization = (spec: string) => {
    const current = form.getValues("specializations") || [];
    if (!current.includes(spec)) {
      form.setValue("specializations", [...current, spec]);
    }
  };

  const removeSpecialization = (spec: string) => {
    const current = form.getValues("specializations") || [];
    form.setValue(
      "specializations",
      current.filter((s) => s !== spec)
    );
  };

  const addCertification = (cert: string) => {
    const current = form.getValues("certifications") || [];
    if (!current.includes(cert)) {
      form.setValue("certifications", [...current, cert]);
    }
  };

  const removeCertification = (cert: string) => {
    const current = form.getValues("certifications") || [];
    form.setValue(
      "certifications",
      current.filter((c) => c !== cert)
    );
  };

  const addLanguage = (lang: string) => {
    const current = form.getValues("languages") || [];
    if (!current.includes(lang)) {
      form.setValue("languages", [...current, lang]);
    }
  };

  const removeLanguage = (lang: string) => {
    const current = form.getValues("languages") || [];
    if (current.length > 1) {
      // Keep at least one language
      form.setValue(
        "languages",
        current.filter((l) => l !== lang)
      );
    }
  };

  const handleFormSubmit = (data: TrainerFormData) => {
    // Convert specialization names to UUIDs before submission
    // Handle empty string values for number fields
    const submissionData = {
      ...data,
      commission_rate:
        data.commission_rate === ""
          ? undefined
          : typeof data.commission_rate === "string"
            ? Number(data.commission_rate)
            : data.commission_rate,
      max_clients_per_session:
        data.max_clients_per_session === ""
          ? undefined
          : typeof data.max_clients_per_session === "string"
            ? Number(data.max_clients_per_session)
            : data.max_clients_per_session,
      specializations: data.specializations
        ? convertNamesToUuids(data.specializations)
        : [],
    } as const;

    return onSubmit(submissionData as CreateTrainerData);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-6"
        >
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="hourly_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commission_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                          value={
                            field.value === undefined || field.value === null
                              ? ""
                              : field.value
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="years_experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Capacity Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Capacity & Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="max_clients_per_session"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Clients per Session</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                          value={
                            field.value === undefined || field.value === null
                              ? ""
                              : field.value
                          }
                          min="1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_accepting_new_clients"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Accepting New Clients</FormLabel>
                        <FormDescription>
                          Allow this trainer to accept new client bookings
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Specializations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Specializations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="specializations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Specializations</FormLabel>
                    <Select value="" onValueChange={addSpecialization}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Add specialization..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableSpecializations
                          .filter(
                            (spec) => !(field.value || []).includes(spec.name)
                          )
                          .map((spec) => (
                            <SelectItem key={spec.id} value={spec.name}>
                              {spec.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(field.value || []).map((spec) => (
                        <Badge
                          key={spec}
                          variant="secondary"
                          className="hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                          onClick={() => removeSpecialization(spec)}
                        >
                          {spec} ×
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Certifications</FormLabel>
                    <Select value="" onValueChange={addCertification}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Add certification..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {certificationOptions
                          .filter((cert) => !(field.value || []).includes(cert))
                          .map((cert) => (
                            <SelectItem key={cert} value={cert}>
                              {cert}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(field.value || []).map((cert) => (
                        <Badge
                          key={cert}
                          variant="outline"
                          className="hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                          onClick={() => removeCertification(cert)}
                        >
                          {cert} ×
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Languages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="languages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Languages</FormLabel>
                    <Select value="" onValueChange={addLanguage}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Add language..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {languageOptions
                          .filter((lang) => !(field.value || []).includes(lang))
                          .map((lang) => (
                            <SelectItem key={lang} value={lang}>
                              {lang}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(field.value || []).map((lang) => (
                        <Badge
                          key={lang}
                          variant="default"
                          className={cn(
                            "cursor-pointer",
                            (field.value || []).length === 1
                              ? "cursor-not-allowed opacity-50"
                              : "hover:bg-destructive hover:text-destructive-foreground"
                          )}
                          onClick={() =>
                            (field.value || []).length > 1 &&
                            removeLanguage(lang)
                          }
                        >
                          {lang} {(field.value || []).length > 1 && "×"}
                        </Badge>
                      ))}
                    </div>
                    <FormDescription>
                      At least one language is required
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Compliance & Safety */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance & Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="insurance_policy_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Policy Number (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="background_check_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Background Check Date (Optional)</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date) =>
                            field.onChange(
                              date ? date.toISOString().split("T")[0] : ""
                            )
                          }
                          placeholder="Select date"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpr_certification_expires"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        CPR Certification Expires (Optional)
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date) =>
                            field.onChange(
                              date ? date.toISOString().split("T")[0] : ""
                            )
                          }
                          placeholder="Select expiry date"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Any additional notes about this trainer..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {trainer ? "Update Trainer" : "Create Trainer"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

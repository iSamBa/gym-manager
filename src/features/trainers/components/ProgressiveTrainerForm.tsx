"use client";

import React, { useState, useCallback, useRef, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Save,
  X,
  User,
  DollarSign,
  GraduationCap,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainerWithProfile } from "@/features/database/lib/types";
import type { CreateTrainerData } from "@/features/database/lib/utils";
import { toast } from "sonner";

// Schema for each step
const personalInfoSchema = z.object({
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

const professionalDetailsSchema = z.object({
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

const specializationsSchema = z.object({
  certifications: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  languages: z.array(z.string()).min(1, "At least one language is required"),
});

const capacitySchema = z.object({
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

const complianceSchema = z.object({
  insurance_policy_number: z.string().optional(),
  background_check_date: z.string().optional(),
  cpr_certification_expires: z.string().optional(),
  notes: z.string().optional(),
});

// Complete form schema
const trainerFormSchema = personalInfoSchema
  .merge(professionalDetailsSchema)
  .merge(specializationsSchema)
  .merge(capacitySchema)
  .merge(complianceSchema);

type TrainerFormData = z.infer<typeof trainerFormSchema>;

interface StepInfo {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  schema: z.ZodSchema;
  isOptional?: boolean;
}

const steps: StepInfo[] = [
  {
    id: 1,
    title: "Personal Information",
    description: "Basic trainer details",
    icon: User,
    schema: personalInfoSchema,
  },
  {
    id: 2,
    title: "Professional Details",
    description: "Rates and experience",
    icon: DollarSign,
    schema: professionalDetailsSchema,
    isOptional: true,
  },
  {
    id: 3,
    title: "Specializations & Certifications",
    description: "Skills and qualifications",
    icon: GraduationCap,
    schema: specializationsSchema,
  },
  {
    id: 4,
    title: "Capacity & Availability",
    description: "Client capacity settings",
    icon: Users,
    schema: capacitySchema,
    isOptional: true,
  },
  {
    id: 5,
    title: "Compliance & Settings",
    description: "Safety and compliance info",
    icon: Shield,
    schema: complianceSchema,
    isOptional: true,
  },
];

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

interface ProgressiveTrainerFormProps {
  trainer?: TrainerWithProfile | null;
  onSubmit: (data: CreateTrainerData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
  showHeader?: boolean;
}

export function ProgressiveTrainerForm({
  trainer,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
  showHeader = true,
}: ProgressiveTrainerFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isValidatingStep, setIsValidatingStep] = useState(false);
  const [availableSpecializations, setAvailableSpecializations] = useState<
    { id: string; name: string }[]
  >([]);
  const formRef = useRef<HTMLFormElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);
  const formId = useId();

  // Form state persistence key
  const formStorageKey = `progressive-trainer-form-${trainer?.id || "new"}`;

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
    mode: "onChange",
    defaultValues: trainer
      ? {
          // User profile data
          first_name: trainer.user_profile?.first_name || "",
          last_name: trainer.user_profile?.last_name || "",
          date_of_birth: trainer.date_of_birth || "",
          email: trainer.user_profile?.email || "",
          phone: trainer.user_profile?.phone || "",

          // Trainer data
          hourly_rate: trainer.hourly_rate || undefined,
          commission_rate: trainer.commission_rate ?? "",
          years_experience: trainer.years_experience || undefined,

          certifications: trainer.certifications || [],
          specializations: trainer.specializations || [],
          languages: trainer.languages || ["English"],

          max_clients_per_session: trainer.max_clients_per_session ?? "",
          is_accepting_new_clients: trainer.is_accepting_new_clients,

          insurance_policy_number: trainer.insurance_policy_number || "",
          background_check_date: trainer.background_check_date || "",
          cpr_certification_expires: trainer.cpr_certification_expires || "",
          notes: trainer.notes || "",
        }
      : {
          first_name: "",
          last_name: "",
          date_of_birth: "",
          email: "",
          phone: "",
          hourly_rate: undefined,
          commission_rate: "",
          years_experience: undefined,
          certifications: [],
          specializations: [],
          languages: ["English"],
          max_clients_per_session: "",
          is_accepting_new_clients: true,
          insurance_policy_number: "",
          background_check_date: "",
          cpr_certification_expires: "",
          notes: "",
        },
  });

  const progress = (currentStep / steps.length) * 100;
  const currentStepInfo = steps.find((step) => step.id === currentStep)!;

  // Form state persistence with localStorage
  useEffect(() => {
    if (!trainer) {
      // Only for new trainers, not editing existing ones
      try {
        const savedData = localStorage.getItem(formStorageKey);
        const savedStep = localStorage.getItem(`${formStorageKey}-step`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          // Restore form values
          Object.keys(parsedData).forEach((key) => {
            if (parsedData[key] !== undefined) {
              form.setValue(key as keyof TrainerFormData, parsedData[key], {
                shouldValidate: false,
              });
            }
          });
        }
        if (savedStep) {
          setCurrentStep(parseInt(savedStep, 10));
        }
      } catch (error) {
        console.warn("Failed to restore form state:", error);
      }
    }
  }, [trainer, form, formStorageKey]);

  // Save form state when values change
  useEffect(() => {
    if (!trainer) {
      // Only for new trainers
      const subscription = form.watch((values) => {
        try {
          localStorage.setItem(formStorageKey, JSON.stringify(values));
          localStorage.setItem(
            `${formStorageKey}-step`,
            currentStep.toString()
          );
        } catch (error) {
          console.warn("Failed to save form state:", error);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [form, trainer, formStorageKey, currentStep]);

  // Accessibility: Announce step changes to screen readers
  useEffect(() => {
    if (announceRef.current) {
      announceRef.current.textContent = `Step ${currentStep} of ${steps.length}: ${currentStepInfo.title}`;
    }
  }, [currentStep, currentStepInfo.title]);

  // Focus management: Focus first input when step changes (with form stability check)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formRef.current && !isValidatingStep) {
        const firstInput = formRef.current?.querySelector(
          "input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
        ) as HTMLElement;
        if (
          firstInput &&
          document.activeElement !== firstInput &&
          document.contains(firstInput)
        ) {
          firstInput.focus();
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [currentStep, isValidatingStep]);

  // Debug form values when they change (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const subscription = form.watch((values, { name, type }) => {
        if (type === "change" && name) {
          console.log("Field changed:", name, "New values:", values);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [form]);

  const validateCurrentStep = useCallback(async () => {
    setIsValidatingStep(true);
    const formData = form.getValues();

    try {
      await currentStepInfo.schema.parseAsync(formData);

      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }

      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
          const fieldName = err.path.join(".") as keyof TrainerFormData;
          form.setError(fieldName as keyof TrainerFormData, {
            message: err.message,
          });
        });

        toast.error("Please complete all required fields", {
          description: "Check the highlighted fields and try again.",
        });
      }
      return false;
    } finally {
      setIsValidatingStep(false);
    }
  }, [currentStep, currentStepInfo.schema, form, completedSteps]);

  const handleNextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = async (stepId: number) => {
    if (stepId < currentStep || completedSteps.includes(stepId)) {
      setCurrentStep(stepId);
    } else if (stepId === currentStep + 1) {
      await handleNextStep();
    }
  };

  const handleSubmit = async (data: TrainerFormData) => {
    // Validate all steps before final submission
    for (const step of steps) {
      try {
        await step.schema.parseAsync(data);
      } catch (error) {
        if (error instanceof z.ZodError && !step.isOptional) {
          toast.error(`Please complete step ${step.id}: ${step.title}`);
          setCurrentStep(step.id);
          return;
        }
      }
    }

    try {
      // Convert specialization names to UUIDs and handle empty string values for number fields
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

      await onSubmit(submissionData as CreateTrainerData);

      // Clear localStorage on successful submission
      if (!trainer) {
        try {
          localStorage.removeItem(formStorageKey);
          localStorage.removeItem(`${formStorageKey}-step`);
        } catch (error) {
          console.warn("Failed to clear form storage:", error);
        }
      }
    } catch (error) {
      console.error("Failed to submit form:", error);
      throw error; // Re-throw to let parent handle the error
    }
  };

  // Handle cancel with localStorage cleanup
  const handleCancel = useCallback(() => {
    if (!trainer) {
      try {
        localStorage.removeItem(formStorageKey);
        localStorage.removeItem(`${formStorageKey}-step`);
      } catch (error) {
        console.warn("Failed to clear form storage:", error);
      }
    }
    onCancel();
  }, [trainer, formStorageKey, onCancel]);

  // Helper functions for array field management
  const addSpecialization = (spec: string) => {
    const current = form.getValues("specializations");
    const currentArray = Array.isArray(current) ? current : [];
    if (!currentArray.includes(spec)) {
      form.setValue("specializations", [...currentArray, spec]);
    }
  };

  const removeSpecialization = (spec: string) => {
    const current = form.getValues("specializations");
    const currentArray = Array.isArray(current) ? current : [];
    form.setValue(
      "specializations",
      currentArray.filter((s) => s !== spec)
    );
  };

  const addCertification = (cert: string) => {
    const current = form.getValues("certifications");
    const currentArray = Array.isArray(current) ? current : [];
    if (!currentArray.includes(cert)) {
      form.setValue("certifications", [...currentArray, cert]);
    }
  };

  const removeCertification = (cert: string) => {
    const current = form.getValues("certifications");
    const currentArray = Array.isArray(current) ? current : [];
    form.setValue(
      "certifications",
      currentArray.filter((c) => c !== cert)
    );
  };

  const addLanguage = (lang: string) => {
    const current = form.getValues("languages");
    const currentArray = Array.isArray(current) ? current : [];
    if (!currentArray.includes(lang)) {
      form.setValue("languages", [...currentArray, lang]);
    }
  };

  const removeLanguage = (lang: string) => {
    const current = form.getValues("languages");
    const currentArray = Array.isArray(current) ? current : [];
    if (currentArray.length > 1) {
      // Keep at least one language
      form.setValue(
        "languages",
        currentArray.filter((l) => l !== lang)
      );
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                key="step1-first-name"
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="first_name"
                        placeholder="e.g., John"
                        className="h-12"
                        aria-describedby="first-name-error first-name-help"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormDescription id="first-name-help" className="text-xs">
                      Enter trainer&apos;s legal first name
                    </FormDescription>
                    <FormMessage id="first-name-error" />
                  </FormItem>
                )}
              />
              <FormField
                key="step1-last-name"
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="last_name"
                        placeholder="e.g., Smith"
                        className="h-12"
                        aria-describedby="last-name-error last-name-help"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormDescription id="last-name-help" className="text-xs">
                      Enter trainer&apos;s legal last name
                    </FormDescription>
                    <FormMessage id="last-name-error" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) => {
                          field.onChange(
                            date ? format(date, "yyyy-MM-dd") : ""
                          );
                        }}
                        placeholder="Select date of birth"
                        format="PPP"
                        className="h-12"
                        showYearMonthPickers={true}
                        yearRange={{
                          from: 1930,
                          to: new Date().getFullYear() - 18,
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Trainer must be at least 18 years old
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                key="step1-email"
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="john.trainer@example.com"
                        className="h-12"
                        aria-describedby="email-error email-help"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormDescription id="email-help" className="text-xs">
                      Professional email for client communications
                    </FormDescription>
                    <FormMessage id="email-error" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              key="step1-phone"
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      className="h-12"
                      aria-describedby="phone-error phone-help"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormDescription id="phone-help" className="text-xs">
                    Optional - for urgent communications and client contact
                  </FormDescription>
                  <FormMessage id="phone-error" />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Optional:</strong> Professional details help with
                scheduling and payment processing.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        placeholder="50"
                        className="h-12"
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Standard hourly rate for personal training sessions
                    </FormDescription>
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
                        placeholder="15"
                        className="h-12"
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        value={
                          field.value === undefined || field.value === null
                            ? ""
                            : field.value
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Percentage commission on class and session bookings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="years_experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of Experience</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      placeholder="5"
                      className="h-12 sm:max-w-xs"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Total years of fitness training experience
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Languages - Required */}
            <FormField
              control={form.control}
              name="languages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Languages *</FormLabel>
                  <Select value="" onValueChange={addLanguage}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Add language..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {languageOptions
                        .filter((lang) => {
                          const currentLangs = Array.isArray(field.value)
                            ? field.value
                            : [];
                          return !currentLangs.includes(lang);
                        })
                        .map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.isArray(field.value)
                      ? field.value.map((lang) => (
                          <Badge
                            key={lang}
                            variant="default"
                            className={cn(
                              "cursor-pointer",
                              field.value.length === 1
                                ? "cursor-not-allowed opacity-50"
                                : "hover:bg-destructive hover:text-destructive-foreground"
                            )}
                            onClick={() =>
                              field.value.length > 1 && removeLanguage(lang)
                            }
                          >
                            {lang} {field.value.length > 1 && "×"}
                          </Badge>
                        ))
                      : null}
                  </div>
                  <FormDescription>
                    At least one language is required for client communication
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Specializations - Optional */}
            <FormField
              control={form.control}
              name="specializations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specializations</FormLabel>
                  <Select value="" onValueChange={addSpecialization}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Add specialization..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableSpecializations
                        .filter((spec) => {
                          const currentSpecs = Array.isArray(field.value)
                            ? field.value
                            : [];
                          return !currentSpecs.includes(spec.name);
                        })
                        .map((spec) => (
                          <SelectItem key={spec.id} value={spec.name}>
                            {spec.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.isArray(field.value)
                      ? field.value.map((spec) => (
                          <Badge
                            key={spec}
                            variant="secondary"
                            className="hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                            onClick={() => removeSpecialization(spec)}
                          >
                            {spec} ×
                          </Badge>
                        ))
                      : null}
                  </div>
                  <FormDescription>
                    Optional - areas of fitness expertise and focus
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Certifications - Optional */}
            <FormField
              control={form.control}
              name="certifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certifications</FormLabel>
                  <Select value="" onValueChange={addCertification}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Add certification..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {certificationOptions
                        .filter((cert) => {
                          const currentCerts = Array.isArray(field.value)
                            ? field.value
                            : [];
                          return !currentCerts.includes(cert);
                        })
                        .map((cert) => (
                          <SelectItem key={cert} value={cert}>
                            {cert}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.isArray(field.value)
                      ? field.value.map((cert) => (
                          <Badge
                            key={cert}
                            variant="outline"
                            className="hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                            onClick={() => removeCertification(cert)}
                          >
                            {cert} ×
                          </Badge>
                        ))
                      : null}
                  </div>
                  <FormDescription>
                    Optional - professional certifications and qualifications
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Optional:</strong> Configure trainer capacity and
                availability settings.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                        placeholder="1"
                        className="h-12"
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        value={
                          field.value === undefined || field.value === null
                            ? ""
                            : field.value
                        }
                        min="1"
                        max="50"
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of clients in a single training session
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_accepting_new_clients"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-center rounded-lg border p-4">
                    <div className="flex items-center space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-describedby="accepting-clients-description"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-medium">
                          Accepting New Clients
                        </FormLabel>
                        <FormDescription id="accepting-clients-description">
                          Allow this trainer to accept new client bookings
                        </FormDescription>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Optional:</strong> Safety compliance and additional
                trainer information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="insurance_policy_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Policy Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="POL-123456789"
                        className="h-12"
                      />
                    </FormControl>
                    <FormDescription>
                      Professional liability insurance policy number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="background_check_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Background Check Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ? new Date(field.value) : new Date()}
                        onChange={(date) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                        placeholder="Select date (defaults to today)"
                        className="h-12 w-full"
                        showYearMonthPickers={true}
                        yearRange={{
                          from: 1990,
                          to: new Date().getFullYear(),
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Date when background check was completed (defaults to
                      today)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpr_certification_expires"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPR Certification Expires</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                        placeholder="Select expiry date"
                        className="h-12 w-full"
                      />
                    </FormControl>
                    <FormDescription>
                      CPR/First Aid certification expiration date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any internal staff notes about this trainer..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Notes visible only to staff members.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn("mx-auto max-w-2xl space-y-6", className)}
      role="region"
      aria-label="Trainer registration form"
    >
      {/* Screen reader announcements */}
      <div
        ref={announceRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      {/* Progress Header */}
      <div className="space-y-4">
        {showHeader && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1
              className="text-xl font-bold sm:text-2xl"
              id={`${formId}-title`}
            >
              {trainer ? "Edit Trainer" : "Add New Trainer"}
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              aria-label="Close form"
              className="min-h-[44px] min-w-[44px] touch-manipulation self-start sm:self-center"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress
            value={progress}
            className="h-3"
            aria-label={`Form progress: step ${currentStep} of ${steps.length}, ${Math.round(progress)}% complete`}
          />
        </div>

        {/* Step Navigation */}
        <nav aria-label="Form steps" className="w-full">
          <ol className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
            {steps.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = step.id === currentStep;
              const isAccessible = step.id <= currentStep || isCompleted;

              return (
                <li key={step.id} className="flex">
                  <Button
                    variant={
                      isCurrent
                        ? "default"
                        : isCompleted
                          ? "secondary"
                          : "ghost"
                    }
                    size="sm"
                    className={cn(
                      "h-auto min-h-[44px] flex-1 touch-manipulation flex-col gap-1 p-2 text-xs sm:flex-initial",
                      !isAccessible && "cursor-not-allowed opacity-50"
                    )}
                    onClick={() => isAccessible && handleStepClick(step.id)}
                    disabled={!isAccessible}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`Step ${step.id}: ${step.title}${step.isOptional ? " (optional)" : ""}${isCompleted ? ", completed" : ""}${isCurrent ? ", current step" : ""}`}
                  >
                    <div className="flex items-center gap-1">
                      {isCompleted ? (
                        <Check className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <step.icon className="h-3 w-3" aria-hidden="true" />
                      )}
                      <span className="hidden truncate sm:inline">
                        {step.title}
                      </span>
                      <span className="truncate sm:hidden">{step.id}</span>
                    </div>
                  </Button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
            id={`${formId}-step-title`}
          >
            <div className="flex items-center gap-2">
              <currentStepInfo.icon className="h-5 w-5" aria-hidden="true" />
              {currentStepInfo.title}
            </div>
            {currentStepInfo.isOptional && (
              <Badge variant="secondary" className="self-start sm:self-center">
                Optional
              </Badge>
            )}
          </CardTitle>
          <p
            className="text-muted-foreground text-sm"
            id={`${formId}-step-description`}
          >
            {currentStepInfo.description}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
              noValidate
              aria-labelledby={
                showHeader
                  ? `${formId}-title ${formId}-step-title`
                  : `${formId}-step-title`
              }
              aria-describedby={`${formId}-step-description`}
            >
              {renderStepContent()}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Navigation Footer */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreviousStep}
          disabled={currentStep === 1}
          className="flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 sm:w-auto"
          aria-label={
            currentStep === 1
              ? "Previous step (disabled - first step)"
              : `Go to previous step: ${steps[currentStep - 2]?.title}`
          }
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentStep < steps.length ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={isValidatingStep}
              className="flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 sm:ml-auto sm:w-auto"
              aria-label={`Continue to next step: ${steps[currentStep]?.title}`}
            >
              {isValidatingStep ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Validating...</span>
                  <span className="sr-only">
                    Please wait while we validate your information
                  </span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading}
              className="flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 sm:ml-auto sm:w-auto"
              onClick={() => form.handleSubmit(handleSubmit)()}
              aria-label={`${trainer ? "Update" : "Create"} trainer with provided information`}
            >
              {isLoading ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Saving...</span>
                  <span className="sr-only">
                    Please wait while we save the trainer information
                  </span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  <span>{trainer ? "Update Trainer" : "Create Trainer"}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

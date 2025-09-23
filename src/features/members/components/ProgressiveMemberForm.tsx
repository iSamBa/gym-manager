"use client";

import React, { useState, useCallback, useRef, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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
  Mail,
  MapPin,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Member } from "@/features/database/lib/types";
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
  gender: z.enum(["male", "female"], { message: "Please select your gender" }),
});

const contactInfoSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address (e.g., john@example.com)"),
  phone: z.string().optional(),
  preferred_contact_method: z.enum(["email", "phone", "sms"], {
    message: "Please select your preferred contact method",
  }),
});

const addressSchema = z.object({
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }),
});

const healthInfoSchema = z.object({
  fitness_goals: z.string().optional(),
  medical_conditions: z.string().optional(),
});

const settingsSchema = z.object({
  status: z.enum(["active", "inactive", "suspended", "expired", "pending"], {
    message: "Please select a member status",
  }),
  notes: z.string().optional(),
  marketing_consent: z.boolean(),
  waiver_signed: z.boolean(),
});

// Complete form schema
const memberFormSchema = personalInfoSchema
  .merge(contactInfoSchema)
  .merge(addressSchema)
  .merge(healthInfoSchema)
  .merge(settingsSchema);

type MemberFormData = z.infer<typeof memberFormSchema>;

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
    description: "Basic member details",
    icon: User,
    schema: personalInfoSchema,
  },
  {
    id: 2,
    title: "Contact Information",
    description: "Email, phone, and preferences",
    icon: Mail,
    schema: contactInfoSchema,
  },
  {
    id: 3,
    title: "Address",
    description: "Member's address",
    icon: MapPin,
    schema: addressSchema,
    isOptional: true,
  },
  {
    id: 4,
    title: "Health & Fitness",
    description: "Goals and medical info",
    icon: Target,
    schema: healthInfoSchema,
    isOptional: true,
  },
  {
    id: 5,
    title: "Settings",
    description: "Status and preferences",
    icon: Settings,
    schema: settingsSchema,
  },
];

interface ProgressiveMemberFormProps {
  member?: Member | null;
  onSubmit: (data: MemberFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
  showHeader?: boolean;
}

export function ProgressiveMemberForm({
  member,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
  showHeader = true,
}: ProgressiveMemberFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isValidatingStep, setIsValidatingStep] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);
  const formId = useId();

  // Form state persistence key
  const formStorageKey = `progressive-member-form-${member?.id || "new"}`;

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    mode: "onChange",
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
            postal_code: "",
            country: "Morocco",
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
            postal_code: "",
            country: "Morocco",
          },
          status: "active",
          fitness_goals: "",
          medical_conditions: "",
          notes: "",
          preferred_contact_method: "email",
          marketing_consent: false,
          waiver_signed: false,
        },
  });

  const progress = (currentStep / steps.length) * 100;
  const currentStepInfo = steps.find((step) => step.id === currentStep)!;

  // Form state persistence with localStorage
  useEffect(() => {
    if (!member) {
      // Only for new members, not editing existing ones
      try {
        const savedData = localStorage.getItem(formStorageKey);
        const savedStep = localStorage.getItem(`${formStorageKey}-step`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          // Restore form values
          Object.keys(parsedData).forEach((key) => {
            if (parsedData[key] !== undefined) {
              form.setValue(key as keyof MemberFormData, parsedData[key], {
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
  }, [member, form, formStorageKey]);

  // Save form state when values change
  useEffect(() => {
    if (!member) {
      // Only for new members
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
  }, [form, member, formStorageKey, currentStep]);

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
          const fieldName = err.path.join(".") as keyof MemberFormData;
          form.setError(fieldName as keyof MemberFormData, {
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

  const handleSubmit = async (data: MemberFormData) => {
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
      await onSubmit(data);

      // Clear localStorage on successful submission
      if (!member) {
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
    if (!member) {
      try {
        localStorage.removeItem(formStorageKey);
        localStorage.removeItem(`${formStorageKey}-step`);
      } catch (error) {
        console.warn("Failed to clear form storage:", error);
      }
    }
    onCancel();
  }, [member, formStorageKey, onCancel]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
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
                      Enter your legal first name
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
                      Enter your legal last name
                    </FormDescription>
                    <FormMessage id="last-name-error" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          to: new Date().getFullYear() - 13,
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
              <FormField
                key="step2-email"
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
                        placeholder="john.doe@example.com"
                        className="h-12"
                        aria-describedby="email-error email-help"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormDescription id="email-help" className="text-xs">
                      We&apos;ll use this to send important updates about your
                      membership
                    </FormDescription>
                    <FormMessage id="email-error" />
                  </FormItem>
                )}
              />
              <FormField
                key="step2-phone"
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
                      Optional - we&apos;ll use this for urgent communications
                      only
                    </FormDescription>
                    <FormMessage id="phone-error" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferred_contact_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Contact Method *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select contact method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">📧 Email</SelectItem>
                      <SelectItem value="phone">📞 Phone Call</SelectItem>
                      <SelectItem value="sms">💬 SMS/Text</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Rue Mohammed V"
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Casablanca"
                        {...field}
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="20000" {...field} className="h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Morocco" {...field} className="h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Optional:</strong> This information helps trainers
                provide better guidance.
              </p>
            </div>

            <FormField
              control={form.control}
              name="fitness_goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fitness Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe fitness goals (e.g., weight loss, muscle gain, endurance training)..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    What does the member want to achieve?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medical_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List any relevant medical conditions or injuries..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Information that trainers should be aware of for safety.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member Status *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                          Inactive
                        </div>
                      </SelectItem>
                      <SelectItem value="suspended">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                          Suspended
                        </div>
                      </SelectItem>
                      <SelectItem value="expired">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-500"></div>
                          Expired
                        </div>
                      </SelectItem>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          Pending
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any internal staff notes..."
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

            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium">Member Agreements</h4>

              <FormField
                control={form.control}
                name="waiver_signed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-describedby="waiver-description"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium">
                        Liability Waiver Signed *
                      </FormLabel>
                      <FormDescription id="waiver-description">
                        Member has signed the required liability waiver
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marketing_consent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-describedby="marketing-description"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium">
                        Marketing Communications
                      </FormLabel>
                      <FormDescription id="marketing-description">
                        Member consents to receive promotional emails and
                        updates
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn("mx-auto max-w-2xl space-y-4", className)}
      role="region"
      aria-label="Member registration form"
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
              {member ? "Edit Member" : "Add New Member"}
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
              className="space-y-4"
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
              aria-label={`${member ? "Update" : "Create"} member with provided information`}
            >
              {isLoading ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Saving...</span>
                  <span className="sr-only">
                    Please wait while we save the member information
                  </span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  <span>{member ? "Update Member" : "Create Member"}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

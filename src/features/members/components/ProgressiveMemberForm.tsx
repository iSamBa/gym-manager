"use client";

import React, { useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"]),
});

const contactInfoSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  preferred_contact_method: z.enum(["email", "phone", "sms"]),
});

const addressSchema = z.object({
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postal_code: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

const healthInfoSchema = z.object({
  fitness_goals: z.string().optional(),
  medical_conditions: z.string().optional(),
});

const settingsSchema = z.object({
  status: z.enum(["active", "inactive", "suspended", "expired", "pending"]),
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
}

export function ProgressiveMemberForm({
  member,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: ProgressiveMemberFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isValidatingStep, setIsValidatingStep] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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
        },
  });

  const progress = (currentStep / steps.length) * 100;
  const currentStepInfo = steps.find((step) => step.id === currentStep)!;

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
        (
          error as unknown as { errors: { path: string[]; message: string }[] }
        ).errors.forEach((err) => {
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
      // Focus on first input of next step
      setTimeout(() => {
        const firstInput = formRef.current?.querySelector(
          "input, select, textarea"
        ) as HTMLElement;
        firstInput?.focus();
      }, 100);
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

    await onSubmit(data);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter first name"
                        {...field}
                        className="h-12"
                        aria-describedby="first-name-error"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage id="first-name-error" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter last name"
                        {...field}
                        className="h-12"
                        aria-describedby="last-name-error"
                      />
                    </FormControl>
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
                            date ? date.toISOString().split("T")[0] : ""
                          );
                        }}
                        placeholder="Select date of birth"
                        format="PPP"
                        className="h-12"
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@email.com"
                        {...field}
                        className="h-12"
                        autoFocus
                        aria-describedby="email-error"
                      />
                    </FormControl>
                    <FormMessage id="email-error" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 (555) 123-4567"
                        {...field}
                        className="h-12"
                        aria-describedby="phone-error"
                      />
                    </FormControl>
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
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123 Main Street, Apt 4B"
                      {...field}
                      className="h-12"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="New York"
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
                name="address.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province *</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} className="h-12" />
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
                    <FormLabel>Postal Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} className="h-12" />
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
                  <FormLabel>Country *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="United States"
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
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
                      autoFocus
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
          <div className="space-y-6">
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
                      <SelectItem value="active">🟢 Active</SelectItem>
                      <SelectItem value="inactive">⚫ Inactive</SelectItem>
                      <SelectItem value="suspended">🟡 Suspended</SelectItem>
                      <SelectItem value="expired">🔴 Expired</SelectItem>
                      <SelectItem value="pending">🔵 Pending</SelectItem>
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
    <div className={cn("mx-auto max-w-2xl space-y-6", className)}>
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {member ? "Edit Member" : "Add New Member"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            aria-label="Close form"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Step Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            const isAccessible = step.id <= currentStep || isCompleted;

            return (
              <Button
                key={step.id}
                variant={
                  isCurrent ? "default" : isCompleted ? "secondary" : "ghost"
                }
                size="sm"
                className={cn(
                  "h-auto flex-col gap-1 p-2 text-xs",
                  !isAccessible && "cursor-not-allowed opacity-50"
                )}
                onClick={() => isAccessible && handleStepClick(step.id)}
                disabled={!isAccessible}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div className="flex items-center gap-1">
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <step.icon className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
                {step.isOptional && (
                  <Badge variant="outline" className="px-1 py-0 text-[10px]">
                    Optional
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentStepInfo.icon className="h-5 w-5" />
            {currentStepInfo.title}
            {currentStepInfo.isOptional && (
              <Badge variant="secondary" className="ml-2">
                Optional
              </Badge>
            )}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
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
            >
              {renderStepContent()}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreviousStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentStep < steps.length ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={isValidatingStep}
              className="flex items-center gap-2"
            >
              {isValidatingStep ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2"
              onClick={() => form.handleSubmit(handleSubmit)()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {member ? "Update Member" : "Create Member"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

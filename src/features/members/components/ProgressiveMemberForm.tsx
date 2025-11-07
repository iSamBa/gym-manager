"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useId,
  memo,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
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
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  UserCog,
  Handshake,
  Package,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Member } from "@/features/database/lib/types";
import { toast } from "sonner";
import { MemberHealthFitnessStep } from "./form-steps/MemberHealthFitnessStep";
import { MemberAddressStep } from "./form-steps/MemberAddressStep";
import {
  PersonalInfoStep,
  ContactInfoStep,
  MemberTypeStep,
  PartnershipDetailsStep,
  EquipmentStep,
  ReferralStep,
  TrainingPreferenceStep,
  SettingsStep,
  memberFormSchema,
  personalInfoSchema,
  contactInfoSchema,
  addressSchema,
  memberTypeSchema,
  partnershipSchema,
  equipmentSchema,
  referralSchema,
  trainingPreferenceSchema,
  healthInfoSchema,
  settingsSchema,
  type MemberFormData,
  type StepInfo,
} from "./progressive-form";

import { logger } from "@/lib/logger";

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
    title: "Member Type",
    description: "Membership classification",
    icon: UserCog,
    schema: memberTypeSchema,
  },
  {
    id: 5,
    title: "Partnership Details",
    description: "For collaboration members",
    icon: Handshake,
    schema: partnershipSchema,
    isOptional: true,
  },
  {
    id: 6,
    title: "Equipment",
    description: "Uniform and equipment sizing",
    icon: Package,
    schema: equipmentSchema,
  },
  {
    id: 7,
    title: "Referral",
    description: "How you heard about us",
    icon: UserPlus,
    schema: referralSchema,
  },
  {
    id: 8,
    title: "Training Preference",
    description: "Session preferences (optional)",
    icon: Users,
    schema: trainingPreferenceSchema,
    isOptional: true,
  },
  {
    id: 9,
    title: "Health & Fitness",
    description: "Goals and medical info",
    icon: Target,
    schema: healthInfoSchema,
    isOptional: true,
  },
  {
    id: 10,
    title: "Settings",
    description: "Status and preferences",
    icon: SettingsIcon,
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

export const ProgressiveMemberForm = memo(function ProgressiveMemberForm({
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
          // US-004: Equipment fields
          uniform_size: member.uniform_size,
          uniform_received: member.uniform_received,
          vest_size: member.vest_size,
          hip_belt_size: member.hip_belt_size,
          // US-004: Referral fields
          referral_source: member.referral_source,
          referred_by_member_id: member.referred_by_member_id || undefined,
          // US-004: Training preference
          training_preference: member.training_preference || undefined,
          // Member type and partnership fields
          member_type: member.member_type,
          partnership_company: member.partnership_company || "",
          partnership_type: member.partnership_type as
            | "influencer"
            | "corporate"
            | "brand"
            | "media"
            | "other"
            | undefined,
          partnership_contract_start: member.partnership_contract_start || "",
          partnership_contract_end: member.partnership_contract_end || "",
          partnership_notes: member.partnership_notes || "",
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
          // US-004: Equipment fields defaults
          uniform_size: "M",
          uniform_received: false,
          vest_size: "V1",
          hip_belt_size: "V1",
          // US-004: Referral fields defaults
          referral_source: "studio",
          referred_by_member_id: undefined,
          // US-004: Training preference default
          training_preference: undefined,
          // Member type and partnership fields defaults
          member_type: "full",
          partnership_company: "",
          partnership_type: undefined,
          partnership_contract_start: "",
          partnership_contract_end: "",
          partnership_notes: "",
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

  // Reset form when member prop changes (for edit mode)
  useEffect(() => {
    if (member) {
      form.reset({
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
        uniform_size: member.uniform_size,
        uniform_received: member.uniform_received,
        vest_size: member.vest_size,
        hip_belt_size: member.hip_belt_size,
        referral_source: member.referral_source,
        referred_by_member_id: member.referred_by_member_id || undefined,
        training_preference: member.training_preference || undefined,
        member_type: member.member_type,
        partnership_company: member.partnership_company || "",
        partnership_type: member.partnership_type as
          | "influencer"
          | "corporate"
          | "brand"
          | "media"
          | "other"
          | undefined,
        partnership_contract_start: member.partnership_contract_start || "",
        partnership_contract_end: member.partnership_contract_end || "",
        partnership_notes: member.partnership_notes || "",
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
      });
    }
  }, [member, form]);

  // Note: localStorage persistence removed for security (prevents XSS access to sensitive data)
  // Form state is now purely in-memory - data will be lost on page refresh
  // This is an acceptable tradeoff for better security, especially for medical conditions

  // Note: Change tracking removed - we now always allow updates in edit mode
  // React Hook Form's built-in dirty tracking can be used if needed via form.formState.isDirty

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
          logger.debug("Field changed:", { fieldName: name, values });
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

  const handleNextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  }, [validateCurrentStep, currentStep]); // steps.length is constant

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleStepClick = useCallback(async (stepId: number) => {
    // Allow free navigation to any step
    setCurrentStep(stepId);
  }, []);

  const handleSubmit = useCallback(
    async (data: MemberFormData) => {
      // Clean up partnership data for non-collaboration members
      const cleanedData = { ...data };
      if (cleanedData.member_type !== "collaboration") {
        // Clear partnership fields if not collaboration member
        cleanedData.partnership_company = undefined;
        cleanedData.partnership_type = undefined;
        cleanedData.partnership_contract_start = undefined;
        cleanedData.partnership_contract_end = undefined;
        cleanedData.partnership_notes = undefined;
      } else {
        // For collaboration members, ensure dates are properly formatted
        // Convert empty strings to undefined for optional date fields
        if (
          !cleanedData.partnership_contract_start ||
          cleanedData.partnership_contract_start.trim() === ""
        ) {
          cleanedData.partnership_contract_start = undefined;
        }
        // partnership_contract_end is required for collaboration, so don't clear it
      }

      // In edit mode: validate and submit
      if (member) {
        try {
          await memberFormSchema.parseAsync(cleanedData);

          // Submit all form data (database will handle the update)
          await onSubmit(cleanedData);
        } catch (error) {
          if (error instanceof z.ZodError) {
            // Show validation errors without jumping to steps
            const zodError = error as z.ZodError;
            const errorMessages = zodError.issues
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join("; ");
            toast.error("Validation Failed", {
              description:
                errorMessages.length > 100
                  ? "Please check all required fields"
                  : errorMessages,
            });
          }
          throw error;
        }
        return;
      }

      // Create mode: step-by-step validation
      for (const step of steps) {
        try {
          await step.schema.parseAsync(cleanedData);
        } catch (error) {
          if (error instanceof z.ZodError && !step.isOptional) {
            toast.error(`Please complete step ${step.id}: ${step.title}`);
            setCurrentStep(step.id);
            return;
          }
        }
      }

      try {
        await onSubmit(cleanedData);
        // No localStorage cleanup needed - we don't persist form data anymore
      } catch (error) {
        logger.error("Failed to submit form:", { error });
        throw error; // Re-throw to let parent handle the error
      }
    },
    [member, onSubmit]
  ); // steps is constant

  // Handle cancel - no cleanup needed
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Memoized callbacks for inline functions (Performance Phase 2)
  const handleStepClickIfAccessible = useCallback(
    (stepId: number, isAccessible: boolean) => () => {
      if (isAccessible) {
        handleStepClick(stepId);
      }
    },
    [handleStepClick]
  );

  const handleFormSubmit = useCallback(() => {
    form.handleSubmit(handleSubmit)();
  }, [form, handleSubmit]);

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep form={form} member={member} />;
      case 2:
        return <ContactInfoStep form={form} member={member} />;
      case 3:
        return <MemberAddressStep form={form} />;
      case 4:
        return <MemberTypeStep form={form} member={member} />;
      case 5:
        return <PartnershipDetailsStep form={form} member={member} />;
      case 6:
        return <EquipmentStep form={form} member={member} />;
      case 7:
        return <ReferralStep form={form} member={member} />;
      case 8:
        return <TrainingPreferenceStep form={form} member={member} />;
      case 9:
        return <MemberHealthFitnessStep form={form} />;
      case 10:
        return <SettingsStep form={form} member={member} />;
      default:
        return null;
    }
  }, [currentStep, form, member]);

  return (
    <div
      className={cn("mx-auto w-full max-w-7xl space-y-4", className)}
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
              const isAccessible = true; // Allow navigation to all steps

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
                    onClick={handleStepClickIfAccessible(step.id, isAccessible)}
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
        <CardContent className="min-h-[400px]">
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

      {/* Navigation Footer - Outside Form */}
      {member ? (
        // Edit Mode: Just Save & Cancel
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="min-h-[44px]"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={handleFormSubmit}
            className="min-h-[44px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Member
              </>
            )}
          </Button>
        </div>
      ) : (
        // Create Mode: Previous/Next workflow
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
                onClick={handleFormSubmit}
                aria-label="Create member with provided information"
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
                    <span>Create Member</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

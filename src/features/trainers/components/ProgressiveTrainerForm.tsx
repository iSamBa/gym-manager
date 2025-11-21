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
import { supabase } from "@/lib/supabase";
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
import type { CreateTrainerData } from "@/features/trainers/lib/database-utils";
import { toast } from "sonner";
import {
  PersonalInfoStep,
  ProfessionalDetailsStep,
  SpecializationsStep,
  CapacityStep,
  ComplianceStep,
  trainerFormSchema,
  personalInfoSchema,
  professionalDetailsSchema,
  specializationsSchema,
  capacitySchema,
  complianceSchema,
  type TrainerFormData,
  type StepInfo,
} from "./progressive-form";

import { logger } from "@/lib/logger";
import { isDevelopment } from "@/lib/env";

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

interface ProgressiveTrainerFormProps {
  trainer?: TrainerWithProfile | null;
  onSubmit: (data: CreateTrainerData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
  showHeader?: boolean;
}

export const ProgressiveTrainerForm = memo(function ProgressiveTrainerForm({
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

  // Note: localStorage persistence removed for security (prevents XSS access to sensitive data)
  // Form state is now purely in-memory - data will be lost on page refresh
  // This is an acceptable tradeoff for better security of trainer PII and professional data

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
    if (isDevelopment()) {
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
      // No localStorage cleanup needed - we don't persist form data anymore
    } catch (error) {
      logger.error("Failed to submit form:", { error });
      throw error; // Re-throw to let parent handle the error
    }
  };

  // Handle cancel - no cleanup needed
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Helper functions for array field management
  const addSpecialization = useCallback(
    (spec: string) => {
      const current = form.getValues("specializations");
      const currentArray = Array.isArray(current) ? current : [];
      if (!currentArray.includes(spec)) {
        form.setValue("specializations", [...currentArray, spec]);
      }
    },
    [form]
  );

  const removeSpecialization = useCallback(
    (spec: string) => {
      const current = form.getValues("specializations");
      const currentArray = Array.isArray(current) ? current : [];
      form.setValue(
        "specializations",
        currentArray.filter((s) => s !== spec)
      );
    },
    [form]
  );

  const addCertification = useCallback(
    (cert: string) => {
      const current = form.getValues("certifications");
      const currentArray = Array.isArray(current) ? current : [];
      if (!currentArray.includes(cert)) {
        form.setValue("certifications", [...currentArray, cert]);
      }
    },
    [form]
  );

  const removeCertification = useCallback(
    (cert: string) => {
      const current = form.getValues("certifications");
      const currentArray = Array.isArray(current) ? current : [];
      form.setValue(
        "certifications",
        currentArray.filter((c) => c !== cert)
      );
    },
    [form]
  );

  const addLanguage = useCallback(
    (lang: string) => {
      const current = form.getValues("languages");
      const currentArray = Array.isArray(current) ? current : [];
      if (!currentArray.includes(lang)) {
        form.setValue("languages", [...currentArray, lang]);
      }
    },
    [form]
  );

  const removeLanguage = useCallback(
    (lang: string) => {
      const current = form.getValues("languages");
      const currentArray = Array.isArray(current) ? current : [];
      if (currentArray.length > 1) {
        // Keep at least one language
        form.setValue(
          "languages",
          currentArray.filter((l) => l !== lang)
        );
      }
    },
    [form]
  );

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep form={form} trainer={trainer} />;
      case 2:
        return <ProfessionalDetailsStep form={form} trainer={trainer} />;
      case 3:
        return (
          <SpecializationsStep
            form={form}
            trainer={trainer}
            availableSpecializations={availableSpecializations}
            addLanguage={addLanguage}
            removeLanguage={removeLanguage}
            addSpecialization={addSpecialization}
            removeSpecialization={removeSpecialization}
            addCertification={addCertification}
            removeCertification={removeCertification}
          />
        );
      case 4:
        return <CapacityStep form={form} trainer={trainer} />;
      case 5:
        return <ComplianceStep form={form} trainer={trainer} />;
      default:
        return null;
    }
  }, [
    currentStep,
    form,
    trainer,
    availableSpecializations,
    addLanguage,
    removeLanguage,
    addSpecialization,
    removeSpecialization,
    addCertification,
    removeCertification,
  ]);

  return (
    <div
      className={cn("mx-auto max-w-2xl space-y-4", className)}
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
              const isAccessible =
                step.id <= currentStep || completedSteps.includes(step.id);

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
              aria-label="Create trainer with provided information"
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
                  <span>Create Trainer</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

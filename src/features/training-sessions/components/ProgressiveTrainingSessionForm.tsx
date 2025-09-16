import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarPlus,
  Loader2,
  Users,
  MapPin,
  Clock,
  User,
  ArrowLeft,
  Star,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DateTimePicker } from "@/components/ui/datetime-picker";

import { createSessionSchema, type CreateSessionData } from "../lib/validation";
import { useTrainers } from "../hooks/use-trainers";
import MemberMultiSelect from "./forms/MemberMultiSelect";
import TrainerAvailabilityCheck from "./forms/TrainerAvailabilityCheck";

interface ProgressiveTrainingSessionFormProps {
  onSubmit: (data: CreateSessionData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ProgressiveTrainingSessionForm: React.FC<
  ProgressiveTrainingSessionFormProps
> = ({ onSubmit, onCancel, isLoading = false }) => {
  const [showAvailabilityCheck, setShowAvailabilityCheck] = useState(false);

  // Fetch trainers for selection
  const { data: trainers = [], isLoading: trainersLoading } = useTrainers();

  // Form setup with validation
  const form = useForm<CreateSessionData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      trainer_id: "",
      scheduled_start: "",
      scheduled_end: "",
      location: "",
      session_type: "",
      max_participants: 1,
      member_ids: [],
      notes: "",
    },
  });

  const { handleSubmit, watch, formState } = form;
  const { errors } = formState;

  // Watch form fields for real-time validation and availability checking
  const watchedFields = watch();
  const { trainer_id, scheduled_start, scheduled_end } = watchedFields;

  // Debounce availability check parameters to prevent excessive API calls
  const debouncedTrainerId = useDebounce(trainer_id, 300);
  const debouncedStartTime = useDebounce(scheduled_start, 300);
  const debouncedEndTime = useDebounce(scheduled_end, 300);

  // Check if any availability parameters are still being debounced
  const isDebouncing =
    trainer_id !== debouncedTrainerId ||
    scheduled_start !== debouncedStartTime ||
    scheduled_end !== debouncedEndTime;

  // Show availability check when all required fields are present (using debounced values)
  useEffect(() => {
    const shouldShowCheck = !!(
      debouncedTrainerId &&
      debouncedStartTime &&
      debouncedEndTime
    );
    setShowAvailabilityCheck(shouldShowCheck);
  }, [debouncedTrainerId, debouncedStartTime, debouncedEndTime]);

  // Handle form submission
  const handleFormSubmit = async (data: CreateSessionData) => {
    await onSubmit(data);
  };

  // Format trainer display name
  const formatTrainerName = (trainer: {
    id: string;
    user_profile?: { first_name?: string; last_name?: string };
  }) => {
    const profile = trainer.user_profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return trainer.id;
  };

  // Calculate session duration
  const calculateDuration = () => {
    if (!scheduled_start || !scheduled_end) return null;

    try {
      const start = new Date(scheduled_start);
      const end = new Date(scheduled_end);
      const durationMs = end.getTime() - start.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));

      if (durationMinutes < 60) {
        return `${durationMinutes} minutes`;
      } else {
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`;
      }
    } catch {
      return null;
    }
  };

  const duration = calculateDuration();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Training Session
          </h1>
          <p className="text-muted-foreground">
            Schedule a new training session for your gym members
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Session Details
          </CardTitle>
          <CardDescription>
            Fill out the form below to schedule a new training session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={handleSubmit(handleFormSubmit)}
              className="space-y-4"
            >
              {/* Trainer Selection */}
              <FormField
                control={form.control}
                name="trainer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Trainer *
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={trainersLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a trainer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {formatTrainerName(trainer)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Session Type Selection */}
              <FormField
                control={form.control}
                name="session_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Session Type *
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex max-w-2xl gap-3"
                      >
                        <label
                          htmlFor="trail"
                          className={`hover:border-primary/50 min-w-0 cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                            field.value === "trail"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <RadioGroupItem
                              value="trail"
                              id="trail"
                              className="mt-1"
                            />
                            <div className="flex flex-col space-y-1">
                              <span className="font-semibold">
                                Trail Session
                              </span>
                              <p className="text-muted-foreground text-sm">
                                Try-out session for new members
                              </p>
                            </div>
                          </div>
                        </label>
                        <label
                          htmlFor="standard"
                          className={`hover:border-primary/50 min-w-0 cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                            field.value === "standard"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <RadioGroupItem
                              value="standard"
                              id="standard"
                              className="mt-1"
                            />
                            <div className="flex flex-col space-y-1">
                              <span className="font-semibold">
                                Standard Session
                              </span>
                              <p className="text-muted-foreground text-sm">
                                Regular training session
                              </p>
                            </div>
                          </div>
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Selection */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="scheduled_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Start Time *
                      </FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date) =>
                            field.onChange(date ? date.toISOString() : "")
                          }
                          placeholder="Select start date and time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduled_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time *</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date) =>
                            field.onChange(date ? date.toISOString() : "")
                          }
                          placeholder="Select end date and time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Duration Display */}
              {duration && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Duration: <Badge variant="outline">{duration}</Badge>
                </div>
              )}

              {/* Trainer Availability Check - uses debounced values to prevent excessive API calls */}
              {trainer_id && scheduled_start && scheduled_end && (
                <div className="space-y-2">
                  {isDebouncing && (
                    <div className="text-muted-foreground bg-muted/50 flex items-center gap-2 rounded p-2 text-sm">
                      <Clock className="h-4 w-4 animate-pulse" />
                      <span>Updating availability check...</span>
                    </div>
                  )}
                  {showAvailabilityCheck && (
                    <TrainerAvailabilityCheck
                      trainerId={debouncedTrainerId}
                      startTime={debouncedStartTime}
                      endTime={debouncedEndTime}
                    />
                  )}
                </div>
              )}

              <Separator />

              {/* Location and Capacity */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Studio 1, Gym Floor, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Max Participants *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Member Selection */}
              <FormField
                control={form.control}
                name="member_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Members *
                    </FormLabel>
                    <FormControl>
                      <MemberMultiSelect
                        selectedMemberIds={field.value}
                        onMemberIdsChange={field.onChange}
                        maxMembers={watchedFields.max_participants}
                        error={errors.member_ids?.message}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes for this session..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Session
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressiveTrainingSessionForm;

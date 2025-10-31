import { memo, useState, useCallback, useEffect } from "react";
import {
  Edit,
  Save,
  X,
  Loader2,
  Phone,
  User,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { SessionStatsCards } from "../SessionStatsCards";
import { SessionAlertsSection } from "../SessionAlertsSection";
import type { TrainingSession } from "../../lib/types";
import type { MemberComment } from "@/features/database/lib/types";
import type { MemberDialogData } from "../../hooks/use-member-dialog-data";
import { useUpdateMember } from "@/features/members/hooks/use-members";
import type {
  UniformSize,
  VestSize,
  HipBeltSize,
} from "@/features/database/lib/types";

/**
 * Props for MemberDetailsTab component
 */
export interface MemberDetailsTabProps {
  /** Current session data (for equipment sizes and financial info) */
  session: TrainingSession;
  /** Member data and session stats */
  memberData: MemberDialogData;
  /** Active alerts for the member */
  alerts: MemberComment[];
  /** Callback when member data is updated */
  onMemberUpdated?: () => void;
}

/**
 * Form data for member updates
 */
interface MemberFormData {
  first_name: string;
  last_name: string;
  phone: string;
  uniform_size: UniformSize;
  vest_size: VestSize;
  hip_belt_size: HipBeltSize;
}

/**
 * Member Details tab with Edit/Save/Cancel pattern
 *
 * Features:
 * - Independent edit mode state
 * - Editable: Personal info, equipment sizes
 * - Read-only: Session stats, financial info
 * - Session alerts display
 * - Phone number validation
 *
 * @param props - Session and member data with callbacks
 */
export const MemberDetailsTab = memo(function MemberDetailsTab({
  session,
  memberData,
  alerts,
  onMemberUpdated,
}: MemberDetailsTabProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<MemberFormData>({
    first_name: memberData.member.first_name || "",
    last_name: memberData.member.last_name || "",
    phone: memberData.member.phone || "",
    uniform_size: (memberData.member.uniform_size as UniformSize) || "M",
    vest_size: (memberData.member.vest_size as VestSize) || "V2",
    hip_belt_size: (memberData.member.hip_belt_size as HipBeltSize) || "V1",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof MemberFormData, string>>
  >({});

  const updateMemberMutation = useUpdateMember();
  const memberId = session.participants?.[0]?.id;

  // Update form data when memberData changes
  useEffect(() => {
    setFormData({
      first_name: memberData.member.first_name || "",
      last_name: memberData.member.last_name || "",
      phone: memberData.member.phone || "",
      uniform_size: (memberData.member.uniform_size as UniformSize) || "M",
      vest_size: (memberData.member.vest_size as VestSize) || "V2",
      hip_belt_size: (memberData.member.hip_belt_size as HipBeltSize) || "V1",
    });
  }, [memberData]);

  // Validate phone number
  const validatePhone = useCallback((phone: string): boolean => {
    if (!phone) {
      setErrors((prev) => ({ ...prev, phone: "Phone number is required" }));
      return false;
    }
    // Basic phone validation - at least 10 digits
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setErrors((prev) => ({
        ...prev,
        phone: "Phone number must be at least 10 digits",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, phone: undefined }));
    return true;
  }, []);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof MemberFormData, string>> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    if (!validatePhone(formData.phone)) {
      newErrors.phone = "Valid phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validatePhone]);

  // Handle edit button click
  const handleEdit = useCallback(() => {
    setIsEditMode(true);
    setErrors({});
  }, []);

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    // Reset form to original data
    setFormData({
      first_name: memberData.member.first_name || "",
      last_name: memberData.member.last_name || "",
      phone: memberData.member.phone || "",
      uniform_size: (memberData.member.uniform_size as UniformSize) || "M",
      vest_size: (memberData.member.vest_size as VestSize) || "V2",
      hip_belt_size: (memberData.member.hip_belt_size as HipBeltSize) || "V1",
    });
    setIsEditMode(false);
    setErrors({});
  }, [memberData]);

  // Handle save button click
  const handleSave = useCallback(async () => {
    if (!memberId) return;

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      await updateMemberMutation.mutateAsync({
        id: memberId,
        data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          uniform_size: formData.uniform_size,
          vest_size: formData.vest_size,
          hip_belt_size: formData.hip_belt_size,
        },
      });

      setIsEditMode(false);
      if (onMemberUpdated) {
        onMemberUpdated();
      }
    } catch (error) {
      logger.error("Failed to update member", { error });
    }
  }, [memberId, formData, validateForm, updateMemberMutation, onMemberUpdated]);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof MemberFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const isLoading = updateMemberMutation.isPending || memberData.isLoading;

  // Calculate remaining sessions (convert undefined to null)
  const remainingSessions = session.remaining_sessions ?? null;

  return (
    <div className="space-y-6">
      {/* Header with Edit or Save/Cancel buttons */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Member Details</h3>
        {!isEditMode ? (
          <Button onClick={handleEdit} variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Alerts Section */}
      <SessionAlertsSection alerts={alerts} />

      {/* Personal Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="text-muted-foreground h-4 w-4" />
          <h4 className="text-muted-foreground text-sm font-medium">
            Personal Information
          </h4>
        </div>

        {isEditMode ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
                placeholder="Enter first name"
                className={cn(errors.first_name && "border-destructive")}
              />
              {errors.first_name && (
                <p className="text-destructive text-sm">{errors.first_name}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Enter last name"
                className={cn(errors.last_name && "border-destructive")}
              />
              {errors.last_name && (
                <p className="text-destructive text-sm">{errors.last_name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground h-4 w-4" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  onBlur={() => validatePhone(formData.phone)}
                  placeholder="Enter phone number"
                  className={cn(errors.phone && "border-destructive")}
                />
              </div>
              {errors.phone && (
                <p className="text-destructive text-sm">{errors.phone}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <span className="text-muted-foreground text-sm">Name</span>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {memberData.member.first_name} {memberData.member.last_name}
                </p>
                {memberId && (
                  <Link
                    href={`/members/${memberId}`}
                    className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs"
                  >
                    Go to Profile
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Phone</span>
              <p className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4" />
                {memberData.member.phone || "Not provided"}
              </p>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Equipment Sizes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="text-muted-foreground h-4 w-4" />
          <h4 className="text-muted-foreground text-sm font-medium">
            Equipment Sizes
          </h4>
        </div>

        {isEditMode ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Uniform Size */}
            <div className="space-y-2">
              <Label htmlFor="uniform_size">Uniform Size</Label>
              <Select
                value={formData.uniform_size}
                onValueChange={(value) =>
                  handleInputChange("uniform_size", value)
                }
              >
                <SelectTrigger id="uniform_size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vest Size */}
            <div className="space-y-2">
              <Label htmlFor="vest_size">Vest Size</Label>
              <Select
                value={formData.vest_size}
                onValueChange={(value) => handleInputChange("vest_size", value)}
              >
                <SelectTrigger id="vest_size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="V1">V1</SelectItem>
                  <SelectItem value="V2">V2</SelectItem>
                  <SelectItem value="V2_SMALL_EXT">V2 Small Ext</SelectItem>
                  <SelectItem value="V2_LARGE_EXT">V2 Large Ext</SelectItem>
                  <SelectItem value="V2_DOUBLE_EXT">V2 Double Ext</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hip Belt Size */}
            <div className="space-y-2">
              <Label htmlFor="hip_belt_size">Hip Belt Size</Label>
              <Select
                value={formData.hip_belt_size}
                onValueChange={(value) =>
                  handleInputChange("hip_belt_size", value)
                }
              >
                <SelectTrigger id="hip_belt_size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="V1">V1</SelectItem>
                  <SelectItem value="V2">V2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <span className="text-muted-foreground text-sm">Uniform</span>
              <Badge variant="outline" className="mt-1">
                {memberData.member.uniform_size || "M"}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Vest</span>
              <Badge variant="outline" className="mt-1">
                {memberData.member.vest_size || "V2"}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Hip Belt</span>
              <Badge variant="outline" className="mt-1">
                {memberData.member.hip_belt_size || "V1"}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Session Statistics - Always Read-Only */}
      <div className="space-y-4">
        <h4 className="text-muted-foreground text-sm font-medium">
          Session Statistics
        </h4>
        <SessionStatsCards
          done={memberData.sessionStats.done}
          remaining={remainingSessions}
          scheduled={memberData.sessionStats.scheduled}
        />
      </div>

      <Separator />

      {/* Financial Information - Always Read-Only */}
      <div className="space-y-4">
        <h4 className="text-muted-foreground text-sm font-medium">
          Financial Information
        </h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <span className="text-muted-foreground text-sm">
              Outstanding Balance
            </span>
            <p className="text-sm font-medium">
              {session.outstanding_balance != null
                ? `$${session.outstanding_balance.toFixed(2)}`
                : "N/A"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-sm">Last Payment</span>
            <p className="text-sm font-medium">
              {session.latest_payment_date
                ? format(new Date(session.latest_payment_date), "PPP")
                : "No payments"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-sm">
              Subscription End
            </span>
            <p className="text-sm font-medium">
              {session.subscription_end_date
                ? format(new Date(session.subscription_end_date), "PPP")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

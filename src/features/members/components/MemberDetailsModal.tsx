import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  CreditCard,
  Target,
  FileText,
} from "lucide-react";
import { MemberAvatar } from "./MemberAvatar";
import { MemberStatusBadge } from "./MemberStatusBadge";
import { cn } from "@/lib/utils";
import type { Member } from "@/features/database/lib/types";

interface MemberDetailsModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (member: Member) => void;
  className?: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatAddress = (address: Member["address"]) => {
  if (!address) return "Not provided";
  return `${address.street}, ${address.city}, ${address.state} ${address.postal_code}, ${address.country}`;
};

export function MemberDetailsModal({
  member,
  isOpen,
  onClose,
  onEdit,
  className,
}: MemberDetailsModalProps) {
  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn("max-h-[90vh] max-w-2xl overflow-y-auto", className)}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MemberAvatar member={member} size="lg" />
              <div>
                <h2 className="text-xl font-semibold">
                  {member.first_name} {member.last_name}
                </h2>
                <p className="text-muted-foreground text-sm">
                  Member #{member.member_number}
                </p>
              </div>
            </div>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(member)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <MemberStatusBadge status={member.status} memberId={member.id} />
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-medium">
              <User className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground h-4 w-4" />
                <span>{member.phone || "Not provided"}</span>
              </div>
              <div className="flex items-start gap-2 md:col-span-2">
                <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
                <span>{formatAddress(member.address)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Personal Information */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-medium">
              <Calendar className="h-4 w-4" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Date of Birth:</span>
                <p className="font-medium">
                  {formatDate(member.date_of_birth)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Gender:</span>
                <p className="font-medium capitalize">{member.gender}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Join Date:</span>
                <p className="font-medium">{formatDate(member.join_date)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Preferred Contact:
                </span>
                <p className="font-medium capitalize">
                  {member.preferred_contact_method}
                </p>
              </div>
            </div>
          </div>

          {/* Fitness Goals */}
          {member.fitness_goals && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-medium">
                  <Target className="h-4 w-4" />
                  Fitness Goals
                </h3>
                <p className="text-muted-foreground text-sm">
                  {member.fitness_goals}
                </p>
              </div>
            </>
          )}

          {/* Medical Conditions */}
          {member.medical_conditions && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4" />
                  Medical Conditions
                </h3>
                <p className="text-muted-foreground text-sm">
                  {member.medical_conditions}
                </p>
              </div>
            </>
          )}

          {/* Notes */}
          {member.notes && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4" />
                  Notes
                </h3>
                <p className="text-muted-foreground text-sm">{member.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Compliance */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-medium">
              <CreditCard className="h-4 w-4" />
              Compliance
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Waiver Signed:
                </span>
                <Badge
                  variant={member.waiver_signed ? "default" : "destructive"}
                >
                  {member.waiver_signed ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Marketing Consent:
                </span>
                <Badge
                  variant={member.marketing_consent ? "default" : "secondary"}
                >
                  {member.marketing_consent ? "Yes" : "No"}
                </Badge>
              </div>
              {member.waiver_signed && member.waiver_signed_date && (
                <div className="md:col-span-2">
                  <span className="text-muted-foreground text-sm">
                    Waiver Date:
                  </span>
                  <p className="text-sm font-medium">
                    {formatDate(member.waiver_signed_date)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

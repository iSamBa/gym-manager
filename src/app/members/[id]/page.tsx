"use client";

import { use, useEffect, useState } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MemberAvatar,
  MemberStatusBadge,
  EditMemberDialog,
  withMemberErrorBoundary,
  MemberSessions,
  MemberSubscriptions,
  MemberPayments,
} from "@/features/members/components";
import { EquipmentEditor } from "@/features/members/components/EquipmentEditor";
import { ReferralEditor } from "@/features/members/components/ReferralEditor";
import { TrainingPreferenceEditor } from "@/features/members/components/TrainingPreferenceEditor";
import {
  useMemberWithSubscription,
  useUpdateMemberStatus,
  useDeleteMember,
  useMemberPrefetch,
} from "@/features/members/hooks";
import {
  Edit,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MapPin,
  User,
  AlertCircle,
  Trash2,
  Activity,
  UserCircle,
  CreditCard,
  Receipt,
  Package,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Member } from "@/features/database/lib/types";

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

// Helper function to format dates
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

// Helper function to format address
const formatAddress = (address: Member["address"]) => {
  if (!address) return "No address provided";
  return `${address.street}, ${address.city}, ${address.state} ${address.postal_code}, ${address.country}`;
};

function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Member data with subscription and emergency contacts
  const {
    data: member,
    isLoading,
    error,
    refetch,
  } = useMemberWithSubscription(id, {
    refetchInterval: 60000, // Refresh every minute
    refetchOnWindowFocus: true,
  });

  // Status update mutation with optimistic updates
  const updateStatusMutation = useUpdateMemberStatus();

  // Delete mutation
  const deleteMutation = useDeleteMember();

  // Prefetch related members for navigation
  const { prefetchAdjacentMembers } = useMemberPrefetch();

  // Page cache strategy temporarily disabled

  // Prefetch adjacent members when the component loads
  useEffect(() => {
    if (member) {
      prefetchAdjacentMembers(member.id);
    }
  }, [member, prefetchAdjacentMembers]);

  const handleStatusChange = async (
    newStatus: "active" | "inactive" | "pending" | "suspended"
  ) => {
    if (!member) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: member.id,
        status: newStatus,
      });
    } catch (error) {
      console.error("Failed to update member status:", error);
    }
  };

  const handleDeleteMember = () => {
    if (!member) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!member) return;

    try {
      await deleteMutation.mutateAsync(member.id);
      setShowDeleteConfirm(false);
      router.push("/members");
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    // The EditMemberDialog handles cache invalidation, so member data will refresh automatically
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <LoadingSkeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <LoadingSkeleton className="h-64" />
              <LoadingSkeleton className="h-48" />
            </div>
            <LoadingSkeleton className="h-96" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load member details. Please try again.
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  if (!member) {
    return (
      <MainLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Member not found.</AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/members">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Members
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMember}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Training Sessions
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main Member Information */}
              <div className="space-y-6 lg:col-span-2">
                {/* Basic Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Member Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-start gap-6">
                      {/* Avatar and Status Badge */}
                      <div className="flex flex-shrink-0 flex-col items-center gap-3">
                        <MemberAvatar
                          member={member}
                          size="lg"
                          className="flex-shrink-0"
                        />
                        <MemberStatusBadge
                          status={member.status}
                          memberId={member.id}
                          readonly={false}
                        />
                      </div>

                      {/* Member Details */}
                      <div className="flex-1 space-y-4">
                        {/* Name and Member ID */}
                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold">
                            {member.first_name} {member.last_name}
                          </h2>
                          <Badge variant="outline" className="text-xs">
                            Member ID: {member.id.slice(-8)}
                          </Badge>
                        </div>

                        {/* Contact Information */}
                        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <Mail className="text-muted-foreground h-4 w-4" />
                            <span>{member.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="text-muted-foreground h-4 w-4" />
                            <span>{member.phone || "Not provided"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="text-muted-foreground h-4 w-4" />
                            <span>
                              {member.date_of_birth ? (
                                <>
                                  Birthday:{" "}
                                  {formatDate(new Date(member.date_of_birth))} (
                                  {calculateAge(member.date_of_birth)} years
                                  old)
                                </>
                              ) : (
                                "Birthday: Not provided"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="text-muted-foreground h-4 w-4" />
                            <span>
                              Joined {formatDate(new Date(member.created_at))}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 md:col-span-2">
                            <MapPin className="text-muted-foreground h-4 w-4" />
                            <span>{formatAddress(member.address)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information - Aligned with member details */}
                    <div className="flex items-start gap-6">
                      {/* Spacer to match avatar column width + icon spacing */}
                      <div className="w-20 flex-shrink-0" />

                      {/* Content aligned with member details */}
                      <div className="flex-1 space-y-6">
                        {/* Emergency Contacts */}
                        {member.emergency_contacts &&
                          member.emergency_contacts.length > 0 && (
                            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                              <div className="md:col-span-2">
                                <span className="text-muted-foreground">
                                  Emergency Contacts:
                                </span>
                              </div>
                              {member.emergency_contacts.map(
                                (contact, index) => (
                                  <div
                                    key={index}
                                    className="bg-muted rounded-lg p-3"
                                  >
                                    <div>
                                      <p className="text-sm font-medium">
                                        {contact.first_name} {contact.last_name}
                                      </p>
                                      <p className="text-muted-foreground text-xs">
                                        {contact.relationship}
                                      </p>
                                    </div>
                                    <div className="mt-1">
                                      <p className="text-sm">{contact.phone}</p>
                                      {contact.email && (
                                        <p className="text-muted-foreground text-xs">
                                          {contact.email}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}

                        {/* Equipment and Other Information */}
                        <EquipmentEditor member={member} />
                        <ReferralEditor member={member} />
                        {member.gender === "female" && (
                          <TrainingPreferenceEditor member={member} />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Subscription Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {member.subscription ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Plan</span>
                          <Badge variant="secondary">
                            {member.subscription.plan?.name || "Unknown Plan"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Status</span>
                          <Badge
                            variant={
                              member.subscription.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {member.subscription.status}
                          </Badge>
                        </div>

                        <Separator />

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Start Date</span>
                            <span>
                              {formatDate(
                                new Date(member.subscription.start_date)
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>End Date</span>
                            <span>
                              {member.subscription.end_date
                                ? formatDate(
                                    new Date(member.subscription.end_date)
                                  )
                                : "No end date"}
                            </span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Monthly Fee</span>
                            <span>${member.subscription.price}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No active subscription
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Activity Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Member Since</span>
                      <span className="text-muted-foreground">
                        {formatDate(new Date(member.join_date))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Account Created</span>
                      <span className="text-muted-foreground">
                        {formatDate(new Date(member.created_at))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Training Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <MemberSessions
              memberId={member.id}
              memberName={`${member.first_name} ${member.last_name}`}
            />
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <MemberSubscriptions member={member} />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <MemberPayments member={member} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Member Dialog */}
      <EditMemberDialog
        member={member}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Member"
        description={
          member
            ? `Are you sure you want to delete ${member.first_name} ${member.last_name}? This action cannot be undone.`
            : "Are you sure you want to delete this member? This action cannot be undone."
        }
        confirmText="Delete Member"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </MainLayout>
  );
}

export default withMemberErrorBoundary(MemberDetailPage);

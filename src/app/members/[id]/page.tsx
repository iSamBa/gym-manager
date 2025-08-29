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
import {
  MemberAvatar,
  MemberStatusBadge,
  EditMemberDialog,
  withMemberErrorBoundary,
} from "@/features/members/components";
import {
  useMemberWithSubscription,
  useUpdateMemberStatus,
  useDeleteMember,
  useMemberPrefetch,
  useRouteCacheManager,
  usePageCacheStrategy,
} from "@/features/members/hooks";
import {
  Edit,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MapPin,
  User,
  Clock,
  AlertCircle,
  Trash2,
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
    isFetching,
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

  // Route-based cache management
  useRouteCacheManager();
  usePageCacheStrategy("detail");

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
          <div className="flex items-center gap-4">
            <Link href="/members">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Members
              </Button>
            </Link>
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                {member.first_name} {member.last_name}
                {isFetching && (
                  <Clock className="text-muted-foreground h-4 w-4 animate-spin" />
                )}
              </h1>
            </div>
          </div>

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
                <div className="flex items-start gap-4">
                  <MemberAvatar
                    member={member}
                    size="lg"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {member.first_name} {member.last_name}
                      </h3>
                      <MemberStatusBadge
                        status={member.status}
                        memberId={member.id}
                        readonly={true}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
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
                          Joined {formatDate(new Date(member.created_at))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="text-muted-foreground h-4 w-4" />
                        <span>{formatAddress(member.address)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    variant={member.status === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("active")}
                    disabled={updateStatusMutation.isPending}
                  >
                    Mark Active
                  </Button>
                  <Button
                    variant={
                      member.status === "inactive" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleStatusChange("inactive")}
                    disabled={updateStatusMutation.isPending}
                  >
                    Mark Inactive
                  </Button>
                  <Button
                    variant={
                      member.status === "suspended" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleStatusChange("suspended")}
                    disabled={updateStatusMutation.isPending}
                  >
                    Mark Suspended
                  </Button>
                  <Button
                    variant={
                      member.status === "pending" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleStatusChange("pending")}
                    disabled={updateStatusMutation.isPending}
                  >
                    Mark Pending
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                {member.emergency_contacts &&
                member.emergency_contacts.length > 0 ? (
                  <div className="space-y-4">
                    {member.emergency_contacts.map((contact, index) => (
                      <div
                        key={index}
                        className="bg-muted flex items-center justify-between rounded-lg p-3"
                      >
                        <div>
                          <p className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {contact.relationship}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{contact.phone}</p>
                          {contact.email && (
                            <p className="text-muted-foreground text-sm">
                              {contact.email}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No emergency contacts provided
                  </p>
                )}
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
                          {formatDate(new Date(member.subscription.start_date))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>End Date</span>
                        <span>
                          {member.subscription.end_date
                            ? formatDate(new Date(member.subscription.end_date))
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

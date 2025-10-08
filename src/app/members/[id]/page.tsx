"use client";

import { use, useEffect, useState } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MemberProfileHeader,
  EditMemberDialog,
  withMemberErrorBoundary,
  MemberSessions,
  MemberSubscriptions,
  MemberPayments,
  EquipmentDisplay,
  ReferralDisplay,
  TrainingPreferenceDisplay,
  ContactInformationCard,
  PersonalDetailsCard,
  EnhancedActivityCard,
  MemberAlertsCard,
} from "@/features/members/components";
import {
  useMemberWithSubscription,
  useDeleteMember,
  useMemberPrefetch,
} from "@/features/members/hooks";
import { ArrowLeft, AlertCircle, Package, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

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

  // Delete mutation
  const deleteMutation = useDeleteMember();

  // Prefetch related members for navigation
  const { prefetchAdjacentMembers } = useMemberPrefetch();

  // Prefetch adjacent members when the component loads
  useEffect(() => {
    if (member) {
      prefetchAdjacentMembers(member.id);
    }
  }, [member, prefetchAdjacentMembers]);

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
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <LoadingSkeleton className="h-8 w-64" />
          <LoadingSkeleton className="h-32" />
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

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/members">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Button>
        </Link>

        {/* Profile Header */}
        <MemberProfileHeader
          member={member}
          onEdit={() => setIsEditDialogOpen(true)}
          onDelete={handleDeleteMember}
          onSessionSuccess={refetch}
          onPaymentSuccess={refetch}
        />

        {/* Main Content: 2-Column Layout with Tabs */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Tabbed Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="training-sessions">
                  Training Sessions
                </TabsTrigger>
                <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                {/* Contact Information Card */}
                <ContactInformationCard member={member} />

                {/* Personal Details Card */}
                <PersonalDetailsCard member={member} />

                {/* Equipment & Referral Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="h-4 w-4" />
                      Equipment & Referral
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Equipment Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">
                          Equipment & Gear
                        </h3>
                        <EquipmentDisplay member={member} />
                      </div>

                      {/* Referral Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">
                          Referral Information
                        </h3>
                        <ReferralDisplay member={member} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Training Preferences Card (conditional) */}
                {member.gender === "female" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        Training Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TrainingPreferenceDisplay member={member} />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Training Sessions Tab */}
              <TabsContent value="training-sessions">
                <MemberSessions
                  memberId={member.id}
                  memberName={`${member.first_name} ${member.last_name}`}
                />
              </TabsContent>

              {/* Subscriptions Tab */}
              <TabsContent value="subscriptions">
                <MemberSubscriptions member={member} />
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments">
                <MemberPayments member={member} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* Subscription Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
              </CardHeader>
              <CardContent>
                {member.subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Plan</span>
                      <span className="text-sm">
                        {member.subscription.plan?.name || "Unknown Plan"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <span
                        className={
                          member.subscription.status === "active"
                            ? "text-green-600"
                            : "text-gray-600"
                        }
                      >
                        {member.subscription.status}
                      </span>
                    </div>

                    <div className="border-t pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Start Date
                          </span>
                          <span>
                            {formatDate(
                              new Date(member.subscription.start_date)
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            End Date
                          </span>
                          <span>
                            {member.subscription.end_date
                              ? formatDate(
                                  new Date(member.subscription.end_date)
                                )
                              : "No end date"}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-muted-foreground">
                            Monthly Fee
                          </span>
                          <span>${member.subscription.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No active subscription
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Activity Summary Card */}
            <EnhancedActivityCard member={member} />

            {/* Member Alerts Card */}
            <MemberAlertsCard member={member} />
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

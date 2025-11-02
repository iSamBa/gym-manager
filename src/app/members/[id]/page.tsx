"use client";

import { use, useEffect, useState, useCallback } from "react";
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
  ContactInformationCard,
  PersonalDetailsCard,
  SubscriptionStatusCard,
  EnhancedActivityCard,
  MemberAlertsCard,
  EquipmentEditor,
  MemberCommentsCard,
  BodyCheckupDialog,
  BodyCheckupHistory,
  ConvertCollaborationMemberDialog,
} from "@/features/members/components";
import {
  useMemberWithSubscription,
  useDeleteMember,
  useMemberPrefetch,
  useUpdateMember,
  useBodyCheckups,
} from "@/features/members/hooks";
import { ArrowLeft, AlertCircle, Package, Edit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Member } from "@/features/database/lib/types";
import type { BodyCheckup } from "@/features/members/lib/types";

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingEquipment, setIsEditingEquipment] = useState(false);
  const [equipmentFormData, setEquipmentFormData] = useState<Member | null>(
    null
  );
  const [isCheckupDialogOpen, setIsCheckupDialogOpen] = useState(false);
  const [editingCheckup, setEditingCheckup] = useState<BodyCheckup | null>(
    null
  );
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);

  const {
    data: member,
    isLoading,
    error,
    refetch,
  } = useMemberWithSubscription(id, {
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useDeleteMember();
  const updateMember = useUpdateMember();
  const { prefetchAdjacentMembers } = useMemberPrefetch();
  const {
    checkups,
    isLoading: checkupsLoading,
    isCreating: isCreatingCheckup,
    isUpdating: isUpdatingCheckup,
    isDeleting: isDeletingCheckup,
    createCheckup,
    updateCheckup,
    deleteCheckup,
  } = useBodyCheckups(id);

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
    } catch (err) {
      console.error("Failed to delete member:", err);
    }
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
  };

  const handleEquipmentEdit = useCallback(() => {
    if (member) {
      setEquipmentFormData(member);
      setIsEditingEquipment(true);
    }
  }, [member]);

  const handleEquipmentSave = useCallback(async () => {
    if (!equipmentFormData) return;

    try {
      await updateMember.mutateAsync({
        id: equipmentFormData.id,
        data: {
          uniform_size: equipmentFormData.uniform_size,
          uniform_received: equipmentFormData.uniform_received,
          vest_size: equipmentFormData.vest_size,
          hip_belt_size: equipmentFormData.hip_belt_size,
          training_preference: equipmentFormData.training_preference,
        },
      });
      setIsEditingEquipment(false);
      toast.success("Equipment information updated successfully");
    } catch {
      toast.error("Failed to update equipment information");
    }
  }, [equipmentFormData, updateMember]);

  const handleEquipmentCancel = useCallback(() => {
    setEquipmentFormData(null);
    setIsEditingEquipment(false);
  }, []);

  const handleEquipmentFormChange = useCallback((updated: Partial<Member>) => {
    setEquipmentFormData((prev) => (prev ? { ...prev, ...updated } : null));
  }, []);

  const handleAddCheckup = useCallback(() => {
    setEditingCheckup(null);
    setIsCheckupDialogOpen(true);
  }, []);

  const handleEditCheckup = useCallback((checkup: BodyCheckup) => {
    setEditingCheckup(checkup);
    setIsCheckupDialogOpen(true);
  }, []);

  const handleSaveCheckup = useCallback(
    async (data: {
      member_id: string;
      checkup_date: string;
      weight?: number | null;
      notes?: string | null;
    }) => {
      if (editingCheckup) {
        await updateCheckup(editingCheckup.id, data);
      } else {
        await createCheckup(data);
      }
    },
    [editingCheckup, createCheckup, updateCheckup]
  );

  const handleDeleteCheckup = useCallback(
    async (checkupId: string) => {
      await deleteCheckup(checkupId);
    },
    [deleteCheckup]
  );

  const handleConversionComplete = useCallback(
    (updatedMember: Member) => {
      refetch();
      toast.success(
        `${updatedMember.first_name} ${updatedMember.last_name} has been converted to a full member`
      );
    },
    [refetch]
  );

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
          onConvert={() => setIsConvertDialogOpen(true)}
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

                {/* Equipment Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="h-4 w-4" />
                      Equipment
                      {member.gender === "female" && " & Training"}
                    </CardTitle>
                    {!isEditingEquipment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEquipmentEdit}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isEditingEquipment && equipmentFormData ? (
                      <>
                        <EquipmentEditor
                          member={equipmentFormData}
                          onChange={handleEquipmentFormChange}
                        />
                        <div className="mt-4 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={handleEquipmentCancel}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleEquipmentSave}
                            disabled={updateMember.isPending}
                          >
                            {updateMember.isPending ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <EquipmentDisplay member={member} />
                    )}
                  </CardContent>
                </Card>

                {/* Comments & Notes Card */}
                <MemberCommentsCard member={member} />

                {/* Body Checkup Card */}
                <BodyCheckupHistory
                  checkups={checkups}
                  isLoading={checkupsLoading}
                  onAdd={handleAddCheckup}
                  onEdit={handleEditCheckup}
                  onDelete={handleDeleteCheckup}
                  isDeleting={isDeletingCheckup}
                />
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
            <SubscriptionStatusCard member={member} />

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

      {/* Body Checkup Dialog */}
      <BodyCheckupDialog
        open={isCheckupDialogOpen}
        onOpenChange={setIsCheckupDialogOpen}
        memberId={id}
        checkup={editingCheckup}
        onSave={handleSaveCheckup}
        isLoading={isCreatingCheckup || isUpdatingCheckup}
      />

      {/* Convert Collaboration Member Dialog */}
      <ConvertCollaborationMemberDialog
        member={member}
        open={isConvertDialogOpen}
        onOpenChange={setIsConvertDialogOpen}
        onConversionComplete={handleConversionComplete}
      />
    </MainLayout>
  );
}

export default withMemberErrorBoundary(MemberDetailPage);

"use client";

import { use, useState } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Edit,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  User,
  Clock,
  AlertCircle,
  Trash2,
  Award,
  Users,
  DollarSign,
  GraduationCap,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TrainerDetailPageProps {
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

// Helper function to get initials
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

function TrainerDetailPage({ params }: TrainerDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Placeholder data - will be replaced with real hooks in Phase 2
  const isLoading = false;
  const error = null;
  const isFetching = false;

  // Mock trainer data for demonstration
  const trainer = {
    id,
    first_name: "John",
    last_name: "Smith",
    email: "john.smith@gym.com",
    phone: "(555) 123-4567",
    trainer_code: "TR001",
    hourly_rate: 75,
    commission_rate: 20,
    years_experience: 8,
    certifications: ["ACSM-CPT", "NASM-PES", "CPR/AED"],
    specializations: ["Personal Training", "Strength Training", "Weight Loss"],
    languages: ["English", "Spanish"],
    max_clients_per_session: 4,
    is_accepting_new_clients: true,
    created_at: "2023-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    cpr_certification_expires: "2024-12-15T00:00:00Z",
    background_check_date: "2023-01-10T00:00:00Z",
    insurance_policy_number: "INS-123456789",
  };

  const handleEditTrainer = () => {
    // TODO: Implement edit trainer functionality in Phase 3
    setIsEditDialogOpen(true);
    console.log("Edit trainer clicked");
  };

  const handleDeleteTrainer = async () => {
    if (!window.confirm("Are you sure you want to delete this trainer?"))
      return;

    // TODO: Implement delete functionality in Phase 2
    console.log("Delete trainer clicked");
    router.push("/trainers");
  };

  const handleStatusChange = (newStatus: "active" | "inactive") => {
    // TODO: Implement status change in Phase 2
    console.log("Status change:", newStatus);
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
            Failed to load trainer details. Please try again.
            <Button variant="outline" size="sm" className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  if (!trainer) {
    return (
      <MainLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Trainer not found.</AlertDescription>
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
            <Link href="/trainers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Trainers
              </Button>
            </Link>
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                {trainer.first_name} {trainer.last_name}
                {isFetching && (
                  <Clock className="text-muted-foreground h-4 w-4 animate-spin" />
                )}
              </h1>
              <p className="text-muted-foreground">
                Trainer Code: {trainer.trainer_code}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEditTrainer}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDeleteTrainer}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Trainer Information */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Trainer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 flex-shrink-0">
                    <AvatarImage
                      src=""
                      alt={`${trainer.first_name} ${trainer.last_name}`}
                    />
                    <AvatarFallback className="text-lg">
                      {getInitials(trainer.first_name, trainer.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {trainer.first_name} {trainer.last_name}
                      </h3>
                      <Badge
                        variant={
                          trainer.is_accepting_new_clients
                            ? "default"
                            : "secondary"
                        }
                      >
                        {trainer.is_accepting_new_clients
                          ? "Available"
                          : "Unavailable"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Mail className="text-muted-foreground h-4 w-4" />
                        <span>{trainer.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="text-muted-foreground h-4 w-4" />
                        <span>{trainer.phone || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="text-muted-foreground h-4 w-4" />
                        <span>${trainer.hourly_rate}/hour</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="text-muted-foreground h-4 w-4" />
                        <span>
                          Max {trainer.max_clients_per_session} clients/session
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    variant={
                      trainer.is_accepting_new_clients ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleStatusChange("active")}
                  >
                    Mark Available
                  </Button>
                  <Button
                    variant={
                      !trainer.is_accepting_new_clients ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleStatusChange("inactive")}
                  >
                    Mark Unavailable
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Professional Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Professional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Specializations */}
                <div>
                  <h4 className="mb-2 text-sm font-medium">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {trainer.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <h4 className="mb-2 text-sm font-medium">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {trainer.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline">
                        <Award className="mr-1 h-3 w-3" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <h4 className="mb-2 text-sm font-medium">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {trainer.languages.map((lang, index) => (
                      <Badge key={index} variant="outline">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div className="flex justify-between">
                    <span>Experience</span>
                    <span className="font-medium">
                      {trainer.years_experience} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission Rate</span>
                    <span className="font-medium">
                      {trainer.commission_rate}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Status & Compliance */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status & Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge
                    variant={
                      trainer.is_accepting_new_clients ? "default" : "secondary"
                    }
                  >
                    <UserCheck className="mr-1 h-3 w-3" />
                    {trainer.is_accepting_new_clients
                      ? "Available"
                      : "Unavailable"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hourly Rate</span>
                  <span className="font-medium">${trainer.hourly_rate}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Max Clients</span>
                  <span className="font-medium">
                    {trainer.max_clients_per_session}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Card */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance & Certifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>CPR Expires</span>
                    <span
                      className={
                        new Date(trainer.cpr_certification_expires) <
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                          ? "font-medium text-yellow-600"
                          : ""
                      }
                    >
                      {formatDate(new Date(trainer.cpr_certification_expires))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Background Check</span>
                    <span>
                      {formatDate(new Date(trainer.background_check_date))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insurance Policy</span>
                    <span className="font-mono text-xs">
                      {trainer.insurance_policy_number}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Joined</span>
                  <span className="text-muted-foreground">
                    {formatDate(new Date(trainer.created_at))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Last Updated</span>
                  <span className="text-muted-foreground">
                    {formatDate(new Date(trainer.updated_at))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* TODO: Implement EditTrainerDialog in Phase 3 */}
      {isEditDialogOpen && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Trainer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Edit trainer functionality will be implemented in Phase 3.
              </p>
              <Button onClick={() => setIsEditDialogOpen(false)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}

export default TrainerDetailPage;

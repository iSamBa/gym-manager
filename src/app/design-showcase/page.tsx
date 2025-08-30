"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Edit,
  Eye,
  Trash2,
} from "lucide-react";

// Import our new components
import { ProgressiveMemberForm } from "@/features/members/components/ProgressiveMemberForm";
import { AccessibleStatsGrid } from "@/features/dashboard/components/AccessibleStatsCard";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import {
  ErrorBoundary,
  ValidationError,
} from "@/components/feedback/ErrorBoundary";
import { EnhancedDataTable } from "@/components/data-display/EnhancedDataTable";

// Sample data for demonstration
const sampleMembers = [
  {
    id: "1",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@email.com",
    phone: "+1 (555) 123-4567",
    status: "active" as const,
    join_date: "2024-01-15",
    membership_type: "Premium",
  },
  {
    id: "2",
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@email.com",
    phone: "+1 (555) 234-5678",
    status: "pending" as const,
    join_date: "2024-02-03",
    membership_type: "Basic",
  },
  {
    id: "3",
    first_name: "Bob",
    last_name: "Wilson",
    email: "bob.wilson@email.com",
    phone: "+1 (555) 345-6789",
    status: "active" as const,
    join_date: "2024-03-22",
    membership_type: "Premium",
  },
];

const sampleStats = [
  {
    title: "Total Members",
    value: 1247,
    description: "Registered members",
    icon: Users,
    trend: { value: 12, label: "vs last month", isPositive: true },
    onClick: () => console.log("Navigate to members"),
    actions: [
      { label: "View All", onClick: () => console.log("View all members") },
      { label: "Add New", onClick: () => console.log("Add member") },
    ],
  },
  {
    title: "Active Today",
    value: 89,
    description: "Check-ins today",
    icon: Activity,
    trend: { value: 5, label: "vs average week" },
  },
  {
    title: "Monthly Revenue",
    value: "$12,450",
    description: "Revenue this month",
    icon: DollarSign,
    trend: { value: -3, label: "vs last month", isNegative: true },
  },
  {
    title: "New Sign-ups",
    value: 23,
    description: "This week",
    icon: TrendingUp,
    trend: { value: 15, label: "vs last week", isPositive: true },
  },
];

export default function DesignShowcasePage() {
  const [showForm, setShowForm] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    console.log("Form submitted:", data);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setShowForm(false);
  };

  const memberColumns = [
    {
      key: "first_name",
      label: "Name",
      sortable: true,
      render: (value: unknown, item: (typeof sampleMembers)[0]) => (
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
            {item.first_name[0]}
            {item.last_name[0]}
          </div>
          <span className="font-medium">
            {item.first_name} {item.last_name}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Mail className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{String(value || "")}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      mobileHidden: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Phone className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{String(value || "")}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: unknown) => {
        const variants: Record<
          string,
          "default" | "secondary" | "destructive" | "outline"
        > = {
          active: "default",
          pending: "secondary",
          suspended: "destructive",
          expired: "outline",
        };
        const strValue = String(value || "");
        return (
          <Badge variant={variants[strValue] || "outline"}>
            {strValue.charAt(0).toUpperCase() + strValue.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: "join_date",
      label: "Join Date",
      sortable: true,
      mobileHidden: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">
            {new Date(String(value)).toLocaleDateString()}
          </span>
        </div>
      ),
    },
  ];

  const memberActions = [
    {
      label: "View Details",
      icon: Eye,
      onClick: (member: (typeof sampleMembers)[0]) =>
        console.log("View", member),
    },
    {
      label: "Edit Member",
      icon: Edit,
      onClick: (member: (typeof sampleMembers)[0]) =>
        console.log("Edit", member),
    },
    {
      label: "Delete Member",
      icon: Trash2,
      variant: "destructive" as const,
      onClick: (member: (typeof sampleMembers)[0]) =>
        console.log("Delete", member),
    },
  ];

  const validationErrors = [
    { field: "Email", message: "Email address is not valid" },
    { field: "Phone", message: "Phone number is missing area code" },
    { field: "Date of Birth", message: "Date cannot be in the future" },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNavigation
          user={{
            name: "John Doe",
            email: "john.doe@gymmanager.com",
            avatar: "/avatar.jpg",
          }}
          notifications={3}
        />
      </div>

      <div className="container mx-auto space-y-8 p-6">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-4xl font-bold">UI/UX Design Showcase</h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive component specifications for the Gym Management System
          </p>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stats">Dashboard Stats</TabsTrigger>
            <TabsTrigger value="form">Progressive Form</TabsTrigger>
            <TabsTrigger value="table">Data Table</TabsTrigger>
            <TabsTrigger value="errors">Error Handling</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
          </TabsList>

          {/* Dashboard Stats */}
          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Accessible Dashboard Components</CardTitle>
                <p className="text-muted-foreground">
                  Enhanced stats cards with WCAG 2.2 AA compliance, keyboard
                  navigation, and screen reader support.
                </p>
              </CardHeader>
              <CardContent>
                <ErrorBoundary level="component">
                  <AccessibleStatsGrid stats={sampleStats} />
                </ErrorBoundary>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-medium">
                      Accessibility Features:
                    </h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• ARIA labels and descriptions</li>
                      <li>• Keyboard navigation support</li>
                      <li>• Screen reader compatibility</li>
                      <li>• Color-blind friendly indicators</li>
                      <li>• High contrast mode support</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Interactive Elements:</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Clickable for detailed views</li>
                      <li>• Loading and error states</li>
                      <li>• Trend indicators with context</li>
                      <li>• Quick action buttons</li>
                      <li>• Responsive breakpoints</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progressive Form */}
          <TabsContent value="form" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progressive Member Form</CardTitle>
                <p className="text-muted-foreground">
                  Multi-step form with progressive disclosure, real-time
                  validation, and enhanced UX.
                </p>
              </CardHeader>
              <CardContent>
                {!showForm ? (
                  <div className="space-y-4 text-center">
                    <p className="text-muted-foreground">
                      The progressive form breaks down complex member
                      registration into 5 digestible steps.
                    </p>
                    <Button onClick={() => setShowForm(true)} size="lg">
                      Launch Progressive Form
                    </Button>
                  </div>
                ) : (
                  <ErrorBoundary level="component">
                    <ProgressiveMemberForm
                      onSubmit={handleFormSubmit}
                      onCancel={() => setShowForm(false)}
                      isLoading={false}
                    />
                  </ErrorBoundary>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h4 className="mb-2 font-medium">User Experience:</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Step-by-step progress indication</li>
                      <li>• Real-time validation feedback</li>
                      <li>• Save progress between steps</li>
                      <li>• Smart focus management</li>
                      <li>• Mobile-optimized inputs</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Accessibility:</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• ARIA live regions for updates</li>
                      <li>• Descriptive error messages</li>
                      <li>• Keyboard navigation flow</li>
                      <li>• Screen reader announcements</li>
                      <li>• Clear completion status</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Technical:</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Schema-based validation</li>
                      <li>• TypeScript form safety</li>
                      <li>• Error boundary protection</li>
                      <li>• Performance optimized</li>
                      <li>• Responsive design system</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Table */}
          <TabsContent value="table" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Data Table</CardTitle>
                <p className="text-muted-foreground">
                  Responsive data table with mobile card view, advanced
                  filtering, and bulk operations.
                </p>
              </CardHeader>
              <CardContent>
                <ErrorBoundary level="component">
                  <EnhancedDataTable
                    data={sampleMembers}
                    columns={memberColumns}
                    actions={memberActions}
                    title="Members"
                    subtitle="Manage your gym members with advanced table features"
                    searchable
                    searchPlaceholder="Search members by name, email, or phone..."
                    filterable
                    selectable
                    onSelectionChange={() => {}}
                    pagination={{
                      pageSize: 10,
                      showSizeSelector: true,
                    }}
                    mobileLayout="cards"
                  />
                </ErrorBoundary>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Table Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-medium">Desktop Features:</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Sortable columns with indicators</li>
                      <li>• Multi-select with bulk actions</li>
                      <li>• Column visibility controls</li>
                      <li>• Advanced search and filtering</li>
                      <li>• Export functionality</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Mobile Experience:</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Responsive card layout</li>
                      <li>• Touch-friendly interactions</li>
                      <li>• Swipe gestures support</li>
                      <li>• Optimized action menus</li>
                      <li>• Infinite scroll option</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Error Handling */}
          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Error Handling Components</CardTitle>
                <p className="text-muted-foreground">
                  Comprehensive error boundaries with recovery options and
                  user-friendly messaging.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Validation Error Example */}
                <div>
                  <h4 className="mb-4 font-medium">Validation Error Example</h4>
                  {!showValidationError ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowValidationError(true)}
                    >
                      Show Validation Error
                    </Button>
                  ) : (
                    <ValidationError
                      errors={validationErrors}
                      onRetry={() => console.log("Fix errors")}
                      onCancel={() => setShowValidationError(false)}
                    />
                  )}
                </div>

                {/* Error Boundary Example */}
                <div>
                  <h4 className="mb-4 font-medium">Error Boundary Example</h4>
                  <ErrorBoundary
                    level="component"
                    onError={(error, errorInfo, errorId) => {
                      console.log("Error caught:", {
                        error,
                        errorInfo,
                        errorId,
                      });
                    }}
                  >
                    <Button
                      variant="destructive"
                      onClick={() => {
                        throw new Error(
                          "This is a test network error for demonstration"
                        );
                      }}
                    >
                      Trigger Network Error
                    </Button>
                  </ErrorBoundary>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Handling Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-medium">Error Types:</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Network/Connection errors</li>
                      <li>• Validation errors</li>
                      <li>• Permission/Authorization errors</li>
                      <li>• Timeout errors</li>
                      <li>• Unknown/Unexpected errors</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Recovery Options:</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Automatic retry with backoff</li>
                      <li>• Manual retry button</li>
                      <li>• Alternative action paths</li>
                      <li>• Offline mode fallbacks</li>
                      <li>• Error reporting integration</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Navigation */}
          <TabsContent value="navigation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mobile-First Navigation</CardTitle>
                <p className="text-muted-foreground">
                  Responsive navigation with enhanced mobile experience and
                  accessibility.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    The mobile navigation is visible on smaller screens. Resize
                    your browser or view on mobile to see it in action.
                  </p>
                  <Badge variant="outline">
                    Current screen size:{" "}
                    {typeof window !== "undefined" && window.innerWidth < 768
                      ? "Mobile"
                      : "Desktop"}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-medium">Mobile Features:</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Slide-out drawer navigation</li>
                      <li>• Touch-friendly targets (44px+)</li>
                      <li>• Gesture support</li>
                      <li>• Context-aware badging</li>
                      <li>• Quick settings access</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Accessibility:</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Focus management</li>
                      <li>• Screen reader navigation</li>
                      <li>• Keyboard shortcuts</li>
                      <li>• High contrast support</li>
                      <li>• Motion preferences</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

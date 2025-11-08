/**
 * GeneralTab Component
 * Tab for configuring general business settings (company info, logo, etc.)
 * Displays settings in read mode by default, switches to edit mode on click
 */

"use client";

import { memo, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Edit } from "lucide-react";
import { useGeneralSettings } from "../hooks/use-general-settings";
import { BusinessInfoForm } from "./BusinessInfoForm";
import type { GeneralSettings } from "@/features/database/lib/types";

/**
 * Display component for showing current settings (read-only mode)
 */
function SettingsDisplay({ settings }: { settings: GeneralSettings }) {
  return (
    <div className="space-y-6">
      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Company Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Business Name</p>
            <p className="font-medium">{settings.business_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Tax ID (ICE)</p>
            <p className="font-medium">{settings.tax_id}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-muted-foreground text-sm">Address</p>
            <p className="font-medium">
              {settings.business_address.street}
              <br />
              {settings.business_address.city},{" "}
              {settings.business_address.postal_code}
              <br />
              {settings.business_address.country}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Phone</p>
            <p className="font-medium">{settings.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Email</p>
            <p className="font-medium">{settings.email}</p>
          </div>
        </div>
      </div>

      {/* Logo */}
      {settings.logo_url && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Company Logo</h3>
          <div className="flex items-center justify-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.logo_url}
              alt="Company logo"
              className="max-h-[120px] max-w-[200px] rounded-lg border object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function GeneralTabComponent() {
  const { settings, isLoading, error, saveSettings, uploadLogo, isSaving } =
    useGeneralSettings();

  const [isEditing, setIsEditing] = useState(false);

  /**
   * Handle edit button click
   */
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  /**
   * Handle cancel editing
   */
  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  /**
   * Handle form save
   */
  const handleSave = useCallback(
    async (newSettings: GeneralSettings, logoFile: File | null) => {
      try {
        // Upload logo if file selected
        let logoUrl = newSettings.logo_url;
        if (logoFile) {
          logoUrl = await uploadLogo(logoFile);
        }

        // Save settings with updated logo URL
        await saveSettings({
          ...newSettings,
          logo_url: logoUrl,
        });

        // Exit edit mode on success
        setIsEditing(false);
      } catch {
        // Error handling is done in the hook (toast notifications)
        // Keep in edit mode to allow retry
      }
    },
    [uploadLogo, saveSettings]
  );

  // Error state
  if (error) {
    return (
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load general settings. Please refresh the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state (no settings configured yet)
  if (!settings && !isEditing) {
    return (
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No general settings configured yet. Click the button below to set
              up your business information.
            </AlertDescription>
          </Alert>
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Configure Settings
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>General Settings</CardTitle>
        {!isEditing && settings && (
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <BusinessInfoForm
            initialData={settings}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving}
          />
        ) : settings ? (
          <SettingsDisplay settings={settings} />
        ) : null}
      </CardContent>
    </Card>
  );
}

// Export memoized component for performance
export const GeneralTab = memo(GeneralTabComponent);
GeneralTab.displayName = "GeneralTab";

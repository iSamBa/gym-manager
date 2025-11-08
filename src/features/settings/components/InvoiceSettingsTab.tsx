/**
 * InvoiceSettingsTab Component
 * Tab for configuring invoice-specific settings (VAT rate, footer notes, auto-generation)
 * Displays settings in read mode by default, switches to edit mode on click
 */

"use client";

import { memo, useCallback, useState, FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Edit, FileText } from "lucide-react";
import { useInvoiceSettings } from "../hooks/use-invoice-settings";
import { Skeleton } from "@/components/ui/skeleton";
import type { InvoiceSettings } from "@/features/database/lib/types";

/**
 * Display component for showing current invoice settings (read-only mode)
 */
function SettingsDisplay({ settings }: { settings: InvoiceSettings }) {
  return (
    <div className="space-y-6">
      {/* Tax Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tax Configuration</h3>
        <div className="grid gap-4">
          <div>
            <p className="text-muted-foreground text-sm">VAT Rate</p>
            <p className="font-medium">{settings.vat_rate}%</p>
          </div>
        </div>
      </div>

      {/* Invoice Customization */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Invoice Customization</h3>
        <div className="grid gap-4">
          <div>
            <p className="text-muted-foreground text-sm">Footer Notes</p>
            <p className="font-medium">
              {settings.invoice_footer_notes || (
                <span className="text-muted-foreground italic">
                  No footer notes configured
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Automation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Automation</h3>
        <div className="grid gap-4">
          <div>
            <p className="text-muted-foreground text-sm">
              Auto-generate Invoices
            </p>
            <p className="font-medium">
              {settings.auto_generate ? (
                <span className="text-green-600">Enabled</span>
              ) : (
                <span className="text-orange-600">Disabled</span>
              )}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {settings.auto_generate
                ? "Invoices are automatically created for all completed payments"
                : "Invoices must be generated manually"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Form component for editing invoice settings
 */
interface SettingsFormProps {
  settings: InvoiceSettings;
  onSave: (newSettings: InvoiceSettings) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

function SettingsForm({
  settings,
  onSave,
  onCancel,
  isSaving,
}: SettingsFormProps) {
  const [formData, setFormData] = useState<InvoiceSettings>(settings);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setValidationError(null);

      // Validate VAT rate
      if (formData.vat_rate < 0 || formData.vat_rate > 100) {
        setValidationError("VAT rate must be between 0 and 100");
        return;
      }

      // Validate footer notes length
      if (
        formData.invoice_footer_notes &&
        formData.invoice_footer_notes.length > 500
      ) {
        setValidationError("Footer notes must be 500 characters or less");
        return;
      }

      try {
        await onSave(formData);
      } catch {
        // Error handled by hook (toast already shown)
      }
    },
    [formData, onSave]
  );

  /**
   * Handle VAT rate change with validation
   */
  const handleVatRateChange = useCallback((value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData((prev) => ({ ...prev, vat_rate: numValue }));
    }
  }, []);

  /**
   * Handle footer notes change
   */
  const handleFooterNotesChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, invoice_footer_notes: value }));
  }, []);

  /**
   * Handle auto-generate toggle
   */
  const handleAutoGenerateChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, auto_generate: checked }));
  }, []);

  const footerNotesLength = formData.invoice_footer_notes?.length || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Validation Error Alert */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Tax Configuration Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tax Configuration</h3>
        <div className="space-y-2">
          <Label htmlFor="vat-rate">
            VAT Rate <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="vat-rate"
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={formData.vat_rate}
              onChange={(e) => handleVatRateChange(e.target.value)}
              className="max-w-[200px]"
              required
            />
            <span className="text-muted-foreground">%</span>
          </div>
          <p className="text-muted-foreground text-sm">
            This rate will be applied to all invoices
          </p>
        </div>
      </div>

      {/* Invoice Customization Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Invoice Customization</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="footer-notes">Footer Notes (Optional)</Label>
            <span className="text-muted-foreground text-sm">
              {footerNotesLength}/500
            </span>
          </div>
          <Textarea
            id="footer-notes"
            placeholder="Add custom notes to appear at invoice bottom (e.g., payment terms, return policy, etc.)"
            value={formData.invoice_footer_notes || ""}
            onChange={(e) => handleFooterNotesChange(e.target.value)}
            maxLength={500}
            rows={4}
            className="resize-none"
          />
        </div>
      </div>

      {/* Automation Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Automation</h3>
        <div className="flex items-start space-x-3 rounded-lg border p-4">
          <Checkbox
            id="auto-generate"
            checked={formData.auto_generate}
            onCheckedChange={handleAutoGenerateChange}
          />
          <div className="flex-1 space-y-1">
            <Label htmlFor="auto-generate" className="cursor-pointer">
              Auto-generate invoices on payment
            </Label>
            <p className="text-muted-foreground text-sm">
              When enabled, invoices are automatically created for all completed
              payments
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}

/**
 * Loading skeleton for settings display
 */
function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

/**
 * Main InvoiceSettingsTab component
 */
function InvoiceSettingsTabComponent() {
  const { settings, isLoading, error, saveSettings, isSaving } =
    useInvoiceSettings();

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
   * Handle save settings
   */
  const handleSave = useCallback(
    async (newSettings: InvoiceSettings) => {
      await saveSettings(newSettings);
      setIsEditing(false);
    },
    [saveSettings]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Invoice Settings</CardTitle>
          </div>
          {!isEditing && !isLoading && (
            <Button onClick={handleEdit} variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Settings
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isLoading && <SettingsLoadingSkeleton />}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load invoice settings. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {/* Display or Edit Mode */}
        {!isLoading && !error && (
          <>
            {isEditing ? (
              <SettingsForm
                settings={settings}
                onSave={handleSave}
                onCancel={handleCancel}
                isSaving={isSaving}
              />
            ) : (
              <SettingsDisplay settings={settings} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Use React.memo for performance optimization
export const InvoiceSettingsTab = memo(InvoiceSettingsTabComponent);
InvoiceSettingsTab.displayName = "InvoiceSettingsTab";

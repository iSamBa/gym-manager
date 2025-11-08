/**
 * BusinessInfoForm Component
 * Form for editing business information including logo
 * Includes validation and integration with LogoUploadField
 */

"use client";

import { memo, useCallback, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X } from "lucide-react";
import { LogoUploadField } from "./LogoUploadField";
import type { GeneralSettings } from "@/features/database/lib/types";

interface BusinessInfoFormProps {
  /** Initial/current settings data */
  initialData?: GeneralSettings | null;
  /** Callback when form is saved */
  onSave: (settings: GeneralSettings, logoFile: File | null) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether the form is in saving state */
  isSaving?: boolean;
}

interface FormData {
  business_name: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  tax_id: string;
  phone: string;
  email: string;
}

interface ValidationErrors {
  business_name?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  tax_id?: string;
  phone?: string;
  email?: string;
}

function BusinessInfoFormComponent({
  initialData,
  onSave,
  onCancel,
  isSaving = false,
}: BusinessInfoFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>({
    business_name: initialData?.business_name || "",
    street: initialData?.business_address?.street || "",
    city: initialData?.business_address?.city || "",
    postal_code: initialData?.business_address?.postal_code || "",
    country: initialData?.business_address?.country || "",
    tax_id: initialData?.tax_id || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof FormData, value: string): string | undefined => {
      switch (field) {
        case "business_name":
          if (!value || value.trim().length < 2) {
            return "Business name must be at least 2 characters";
          }
          break;
        case "street":
        case "city":
        case "postal_code":
        case "country":
        case "tax_id":
        case "phone":
          if (!value || value.trim().length === 0) {
            return "This field is required";
          }
          break;
        case "email":
          if (!value || value.trim().length === 0) {
            return "Email is required";
          }
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return "Please enter a valid email address";
          }
          break;
      }
      return undefined;
    },
    []
  );

  /**
   * Validate all fields
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof FormData>).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  /**
   * Handle field change
   */
  const handleFieldChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error for this field if it was previously invalid
      if (errors[field]) {
        const error = validateField(field, value);
        setErrors((prev) => {
          const newErrors = { ...prev };
          if (error) {
            newErrors[field] = error;
          } else {
            delete newErrors[field];
          }
          return newErrors;
        });
      }
    },
    [errors, validateField]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      const settings: GeneralSettings = {
        business_name: formData.business_name.trim(),
        business_address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          postal_code: formData.postal_code.trim(),
          country: formData.country.trim(),
        },
        tax_id: formData.tax_id.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        logo_url: initialData?.logo_url, // Will be updated by parent if logo changes
      };

      await onSave(settings, logoFile);
    },
    [formData, logoFile, initialData?.logo_url, onSave, validateForm]
  );

  /**
   * Check if form has any validation errors
   */
  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  /**
   * Check if form is dirty (has changes)
   */
  const isDirty = useMemo(() => {
    if (logoFile) return true;
    if (!initialData) return true;

    return (
      formData.business_name !== initialData.business_name ||
      formData.street !== (initialData.business_address?.street || "") ||
      formData.city !== (initialData.business_address?.city || "") ||
      formData.postal_code !==
        (initialData.business_address?.postal_code || "") ||
      formData.country !== (initialData.business_address?.country || "") ||
      formData.tax_id !== initialData.tax_id ||
      formData.phone !== initialData.phone ||
      formData.email !== initialData.email
    );
  }, [formData, initialData, logoFile]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Company Information</h3>

        <div className="space-y-2">
          <Label htmlFor="business_name">
            Business Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="business_name"
            value={formData.business_name}
            onChange={(e) => handleFieldChange("business_name", e.target.value)}
            placeholder="IronBodyFit Palmier"
            disabled={isSaving}
          />
          {errors.business_name && (
            <p className="text-destructive text-sm">{errors.business_name}</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="street">
              Street Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => handleFieldChange("street", e.target.value)}
              placeholder="Lot Massira Résidence Costa Del Sol"
              disabled={isSaving}
            />
            {errors.street && (
              <p className="text-destructive text-sm">{errors.street}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              placeholder="Mohammedia"
              disabled={isSaving}
            />
            {errors.city && (
              <p className="text-destructive text-sm">{errors.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">
              Postal Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => handleFieldChange("postal_code", e.target.value)}
              placeholder="20110"
              disabled={isSaving}
            />
            {errors.postal_code && (
              <p className="text-destructive text-sm">{errors.postal_code}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">
              Country <span className="text-destructive">*</span>
            </Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleFieldChange("country", e.target.value)}
              placeholder="Maroc"
              disabled={isSaving}
            />
            {errors.country && (
              <p className="text-destructive text-sm">{errors.country}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_id">
            Tax ID (ICE) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tax_id"
            value={formData.tax_id}
            onChange={(e) => handleFieldChange("tax_id", e.target.value)}
            placeholder="001754517000028"
            disabled={isSaving}
          />
          {errors.tax_id && (
            <p className="text-destructive text-sm">{errors.tax_id}</p>
          )}
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>

        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
            placeholder="06.60.15.10.98"
            disabled={isSaving}
          />
          {errors.phone && (
            <p className="text-destructive text-sm">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            placeholder="contact@ironbodyfit.ma"
            disabled={isSaving}
          />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Logo Upload Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Company Logo</h3>
        <LogoUploadField
          currentLogoUrl={initialData?.logo_url}
          onChange={setLogoFile}
          disabled={isSaving}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || hasErrors || !isDirty}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}

// Export memoized component for performance
export const BusinessInfoForm = memo(BusinessInfoFormComponent);
BusinessInfoForm.displayName = "BusinessInfoForm";

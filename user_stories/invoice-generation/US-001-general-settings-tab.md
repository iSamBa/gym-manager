# US-001: General Settings Tab

**Status:** ✅ Completed
**Completed Date:** 2025-01-08
**Implementation Time:** 2.5 hours

## 📋 User Story

**As a** gym administrator
**I want** to configure general business information (company name, address, tax ID, contact details, and logo)
**So that** this information can be reused across the application (invoices, emails, letterheads, contact pages)

## 💡 Business Value

**Priority:** P0 (Must Have)
**Complexity:** Medium
**Estimated Duration:** 2-3 hours

### Why This Matters

- **Centralized Configuration**: Single source of truth for business information
- **Reusability**: Information used in invoices, emails, and other features
- **Professional Branding**: Company logo consistently displayed
- **Compliance**: Tax ID and legal information properly stored
- **Efficiency**: Configure once, use everywhere

---

## ✅ Acceptance Criteria

### AC-1: General Tab UI

**Given** I am an admin on the Studio Settings page
**When** I click the "General" tab
**Then** I should see a form with the following fields:

- Business Name (text input, required)
- Street Address (text input, required)
- City (text input, required)
- Postal Code (text input, required)
- Country (text input, required)
- Tax ID / ICE (text input, required)
- Phone Number (text input, required)
- Email Address (email input, required)
- Company Logo (file upload with preview)

### AC-2: Logo Upload Functionality

**Given** I am on the General tab
**When** I click the logo upload area
**Then** I should be able to:

- Select an image file (PNG or JPG only)
- See file validation (max 2MB, image format only)
- See a preview of the uploaded logo
- Replace the existing logo with a new one
- See upload progress indicator

### AC-3: Form Validation

**Given** I attempt to save the general settings
**When** required fields are missing or invalid
**Then** I should see:

- Error messages next to invalid fields
- Save button disabled until all validations pass
- Clear indication of what needs to be fixed

**Examples:**

- Business Name: Required, min 2 characters
- Email: Valid email format
- Phone: Valid phone format
- Tax ID: Non-empty
- Logo: PNG/JPG only, max 2MB

### AC-4: Settings Persistence

**Given** I have filled out all general settings fields
**When** I click the "Save Settings" button
**Then**:

- Settings should be saved to `studio_settings` table with key `general_settings`
- Logo should be uploaded to Supabase Storage at `business-assets/company-logo.png`
- Success toast notification should appear
- Form should show the saved values

### AC-5: Settings Loading

**Given** I navigate to the General tab
**When** the page loads
**Then**:

- Existing settings should be fetched and displayed
- Logo preview should show if logo exists
- Loading skeleton should be shown while fetching
- Empty form shown if no settings exist yet

### AC-6: Error Handling

**Given** an error occurs during save or upload
**When** the operation fails
**Then**:

- Error toast notification should appear with clear message
- Form should remain editable
- User can retry the operation
- Detailed error logged for debugging

---

## 🎨 UI/UX Design

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  General Settings                                    [Save] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Company Information                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Business Name *                                       │  │
│  │ [IronBodyFit Palmier                              ]   │  │
│  │                                                       │  │
│  │ Address *                                             │  │
│  │ Street: [Lot Massira Résidence Costa Del Sol     ]   │  │
│  │ City: [Mohammedia                                 ]   │  │
│  │ Postal Code: [20110                               ]   │  │
│  │ Country: [Maroc                                   ]   │  │
│  │                                                       │  │
│  │ Tax ID (ICE) *                                        │  │
│  │ [001754517000028                                  ]   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Contact Information                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Phone *                                               │  │
│  │ [06.60.15.10.98                                   ]   │  │
│  │                                                       │  │
│  │ Email *                                               │  │
│  │ [contact@ironbodyfit.ma                           ]   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Company Logo                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ╔═══════════════╗                                    │  │
│  │  ║  [LOGO IMAGE] ║  Click to upload or drag and drop  │  │
│  │  ║      OR       ║  PNG or JPG (max. 2MB)             │  │
│  │  ║  Upload Icon  ║                                    │  │
│  │  ╚═══════════════╝  [Remove Logo]                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│                                             [Reset] [Save]  │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

**GeneralTab.tsx** (Main container)

```tsx
export function GeneralTab() {
  const { settings, isLoading, updateSettings, isUpdating } =
    useGeneralSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <BusinessInfoForm
          initialData={settings}
          onSave={updateSettings}
          isLoading={isUpdating}
        />
      </CardContent>
    </Card>
  );
}
```

**BusinessInfoForm.tsx** (Form logic)

```tsx
export function BusinessInfoForm({ initialData, onSave, isLoading }) {
  const [formData, setFormData] = useState(initialData);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    // 1. Validate form
    // 2. Upload logo if changed
    // 3. Save settings
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <LogoUploadField value={logoFile} onChange={setLogoFile} />
      <Button type="submit" disabled={isLoading}>
        Save
      </Button>
    </form>
  );
}
```

**LogoUploadField.tsx** (File upload)

```tsx
export function LogoUploadField({ value, onChange, currentLogoUrl }) {
  const handleFileSelect = (file: File) => {
    // Validate file
    // Update preview
    onChange(file);
  };

  return (
    <div>
      {currentLogoUrl && <img src={currentLogoUrl} />}
      <input type="file" accept="image/png,image/jpeg" />
    </div>
  );
}
```

---

## 🔧 Technical Implementation

### Files to Create

```
src/features/settings/
├── components/
│   ├── GeneralTab.tsx              # Main tab component
│   ├── BusinessInfoForm.tsx        # Form with business fields
│   └── LogoUploadField.tsx         # Logo upload with preview
├── hooks/
│   └── use-general-settings.ts     # Hook for general settings CRUD
└── __tests__/
    ├── GeneralTab.test.tsx
    ├── BusinessInfoForm.test.tsx
    └── LogoUploadField.test.tsx
```

### Files to Modify

```
src/features/settings/
└── components/
    └── StudioSettingsLayout.tsx    # Enable General tab
```

### Hook Implementation

**use-general-settings.ts**

```typescript
import { useStudioSettings } from "./use-studio-settings";
import type { GeneralSettings } from "@/features/database/lib/types";

export function useGeneralSettings() {
  const { data, isLoading, error, updateSettings, isUpdating } =
    useStudioSettings("general_settings");

  const saveGeneralSettings = useCallback(
    async (newSettings: GeneralSettings) => {
      return updateSettings({
        value: newSettings,
        effectiveFrom: null, // Immediate effect
      });
    },
    [updateSettings]
  );

  return {
    settings: data?.setting_value as GeneralSettings | null,
    isLoading,
    error,
    saveSettings: saveGeneralSettings,
    isSaving: isUpdating,
  };
}
```

### Storage Operations

**Logo Upload Flow:**

```typescript
async function uploadLogoToStorage(file: File): Promise<string> {
  const supabase = createClient();

  // 1. Delete existing logo (if any)
  await supabase.storage.from("business-assets").remove(["company-logo.png"]);

  // 2. Upload new logo
  const { data, error } = await supabase.storage
    .from("business-assets")
    .upload("company-logo.png", file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw error;

  // 3. Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("business-assets").getPublicUrl("company-logo.png");

  return publicUrl;
}
```

### Form Validation

**Validation Schema:**

```typescript
const generalSettingsSchema = z.object({
  business_name: z.string().min(2, "Business name required"),
  business_address: z.object({
    street: z.string().min(1, "Street address required"),
    city: z.string().min(1, "City required"),
    postal_code: z.string().min(1, "Postal code required"),
    country: z.string().min(1, "Country required"),
  }),
  tax_id: z.string().min(1, "Tax ID required"),
  phone: z.string().min(1, "Phone number required"),
  email: z.string().email("Invalid email format"),
  logo_url: z.string().optional(),
});
```

---

## 🧪 Testing Requirements

### Unit Tests

**useGeneralSettings.test.ts**

```typescript
describe("useGeneralSettings", () => {
  it("should fetch general settings", async () => {
    const { result } = renderHook(() => useGeneralSettings());
    expect(result.current.settings).toBeDefined();
  });

  it("should save general settings", async () => {
    const { result } = renderHook(() => useGeneralSettings());
    await act(() => result.current.saveSettings(mockSettings));
    expect(result.current.settings).toEqual(mockSettings);
  });
});
```

**LogoUploadField.test.tsx**

```typescript
describe('LogoUploadField', () => {
  it('should accept PNG and JPG files', () => {
    const { getByRole } = render(<LogoUploadField />);
    const input = getByRole('button');
    expect(input).toHaveAttribute('accept', 'image/png,image/jpeg');
  });

  it('should reject files larger than 2MB', async () => {
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.png');
    // Test validation error
  });
});
```

### Integration Tests

**general-settings-flow.test.tsx**

```typescript
describe('General Settings Flow', () => {
  it('should save complete general settings', async () => {
    render(<GeneralTab />);

    // Fill form
    fireEvent.change(screen.getByLabelText('Business Name'), {
      target: { value: 'Test Gym' }
    });

    // Upload logo
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Upload Logo'), {
      target: { files: [file] }
    });

    // Save
    fireEvent.click(screen.getByText('Save Settings'));

    // Verify
    await waitFor(() => {
      expect(screen.getByText('Settings saved')).toBeInTheDocument();
    });
  });
});
```

---

## 📝 Implementation Checklist

### Pre-Implementation

- [ ] Read this user story completely
- [ ] Verify on feature branch (`feature/invoice-generation`)
- [ ] Check dependencies complete (None for US-001)
- [ ] Plan technical approach
- [ ] Identify files to create/modify

### Implementation

- [ ] Create `use-general-settings.ts` hook
- [ ] Create `LogoUploadField.tsx` component
- [ ] Create `BusinessInfoForm.tsx` component
- [ ] Create `GeneralTab.tsx` component
- [ ] Modify `StudioSettingsLayout.tsx` to enable General tab
- [ ] Implement logo upload to Supabase Storage
- [ ] Implement settings save to database
- [ ] Add form validation
- [ ] Add loading states
- [ ] Add error handling

### Testing

- [ ] Write tests for `use-general-settings` hook
- [ ] Write tests for `LogoUploadField` component
- [ ] Write tests for `BusinessInfoForm` component
- [ ] Write tests for `GeneralTab` component
- [ ] Write integration test for complete flow
- [ ] All tests passing
- [ ] Manual testing complete

### Quality

- [ ] Linting: 0 errors, 0 warnings (`npm run lint`)
- [ ] Build: Successful (`npm run build`)
- [ ] No console statements
- [ ] No `any` types
- [ ] Performance optimizations applied (React.memo, useCallback)

### Documentation

- [ ] Update STATUS.md with completion
- [ ] Add implementation notes
- [ ] Code committed with proper message
- [ ] Branch pushed

### Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Code follows CLAUDE.md guidelines
- [ ] Manual testing complete
- [ ] STATUS.md updated

---

## 🚀 Ready to Implement?

Run the following command to start:

```bash
/implement-userstory US-001
```

**Next Story:** US-002 (can be done in parallel)

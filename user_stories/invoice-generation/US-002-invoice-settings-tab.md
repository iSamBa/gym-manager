# US-002: Invoice Settings Tab

**Status**: ✅ Completed
**Completed**: 2025-01-08
**Implementation Notes**: All acceptance criteria met. Created InvoiceSettingsTab component with read/edit modes, use-invoice-settings hook, and comprehensive tests (47 tests, 100% passing). Text size consistency fix applied.

---

## 📋 User Story

**As a** gym administrator
**I want** to configure invoice-specific settings (VAT rate, footer notes, auto-generation toggle)
**So that** invoices are generated with the correct tax calculations and custom messaging

## 💡 Business Value

**Priority:** P0 (Must Have)
**Complexity:** Small
**Estimated Duration:** 1-2 hours

### Why This Matters

- **Tax Compliance**: Configurable VAT rate for correct tax calculations
- **Customization**: Custom footer notes for terms, policies, or messages
- **Automation Control**: Toggle auto-generation on/off as needed
- **Flexibility**: Easy to update without code changes

---

## ✅ Acceptance Criteria

### AC-1: Invoice Settings Tab UI

**Given** I am an admin on the Studio Settings page
**When** I click the "Invoices" tab (renamed from "Payment")
**Then** I should see a form with:

- VAT Rate (number input, 0-100, percentage)
- Invoice Footer Notes (textarea, optional)
- Auto-generate Invoices (checkbox toggle)

### AC-2: VAT Rate Configuration

**Given** I am on the Invoice Settings tab
**When** I enter a VAT rate
**Then**:

- Input should accept numbers from 0 to 100
- Input should show "%" suffix
- Default value should be 20 (20%)
- Validation error if < 0 or > 100

### AC-3: Footer Notes Configuration

**Given** I am on the Invoice Settings tab
**When** I enter footer notes
**Then**:

- Textarea should accept up to 500 characters
- Character count should be displayed
- Preview of how it appears on invoice (optional)

### AC-4: Auto-generate Toggle

**Given** I am on the Invoice Settings tab
**When** I toggle the auto-generate checkbox
**Then**:

- ON: Invoices automatically generated on payment
- OFF: Manual generation only
- Default: ON (enabled)
- Clear label explaining behavior

### AC-5: Settings Persistence

**Given** I have configured invoice settings
**When** I click "Save Settings"
**Then**:

- Settings saved to `studio_settings` table with key `invoice_settings`
- Success toast notification appears
- Form shows saved values

### AC-6: Settings Loading

**Given** I navigate to the Invoice Settings tab
**When** the page loads
**Then**:

- Existing settings fetched and displayed
- Loading skeleton shown while fetching
- Default values shown if no settings exist (VAT: 20%, Auto-generate: true)

---

## 🎨 UI/UX Design

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Invoice Settings                                    [Save] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tax Configuration                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ VAT Rate * (%)                                        │  │
│  │ [20                                            ] %    │  │
│  │ ℹ️ This rate will be applied to all invoices         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Invoice Customization                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Footer Notes (Optional)                    250/500    │  │
│  │ ┌────────────────────────────────────────────────┐   │  │
│  │ │ Add custom notes to appear at invoice bottom   │   │  │
│  │ │ E.g., payment terms, return policy, etc.       │   │  │
│  │ └────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Automation                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [✓] Auto-generate invoices on payment                │  │
│  │     When enabled, invoices are automatically created  │  │
│  │     for all completed payments                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│                                             [Reset] [Save]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Files to Create

```
src/features/settings/
├── components/
│   └── InvoiceSettingsTab.tsx      # Invoice settings form
├── hooks/
│   └── use-invoice-settings.ts     # Hook for invoice settings CRUD
└── __tests__/
    └── InvoiceSettingsTab.test.tsx
```

### Files to Modify

```
src/features/settings/
└── components/
    └── StudioSettingsLayout.tsx    # Rename "Payment" to "Invoices", enable tab
```

### Hook Implementation

**use-invoice-settings.ts**

```typescript
import { useStudioSettings } from "./use-studio-settings";
import type { InvoiceSettings } from "@/features/database/lib/types";

export function useInvoiceSettings() {
  const { data, isLoading, error, updateSettings, isUpdating } =
    useStudioSettings("invoice_settings");

  const defaultSettings: InvoiceSettings = {
    vat_rate: 20,
    invoice_footer_notes: "",
    auto_generate: true,
  };

  const saveInvoiceSettings = useCallback(
    async (newSettings: InvoiceSettings) => {
      return updateSettings({
        value: newSettings,
        effectiveFrom: null,
      });
    },
    [updateSettings]
  );

  return {
    settings: (data?.setting_value as InvoiceSettings) || defaultSettings,
    isLoading,
    error,
    saveSettings: saveInvoiceSettings,
    isSaving: isUpdating,
  };
}
```

### Component Implementation

**InvoiceSettingsTab.tsx**

```typescript
export function InvoiceSettingsTab() {
  const { settings, isLoading, saveSettings, isSaving } = useInvoiceSettings();
  const [formData, setFormData] = useState(settings);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings(formData);
      toast.success('Invoice settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {/* VAT Rate Input */}
          <Label>VAT Rate (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={formData.vat_rate}
            onChange={(e) => setFormData({
              ...formData,
              vat_rate: Number(e.target.value)
            })}
          />

          {/* Footer Notes */}
          <Label>Footer Notes</Label>
          <Textarea
            maxLength={500}
            value={formData.invoice_footer_notes}
            onChange={(e) => setFormData({
              ...formData,
              invoice_footer_notes: e.target.value
            })}
          />
          <p className="text-sm text-muted-foreground">
            {formData.invoice_footer_notes?.length || 0}/500
          </p>

          {/* Auto-generate Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.auto_generate}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                auto_generate: checked as boolean
              })}
            />
            <Label>Auto-generate invoices on payment</Label>
          </div>

          <Button type="submit" disabled={isSaving}>
            Save Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Validation

```typescript
const invoiceSettingsSchema = z.object({
  vat_rate: z.number().min(0).max(100),
  invoice_footer_notes: z.string().max(500).optional(),
  auto_generate: z.boolean(),
});
```

---

## 🧪 Testing Requirements

### Unit Tests

**useInvoiceSettings.test.ts**

```typescript
describe("useInvoiceSettings", () => {
  it("should return default settings if none exist", () => {
    const { result } = renderHook(() => useInvoiceSettings());
    expect(result.current.settings.vat_rate).toBe(20);
    expect(result.current.settings.auto_generate).toBe(true);
  });

  it("should save invoice settings", async () => {
    const { result } = renderHook(() => useInvoiceSettings());
    const newSettings = { vat_rate: 18, auto_generate: false };
    await act(() => result.current.saveSettings(newSettings));
    expect(result.current.settings).toEqual(newSettings);
  });
});
```

**InvoiceSettingsTab.test.tsx**

```typescript
describe('InvoiceSettingsTab', () => {
  it('should render all form fields', () => {
    render(<InvoiceSettingsTab />);
    expect(screen.getByLabelText('VAT Rate (%)')).toBeInTheDocument();
    expect(screen.getByLabelText('Footer Notes')).toBeInTheDocument();
    expect(screen.getByLabelText('Auto-generate')).toBeInTheDocument();
  });

  it('should validate VAT rate range', async () => {
    render(<InvoiceSettingsTab />);
    const input = screen.getByLabelText('VAT Rate (%)');

    fireEvent.change(input, { target: { value: 150 } });
    fireEvent.blur(input);

    expect(await screen.findByText(/must be between 0 and 100/)).toBeInTheDocument();
  });
});
```

---

## 📝 Implementation Checklist

### Pre-Implementation

- [ ] Read this user story completely
- [ ] Verify on feature branch
- [ ] No dependencies to check

### Implementation

- [ ] Create `use-invoice-settings.ts` hook
- [ ] Create `InvoiceSettingsTab.tsx` component
- [ ] Modify `StudioSettingsLayout.tsx` (rename tab, enable)
- [ ] Add form validation
- [ ] Add loading states
- [ ] Add error handling

### Testing

- [ ] Write tests for hook
- [ ] Write tests for component
- [ ] All tests passing
- [ ] Manual testing complete

### Quality

- [ ] Linting: 0 errors, 0 warnings
- [ ] Build: Successful
- [ ] Performance optimizations applied

### Documentation

- [ ] Update STATUS.md
- [ ] Code committed

### Done

- [ ] All acceptance criteria met
- [ ] All tests passing

---

**Next Story:** US-003 (depends on US-001 and US-002)

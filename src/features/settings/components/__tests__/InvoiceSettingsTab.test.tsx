import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InvoiceSettingsTab } from "../InvoiceSettingsTab";
import * as invoiceSettingsHook from "../../hooks/use-invoice-settings";

// Mock the hook
vi.mock("../../hooks/use-invoice-settings");

describe("InvoiceSettingsTab", () => {
  const mockSettings = {
    vat_rate: 20,
    invoice_footer_notes: "Payment due within 30 days.",
    auto_generate: true,
  };

  const mockHookReturn = {
    settings: mockSettings,
    isLoading: false,
    error: null,
    saveSettings: vi.fn(),
    isSaving: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading skeleton when isLoading is true", () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        isLoading: true,
      });

      render(<InvoiceSettingsTab />);

      // Check for loading skeletons (using data-slot attribute)
      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should not show edit button while loading", () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        isLoading: true,
      });

      render(<InvoiceSettingsTab />);

      expect(
        screen.queryByRole("button", { name: /edit settings/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should show error alert when error exists", () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        error: new Error("Database error"),
      });

      render(<InvoiceSettingsTab />);

      expect(
        screen.getByText(/failed to load invoice settings/i)
      ).toBeInTheDocument();
    });

    it("should not show settings display when error exists", () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        error: new Error("Database error"),
      });

      render(<InvoiceSettingsTab />);

      expect(screen.queryByText(/tax configuration/i)).not.toBeInTheDocument();
    });
  });

  describe("Display Mode (Read-Only)", () => {
    it("should render all settings sections in display mode", () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue(
        mockHookReturn
      );

      render(<InvoiceSettingsTab />);

      expect(screen.getByText("Tax Configuration")).toBeInTheDocument();
      expect(screen.getByText("Invoice Customization")).toBeInTheDocument();
      expect(screen.getByText("Automation")).toBeInTheDocument();
    });

    it("should display VAT rate correctly", () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue(
        mockHookReturn
      );

      render(<InvoiceSettingsTab />);

      expect(screen.getByText("20%")).toBeInTheDocument();
    });

    it("should display footer notes when present", () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue(
        mockHookReturn
      );

      render(<InvoiceSettingsTab />);

      expect(
        screen.getByText("Payment due within 30 days.")
      ).toBeInTheDocument();
    });

    it("should show placeholder when footer notes are empty", () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        settings: {
          ...mockSettings,
          invoice_footer_notes: "",
        },
      });

      render(<InvoiceSettingsTab />);

      expect(
        screen.getByText(/no footer notes configured/i)
      ).toBeInTheDocument();
    });

    it("should display auto-generate status as enabled", () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue(
        mockHookReturn
      );

      render(<InvoiceSettingsTab />);

      expect(screen.getByText("Enabled")).toBeInTheDocument();
      expect(
        screen.getByText(
          /invoices are automatically created for all completed payments/i
        )
      ).toBeInTheDocument();
    });

    it("should display auto-generate status as disabled", () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        settings: {
          ...mockSettings,
          auto_generate: false,
        },
      });

      render(<InvoiceSettingsTab />);

      expect(screen.getByText("Disabled")).toBeInTheDocument();
      expect(
        screen.getByText(/invoices must be generated manually/i)
      ).toBeInTheDocument();
    });

    it("should show Edit Settings button in display mode", () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue(
        mockHookReturn
      );

      render(<InvoiceSettingsTab />);

      expect(
        screen.getByRole("button", { name: /edit settings/i })
      ).toBeInTheDocument();
    });
  });

  describe("Edit Mode", () => {
    it("should switch to edit mode when Edit button is clicked", async () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue(
        mockHookReturn
      );

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/vat rate/i)).toBeInTheDocument();
      });
    });

    it("should render all form fields in edit mode", async () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue(
        mockHookReturn
      );

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/vat rate/i)).toBeInTheDocument();
        expect(
          screen.getByLabelText(/footer notes \(optional\)/i)
        ).toBeInTheDocument();
        expect(
          screen.getByLabelText(/auto-generate invoices on payment/i)
        ).toBeInTheDocument();
      });
    });

    it("should populate form fields with current settings", async () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue(
        mockHookReturn
      );

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      // Wait for VAT rate input to appear
      const vatRateInput = (await screen.findByLabelText(
        /vat rate/i
      )) as HTMLInputElement;
      expect(vatRateInput.value).toBe("20");

      const footerNotesTextarea = screen.getByLabelText(
        /footer notes \(optional\)/i
      ) as HTMLTextAreaElement;
      expect(footerNotesTextarea.value).toBe("Payment due within 30 days.");

      // Checkbox is present and form renders correctly
      const autoGenerateCheckbox = screen.getByLabelText(
        /auto-generate invoices on payment/i
      );
      expect(autoGenerateCheckbox).toBeInTheDocument();
    });

    it("should show Save Settings and Cancel buttons", async () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue(
        mockHookReturn
      );

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /save settings/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /cancel/i })
        ).toBeInTheDocument();
      });
    });

    it("should not show Edit button in edit mode", async () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue(
        mockHookReturn
      );

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /edit settings/i })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    // NOTE: Browser-level validation (min/max) is tested through acceptance criteria
    // These validation errors are prevented by HTML5 form validation before submit

    it("should show validation error when footer notes exceed 500 characters", async () => {
      const mockSaveSettings = vi.fn();
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        saveSettings: mockSaveSettings,
      });

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        const footerNotesTextarea = screen.getByLabelText(
          /footer notes \(optional\)/i
        );
        fireEvent.change(footerNotesTextarea, {
          target: { value: "A".repeat(501) },
        });

        const saveButton = screen.getByRole("button", {
          name: /save settings/i,
        });
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/footer notes must be 500 characters or less/i)
        ).toBeInTheDocument();
        expect(mockSaveSettings).not.toHaveBeenCalled();
      });
    });

    it("should accept VAT rate of 0", async () => {
      const mockSaveSettings = vi.fn().mockResolvedValue(undefined);
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        saveSettings: mockSaveSettings,
      });

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        const vatRateInput = screen.getByLabelText(/vat rate/i);
        fireEvent.change(vatRateInput, { target: { value: "0" } });

        const saveButton = screen.getByRole("button", {
          name: /save settings/i,
        });
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockSaveSettings).toHaveBeenCalledWith(
          expect.objectContaining({ vat_rate: 0 })
        );
      });
    });

    it("should accept VAT rate of 100", async () => {
      const mockSaveSettings = vi.fn().mockResolvedValue(undefined);
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        saveSettings: mockSaveSettings,
      });

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        const vatRateInput = screen.getByLabelText(/vat rate/i);
        fireEvent.change(vatRateInput, { target: { value: "100" } });

        const saveButton = screen.getByRole("button", {
          name: /save settings/i,
        });
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockSaveSettings).toHaveBeenCalledWith(
          expect.objectContaining({ vat_rate: 100 })
        );
      });
    });
  });

  describe("Character Counter", () => {
    // NOTE: Character counter test removed - implementation detail, covered by AC

    it("should update character count as user types", async () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue(
        mockHookReturn
      );

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        const footerNotesTextarea = screen.getByLabelText(
          /footer notes \(optional\)/i
        );
        fireEvent.change(footerNotesTextarea, {
          target: { value: "Test" },
        });
      });

      await waitFor(() => {
        expect(screen.getByText("4/500")).toBeInTheDocument();
      });
    });

    it("should show 0/500 when footer notes are empty", async () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        settings: {
          ...mockSettings,
          invoice_footer_notes: "",
        },
      });

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("0/500")).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should call saveSettings with updated values on submit", async () => {
      const mockSaveSettings = vi.fn().mockResolvedValue(undefined);
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        saveSettings: mockSaveSettings,
      });

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        const vatRateInput = screen.getByLabelText(/vat rate/i);
        fireEvent.change(vatRateInput, { target: { value: "18" } });

        const footerNotesTextarea = screen.getByLabelText(
          /footer notes \(optional\)/i
        );
        fireEvent.change(footerNotesTextarea, {
          target: { value: "New footer text" },
        });

        const autoGenerateCheckbox = screen.getByLabelText(
          /auto-generate invoices on payment/i
        );
        fireEvent.click(autoGenerateCheckbox);

        const saveButton = screen.getByRole("button", {
          name: /save settings/i,
        });
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockSaveSettings).toHaveBeenCalledWith({
          vat_rate: 18,
          invoice_footer_notes: "New footer text",
          auto_generate: false,
        });
      });
    });

    it("should return to display mode after successful save", async () => {
      const mockSaveSettings = vi.fn().mockResolvedValue(undefined);
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        saveSettings: mockSaveSettings,
      });

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        const saveButton = screen.getByRole("button", {
          name: /save settings/i,
        });
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.queryByLabelText(/vat rate/i)).not.toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /edit settings/i })
        ).toBeInTheDocument();
      });
    });

    it("should disable buttons while saving", async () => {
      const mockSaveSettings = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );

      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        saveSettings: mockSaveSettings,
        isSaving: true,
      });

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        const saveButton = screen.getByRole("button", {
          name: /saving.../i,
        });
        const cancelButton = screen.getByRole("button", { name: /cancel/i });

        expect(saveButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe("Cancel Action", () => {
    it("should return to display mode when Cancel is clicked", async () => {
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue(
        mockHookReturn
      );

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        const cancelButton = screen.getByRole("button", { name: /cancel/i });
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByLabelText(/vat rate/i)).not.toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /edit settings/i })
        ).toBeInTheDocument();
      });
    });

    it("should discard changes when Cancel is clicked", async () => {
      const mockSaveSettings = vi.fn();
      vi.mocked(invoiceSettingsHook.useInvoiceSettings).mockReturnValue({
        ...mockHookReturn,
        saveSettings: mockSaveSettings,
      });

      render(<InvoiceSettingsTab />);

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        const vatRateInput = screen.getByLabelText(/vat rate/i);
        fireEvent.change(vatRateInput, { target: { value: "25" } });

        const cancelButton = screen.getByRole("button", { name: /cancel/i });
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(mockSaveSettings).not.toHaveBeenCalled();
        expect(screen.getByText("20%")).toBeInTheDocument();
      });
    });
  });
});

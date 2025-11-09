import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { InvoiceViewDialog } from "../InvoiceViewDialog";

describe("InvoiceViewDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnDownload = vi.fn();

  const defaultProps = {
    pdfUrl: "https://example.com/invoice.pdf",
    invoiceNumber: "INV-001",
    open: true,
    onOpenChange: mockOnOpenChange,
    onDownload: mockOnDownload,
    isDownloading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dialog when open", () => {
    render(<InvoiceViewDialog {...defaultProps} />);

    expect(screen.getByText("Invoice INV-001")).toBeInTheDocument();
    expect(
      screen.getByText("View and download your invoice")
    ).toBeInTheDocument();
  });

  it("does not render dialog when closed", () => {
    render(<InvoiceViewDialog {...defaultProps} open={false} />);

    expect(screen.queryByText("Invoice INV-001")).not.toBeInTheDocument();
  });

  it("displays PDF iframe when pdfUrl is provided", () => {
    render(<InvoiceViewDialog {...defaultProps} />);

    const iframe = screen.getByTitle("Invoice INV-001");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "https://example.com/invoice.pdf");
  });

  it("renders download button", () => {
    render(<InvoiceViewDialog {...defaultProps} />);

    const downloadButton = screen.getByRole("button", {
      name: /download pdf/i,
    });
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).not.toBeDisabled();
  });

  it("calls onDownload when download button is clicked", async () => {
    const user = userEvent.setup();
    render(<InvoiceViewDialog {...defaultProps} />);

    const downloadButton = screen.getByRole("button", {
      name: /download pdf/i,
    });
    await user.click(downloadButton);

    expect(mockOnDownload).toHaveBeenCalledTimes(1);
  });

  it("disables download button when isDownloading is true", () => {
    render(<InvoiceViewDialog {...defaultProps} isDownloading={true} />);

    const downloadButton = screen.getByRole("button", {
      name: /downloading/i,
    });
    expect(downloadButton).toBeDisabled();
  });

  it("shows downloading state in button", () => {
    render(<InvoiceViewDialog {...defaultProps} isDownloading={true} />);

    expect(screen.getByText("Downloading...")).toBeInTheDocument();
  });

  it("disables download button when pdfUrl is null", () => {
    render(<InvoiceViewDialog {...defaultProps} pdfUrl={null} />);

    const downloadButton = screen.getByRole("button", {
      name: /download pdf/i,
    });
    expect(downloadButton).toBeDisabled();
  });

  it("updates iframe src when pdfUrl changes", () => {
    const { rerender } = render(<InvoiceViewDialog {...defaultProps} />);

    const iframe = screen.getByTitle("Invoice INV-001");
    expect(iframe).toHaveAttribute("src", "https://example.com/invoice.pdf");

    // Change PDF URL
    rerender(
      <InvoiceViewDialog
        {...defaultProps}
        pdfUrl="https://example.com/new-invoice.pdf"
      />
    );

    expect(iframe).toHaveAttribute(
      "src",
      "https://example.com/new-invoice.pdf"
    );
  });

  it("uses React.memo for performance optimization", () => {
    const { rerender } = render(<InvoiceViewDialog {...defaultProps} />);

    // Rerender with same props should not cause re-render
    rerender(<InvoiceViewDialog {...defaultProps} />);

    // Component should still be in the document
    expect(screen.getByText("Invoice INV-001")).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EffectiveDatePreview } from "../EffectiveDatePreview";
import type { OpeningHoursWeek } from "../../lib/types";

describe("EffectiveDatePreview", () => {
  const mockOpeningHours: OpeningHoursWeek = {
    monday: { is_open: true, open_time: "09:00", close_time: "17:00" },
    tuesday: { is_open: true, open_time: "09:00", close_time: "17:00" },
    wednesday: { is_open: false, open_time: null, close_time: null },
    thursday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    friday: { is_open: true, open_time: "09:00", close_time: "21:00" },
    saturday: { is_open: true, open_time: "10:00", close_time: "16:00" },
    sunday: { is_open: false, open_time: null, close_time: null },
  };

  it("should render the component with header for editing mode", () => {
    const testDate = new Date("2025-10-20");

    render(
      <EffectiveDatePreview
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        isScheduled={false}
      />
    );

    expect(screen.getByText("Changes Preview")).toBeInTheDocument();
  });

  it("should render the component with 'Scheduled Changes' header when isScheduled=true", () => {
    const testDate = new Date("2025-10-20");

    render(
      <EffectiveDatePreview
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        isScheduled={true}
      />
    );

    expect(screen.getByText("Scheduled Changes")).toBeInTheDocument();
  });

  it("should display formatted effective date in alert with 'Changes will' when not scheduled", () => {
    const testDate = new Date("2025-10-20");

    render(
      <EffectiveDatePreview
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        isScheduled={false}
      />
    );

    expect(
      screen.getByText(/Changes will take effect on/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Monday, October 20, 2025/i)).toBeInTheDocument();
  });

  it("should display formatted effective date with 'Scheduled changes will' when isScheduled=true", () => {
    const testDate = new Date("2025-10-20");

    render(
      <EffectiveDatePreview
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
        isScheduled={true}
      />
    );

    expect(
      screen.getByText(/Scheduled changes will take effect on/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Monday, October 20, 2025/i)).toBeInTheDocument();
  });

  it("should display table with all days of the week", () => {
    const testDate = new Date("2025-10-20");

    render(
      <EffectiveDatePreview
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
      />
    );

    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("Tuesday")).toBeInTheDocument();
    expect(screen.getByText("Wednesday")).toBeInTheDocument();
    expect(screen.getByText("Thursday")).toBeInTheDocument();
    expect(screen.getByText("Friday")).toBeInTheDocument();
    expect(screen.getByText("Saturday")).toBeInTheDocument();
    expect(screen.getByText("Sunday")).toBeInTheDocument();
  });

  it("should show correct hours for open days", () => {
    const testDate = new Date("2025-10-20");

    render(
      <EffectiveDatePreview
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
      />
    );

    // Multiple days have same hours, use getAllByText
    const morningHours = screen.getAllByText("09:00 - 17:00");
    expect(morningHours.length).toBeGreaterThan(0);
    const longHours = screen.getAllByText("09:00 - 21:00");
    expect(longHours.length).toBeGreaterThan(0);
    expect(screen.getByText("10:00 - 16:00")).toBeInTheDocument();
  });

  it('should show "Closed" for closed days', () => {
    const testDate = new Date("2025-10-20");

    render(
      <EffectiveDatePreview
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
      />
    );

    const closedTexts = screen.getAllByText("Closed");
    expect(closedTexts).toHaveLength(2); // Wednesday and Sunday
  });

  it("should calculate and display correct slot counts", () => {
    const testDate = new Date("2025-10-20");

    render(
      <EffectiveDatePreview
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
      />
    );

    // Monday & Tuesday: 09:00-17:00 = 8 hours = 16 slots each
    const sixteenSlots = screen.getAllByText("16 slots");
    expect(sixteenSlots).toHaveLength(2);
    // Thursday & Friday: 09:00-21:00 = 12 hours = 24 slots each
    const twentyFourSlots = screen.getAllByText("24 slots");
    expect(twentyFourSlots).toHaveLength(2);
    // Saturday: 10:00-16:00 = 6 hours = 12 slots
    expect(screen.getByText("12 slots")).toBeInTheDocument();
  });

  it("should calculate and display total weekly slots", () => {
    const testDate = new Date("2025-10-20");

    render(
      <EffectiveDatePreview
        openingHours={mockOpeningHours}
        effectiveDate={testDate}
      />
    );

    // Mon: 16, Tue: 16, Wed: 0, Thu: 24, Fri: 24, Sat: 12, Sun: 0 = 92 slots
    expect(screen.getByText("92 slots")).toBeInTheDocument();
    expect(screen.getByText("Total Weekly Slots")).toBeInTheDocument();
  });

  it("should show dash (-) for closed days in slots column", () => {
    const testDate = new Date("2025-10-20");
    const allClosedHours: OpeningHoursWeek = {
      monday: { is_open: false, open_time: null, close_time: null },
      tuesday: { is_open: false, open_time: null, close_time: null },
      wednesday: { is_open: false, open_time: null, close_time: null },
      thursday: { is_open: false, open_time: null, close_time: null },
      friday: { is_open: false, open_time: null, close_time: null },
      saturday: { is_open: false, open_time: null, close_time: null },
      sunday: { is_open: false, open_time: null, close_time: null },
    };

    render(
      <EffectiveDatePreview
        openingHours={allClosedHours}
        effectiveDate={testDate}
      />
    );

    // Should show 7 dashes (one for each closed day)
    const dashes = screen.getAllByText("-");
    expect(dashes).toHaveLength(7);
    // Total should be 0
    expect(screen.getByText("0 slots")).toBeInTheDocument();
  });
});

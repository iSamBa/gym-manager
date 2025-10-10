// Component exports for training session components
// This file serves as the central export point for all training session components

export { default as TrainingSessionCalendar } from "./TrainingSessionCalendar";

// Main view components
export { default as TrainingSessionsView } from "./TrainingSessionsView";
export { default as SessionQuickStats } from "./SessionQuickStats";
export { default as SessionBreadcrumbs } from "./SessionBreadcrumbs";

// Form components
export { default as EditSessionDialog } from "./forms/EditSessionDialog";
export { default as MemberMultiSelect } from "./forms/MemberMultiSelect";
export { SessionBookingForm } from "./forms/SessionBookingForm";
export { SessionBookingDialog } from "./forms/SessionBookingDialog";

// Analytics and reporting components
export { default as SessionHistoryTable } from "./SessionHistoryTable";
export { default as SessionAnalyticsCharts } from "./SessionAnalyticsCharts";
export { default as SessionActionMenu } from "./SessionActionMenu";

// Machine slot grid components (US-006, US-007, US-008)
export { MachineSlotGrid } from "./MachineSlotGrid";
export { MachineColumn } from "./MachineColumn";
export { TimeSlot } from "./TimeSlot";
export { SessionNotificationBadge } from "./SessionNotificationBadge";

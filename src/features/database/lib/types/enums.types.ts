// Enum types for database entities
// These match the CHECK constraints in the database schema

export type UserRole = "admin" | "trainer" | "member";

export type MemberType = "trial" | "full" | "collaboration";

export type MemberStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "expired"
  | "pending";

export type Gender = "male" | "female";

export type PartnershipType =
  | "influencer"
  | "corporate"
  | "brand"
  | "media"
  | "other";

export type EquipmentStatus =
  | "active"
  | "maintenance"
  | "out_of_order"
  | "retired";

export type SubscriptionStatus =
  | "active"
  | "paused"
  | "cancelled"
  | "expired"
  | "pending";

export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";

export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "online"
  | "check";

export type ClassStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type BookingStatus =
  | "confirmed"
  | "waitlisted"
  | "cancelled"
  | "no_show"
  | "attended";

export type SessionType =
  | "trial" // Try-out session for new members (creates trial member)
  | "member" // Regular member session (renamed from 'standard')
  | "contractual" // Contract signing session (trial members only)
  | "multi_site" // Member from another gym in group (guest)
  | "collaboration" // Commercial partnership/influencer (guest)
  | "makeup" // Additional session (bypasses weekly limit)
  | "non_bookable"; // Time blocker (no member needed)

export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled";

export type UniformSize = "XS" | "S" | "M" | "L" | "XL";

export type VestSize =
  | "V1"
  | "V2"
  | "V2_SMALL_EXT"
  | "V2_LARGE_EXT"
  | "V2_DOUBLE_EXT";

export type HipBeltSize = "V1" | "V2";

export type ReferralSource =
  | "instagram"
  | "member_referral"
  | "website_ib"
  | "prospection"
  | "studio"
  | "phone"
  | "chatbot";

export type TrainingPreference = "mixed" | "women_only";

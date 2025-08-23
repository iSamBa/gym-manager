# Database Feature

This directory contains the complete database schema and utilities for the gym management system.

## Overview

The database schema includes:

- **User Management**: Authentication, user profiles, and role-based access
- **Member Management**: Member profiles, emergency contacts, and status tracking
- **Equipment Management**: Equipment catalog, categories, and maintenance tracking
- **Subscription System**: Plans, member subscriptions, and payment processing
- **Training System**: Trainers, classes, bookings, and attendance tracking

## Structure

```
src/features/database/
├── lib/
│   ├── types.ts             # TypeScript type definitions
│   └── utils.ts             # Database utility functions
└── README.md
```

## Database Schema

### Core Tables

1. **user_profiles** - Extended user information and roles
2. **members** - Gym member profiles and information
3. **member_emergency_contacts** - Emergency contact information
4. **equipment_categories** - Equipment categorization
5. **equipment** - Equipment inventory and tracking
6. **equipment_maintenance_logs** - Maintenance history
7. **subscription_plans** - Available membership plans
8. **member_subscriptions** - Member subscription records
9. **subscription_payments** - Payment tracking
10. **trainers** - Trainer profiles and information
11. **class_types** - Available class types
12. **classes** - Scheduled classes
13. **class_bookings** - Class reservations
14. **trainer_sessions** - Personal training sessions
15. **attendance_logs** - Member attendance tracking

### Security

All tables implement **Row Level Security (RLS)** with policies for:

- **Admin users**: Full access to all data
- **Trainer users**: Limited access based on role requirements
- **Self-access**: Users can access their own data

## Usage

### Database Management

The database schema is managed through the **Supabase MCP server** integration in Claude Code. All migrations have been applied and the database is ready for use.

Key features:

- Complete database schema with Row Level Security (RLS)
- Auto-generated unique identifiers (member numbers, equipment numbers, trainer codes)
- Comprehensive audit trails with `created_at` and `updated_at` timestamps
- Default data seeded for subscription plans, equipment categories, and class types

### Using Database Utils

```typescript
import { memberUtils, subscriptionUtils } from "@/features/database/lib/utils";

// Get active members
const activeMembers = await memberUtils.getActiveMembersCount();

// Get member's active subscription
const subscription =
  await subscriptionUtils.getMemberActiveSubscription(memberId);
```

### Type Safety

All database entities have TypeScript types:

```typescript
import type { Member, SubscriptionPlan } from "@/features/database/lib/types";

const member: Member = {
  id: "uuid",
  member_number: "GYM20240001",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  status: "active",
  // ... other fields
};
```

## Database Schema Details

### User Management

- **user_profiles**: Extended user information with role-based access (admin/trainer)
- Auto-creates profiles on user signup via trigger
- Row Level Security (RLS) policies for data access control

### Member Management

- **members**: Comprehensive member profiles with auto-generated member numbers
- **member_emergency_contacts**: Emergency contact information with primary contact enforcement
- Status tracking (active, inactive, suspended, expired)

### Equipment Management

- **equipment_categories**: Pre-seeded categories (Cardio, Strength Training, etc.)
- **equipment**: Full equipment inventory with maintenance tracking
- **equipment_maintenance_logs**: Maintenance scheduling and history
- QR code support and automatic maintenance date calculations

### Subscription System

- **subscription_plans**: Flexible plans with various billing cycles and features
- **member_subscriptions**: Subscription management with auto-renewal and pause functionality
- **subscription_payments**: Payment tracking with reminders and late fees
- **payment_reminders**: Automated reminder system

### Training System

- **trainers**: Trainer profiles with specializations and availability
- **trainer_specializations**: Pre-seeded specializations (Personal Training, Yoga, etc.)
- **class_types**: Pre-seeded class types (HIIT, Yoga Flow, Spin Class, etc.)
- **classes**: Class scheduling with participant limits and waitlists
- **class_bookings**: Booking management with automatic participant counting
- **trainer_sessions**: Personal training session management
- **attendance_logs**: Check-in/check-out tracking

## Environment Setup

Ensure the following environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development Workflow

1. **Schema Changes**: Modify migration files
2. **Type Updates**: Update types.ts to match schema changes
3. **Utility Functions**: Add helper functions to utils.ts
4. **Testing**: Test with local Supabase instance
5. **Deployment**: Apply migrations to production

## Best Practices

- Always use RLS policies for data security
- Include proper indexes for performance
- Use enums for constrained values
- Implement proper foreign key relationships
- Add descriptive comments to complex queries
- Use transactions for multi-table operations

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Check that user has proper role in user_profiles
2. **Foreign Key Violations**: Ensure referenced records exist
3. **Unique Constraint Violations**: Check for duplicate values
4. **Permission Denied**: Verify RLS policies allow the operation

### Debugging

Enable query logging in development:

```typescript
// In your component or utility function
const { data, error } = await supabase
  .from("members")
  .select("*")
  .eq("status", "active");

if (error) {
  console.error("Database error:", error);
  console.error("Error details:", error.details);
}
```

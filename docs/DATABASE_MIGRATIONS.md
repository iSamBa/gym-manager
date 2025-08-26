# Database Migrations Documentation

This document provides a comprehensive overview of the database migrations applied to the gym management system. All migrations were applied using the Supabase MCP server integration.

## Migration Overview

The database schema consists of 5 major migrations that create a complete gym management system with user authentication, member management, equipment tracking, subscription billing, and class scheduling.

## Migration 1: User Profiles and Roles

**Purpose**: Establishes the foundation for user authentication and role-based access control.

### Tables Created

#### `user_profiles`

Extends Supabase's `auth.users` table with additional profile information and role management.

**Key Features:**

- **Role-based access**: Users can be either 'admin' or 'trainer'
- **Profile extension**: Additional fields for first_name, last_name, phone, bio, etc.
- **Automatic profile creation**: Trigger creates profile when user signs up
- **Audit fields**: `created_at` and `updated_at` timestamps

**Columns:**

- `id` (UUID): Primary key, references `auth.users(id)`
- `role` (user_role): Either 'admin' or 'trainer', defaults to 'trainer'
- `email` (TEXT): User's email address (unique)
- `first_name`, `last_name` (TEXT): User's name
- `phone` (TEXT): Contact phone number
- `avatar_url` (TEXT): Profile picture URL
- `bio` (TEXT): User biography/description
- `date_of_birth` (DATE): User's birth date
- `hire_date` (DATE): Employment start date
- `is_active` (BOOLEAN): Account status flag

### Row Level Security (RLS) Policies

**View Policies:**

- **Admins**: Can view all user profiles
- **Users**: Can view their own profile only

**Insert Policies:**

- **Admins**: Can create any profile
- **Users**: Can create their own profile (during signup)

**Update Policies:**

- **Admins**: Can update any profile
- **Users**: Can update their own profile (role changes require admin)

**Delete Policies:**

- **Admins only**: Can delete user profiles

### Functions and Triggers

#### `update_updated_at_column()`

Automatically updates the `updated_at` timestamp when a record is modified.

#### `create_user_profile()`

Automatically creates a user profile when a new user signs up through Supabase Auth.

### Indexes

- `idx_user_profiles_role`: Fast role-based queries
- `idx_user_profiles_email`: Fast email lookups
- `idx_user_profiles_active`: Filter active users

---

## Migration 2: Members Schema

**Purpose**: Creates the member management system with comprehensive member profiles and emergency contacts.

### Tables Created

#### `members`

Core member information with auto-generated member numbers and comprehensive profile data.

**Key Features:**

- **UUID primary keys**: Uses standard UUID identifiers
- **Flexible address storage**: JSON field for address components
- **Status tracking**: Active, inactive, suspended, expired
- **Waiver management**: Track waiver signatures and dates
- **Medical information**: Store medical conditions and fitness goals

**Columns:**

- `id` (UUID): Primary key
- UUID-based identification: Uses standard database UUIDs
- `first_name`, `last_name` (TEXT): Member's name (required)
- `email` (TEXT): Unique email address
- `phone` (TEXT): Contact number
- `date_of_birth` (DATE): Member's birth date
- `gender` (gender): Male, female, other, prefer_not_to_say
- `address` (JSONB): Structured address data
- `profile_picture_url` (TEXT): Member photo URL
- `status` (member_status): Current membership status
- `join_date` (DATE): Membership start date
- `notes` (TEXT): General notes about the member
- `medical_conditions` (TEXT): Health conditions to be aware of
- `fitness_goals` (TEXT): Member's fitness objectives
- `preferred_contact_method` (TEXT): Email, phone, SMS preference
- `marketing_consent` (BOOLEAN): Permission for marketing communications
- `waiver_signed` (BOOLEAN): Liability waiver status
- `waiver_signed_date` (DATE): When waiver was signed
- `created_by` (UUID): Staff member who created the record

#### `member_emergency_contacts`

Emergency contact information with primary contact enforcement.

**Key Features:**

- **Primary contact enforcement**: Only one primary contact per member
- **Relationship tracking**: Store relationship to member
- **Multiple contacts**: Support for multiple emergency contacts per member

**Columns:**

- `id` (UUID): Primary key
- `member_id` (UUID): Reference to member
- `first_name`, `last_name` (TEXT): Contact's name
- `relationship` (TEXT): Relationship to member
- `phone` (TEXT): Contact's phone number
- `email` (TEXT): Optional email address
- `is_primary` (BOOLEAN): Primary emergency contact flag

### Functions and Triggers

#### UUID-based identification

Members are identified using standard UUID primary keys for uniqueness.

#### `ensure_one_primary_emergency_contact()`

Ensures only one emergency contact per member is marked as primary.

### RLS Policies

- **Staff access**: Admins and trainers can view/manage all members
- **Admin-only deletes**: Only admins can delete member records
- **Emergency contacts**: Same access patterns as members

---

## Migration 3: Equipment Schema

**Purpose**: Comprehensive equipment inventory and maintenance management system.

### Tables Created

#### `equipment_categories`

Pre-defined equipment categorization for organization and UI display.

**Default Categories:**

- **Cardio**: Cardiovascular exercise equipment (red)
- **Strength Training**: Weight machines and free weights (blue)
- **Functional Training**: Bodyweight training equipment (green)
- **Recovery**: Rehabilitation equipment (purple)
- **Accessories**: Small equipment and accessories (orange)

#### `equipment`

Complete equipment inventory with maintenance tracking.

**Key Features:**

- **Auto-generated equipment numbers**: Format "EQ{YYYY}{0001}"
- **Comprehensive specifications**: Brand, model, serial number, purchase info
- **Maintenance scheduling**: Track last and next maintenance dates
- **Status management**: Active, maintenance, out_of_order, retired
- **QR code support**: Links to digital instructions/maintenance
- **Image gallery**: Multiple equipment photos
- **Location tracking**: Where equipment is located in gym

**Columns:**

- `equipment_number` (TEXT): Auto-generated unique identifier
- `name` (TEXT): Equipment name/description
- `brand`, `model` (TEXT): Manufacturer information
- `category_id` (UUID): Link to equipment category
- `serial_number` (TEXT): Manufacturer serial number
- `purchase_date` (DATE): When equipment was purchased
- `purchase_price` (DECIMAL): Original cost
- `warranty_expires` (DATE): Warranty expiration
- `status` (equipment_status): Current operational status
- `location` (TEXT): Physical location in gym
- `max_weight` (DECIMAL): Maximum weight capacity
- `specifications` (JSONB): Flexible equipment-specific data
- `usage_instructions` (TEXT): How to use the equipment
- `safety_notes` (TEXT): Important safety information
- `qr_code_url` (TEXT): QR code for mobile access
- `image_urls` (TEXT[]): Array of equipment photos
- `maintenance_interval_days` (INTEGER): Days between routine maintenance

#### `equipment_maintenance_logs`

Detailed maintenance tracking and work order management.

**Key Features:**

- **Work order management**: Scheduled, in_progress, completed, cancelled
- **Cost tracking**: Parts, labor, and total costs
- **Photo documentation**: Before/after maintenance photos
- **Automatic date updates**: Equipment maintenance dates updated on completion

**Maintenance Types:**

- Routine maintenance
- Repair work
- Inspections
- Calibration
- Deep cleaning

### Functions and Triggers

#### `generate_equipment_number()`

Creates unique equipment identifiers.

#### `update_equipment_maintenance_date()`

Automatically updates equipment's last and next maintenance dates when work is completed.

### RLS Policies

- **Staff can view/manage**: All staff can access equipment data
- **Admin-only categories**: Only admins can manage equipment categories
- **Maintenance logs**: Staff can update logs they're assigned to

---

## Migration 4: Subscription System

**Purpose**: Flexible membership plan management with automated billing and payment tracking.

### Tables Created

#### `subscription_plans`

Flexible membership plans with various billing cycles and features.

**Key Features:**

- **Multiple plan types**: Basic, premium, VIP, student, senior, corporate
- **Flexible billing**: Daily, weekly, monthly, quarterly, semi-annual, annual
- **Feature management**: JSON array of included features
- **Access controls**: Time-based gym access restrictions
- **Financial management**: Signup fees, cancellation fees, freeze fees
- **Contract terms**: Optional contract length requirements

**Default Plans:**

- **Basic Monthly** ($29.99): Gym access and basic equipment
- **Premium Monthly** ($49.99): Full access with classes and amenities
- **VIP Annual** ($599.00): Premium features with personal training
- **Student Monthly** ($19.99): Discounted rate with limited hours

#### `member_subscriptions`

Individual member subscription records with status tracking.

**Key Features:**

- **Status management**: Pending, active, paused, cancelled, expired
- **Price locking**: Subscription price locked at signup
- **Pause functionality**: Temporary subscription holds with reasons
- **Auto-renewal**: Automatic subscription renewals
- **Cancellation tracking**: Who cancelled and when

#### `subscription_payments`

Comprehensive payment tracking with multiple payment methods.

**Key Features:**

- **Payment methods**: Cash, card, bank transfer, online, check
- **Status tracking**: Pending, completed, failed, refunded, cancelled
- **Late fees**: Automatic late fee calculation
- **Discounts**: Discount tracking with reasons
- **Refund management**: Refund amounts and reasons
- **Integration ready**: Transaction ID and processor fields

#### `payment_reminders`

Automated payment reminder system.

**Reminder Types:**

- Email notifications
- SMS reminders
- Phone call scheduling
- In-person reminders

### Functions and Triggers

#### `calculate_next_billing_date()`

Calculates the next billing date based on billing cycle.

#### `create_initial_payment()`

Automatically creates the first payment record when a subscription is created.

#### `update_subscription_status()`

Updates subscription status when payments are completed.

### RLS Policies

- **Staff management**: All staff can view and manage subscriptions
- **Admin-only plans**: Only admins can create/modify subscription plans
- **Payment access**: Staff can process payments and reminders

---

## Migration 5: Trainers and Classes

**Purpose**: Complete training system with trainer management, class scheduling, and attendance tracking.

### Tables Created

#### `trainer_specializations`

Pre-defined trainer specialization categories.

**Default Specializations:**

- Personal Training (certification required)
- Group Fitness (certification required)
- Weight Training
- Cardio Training
- Yoga (certification required)
- Pilates (certification required)
- Sports Specific Training
- Rehabilitation (certification required)
- Nutrition Coaching (certification required)
- Senior Fitness (certification required)

#### `trainers`

Trainer profiles extending user_profiles with training-specific information.

**Key Features:**

- **Auto-generated trainer codes**: Format "TR001", "TR002", etc.
- **Rate management**: Hourly rates and commission structures
- **Specialization tracking**: Multiple specializations per trainer
- **Availability scheduling**: JSON-based weekly availability
- **Certification tracking**: CPR, background checks, insurance
- **Client capacity**: Maximum clients per session
- **Multi-language support**: Languages spoken by trainer

#### `class_types`

Template definitions for different types of classes.

**Key Features:**

- **Difficulty levels**: Beginner, intermediate, advanced, all_levels
- **Capacity management**: Min/max participants
- **Equipment requirements**: List of required equipment
- **Visual branding**: Colors and icons for UI display

**Default Class Types:**

- **HIIT** (45 min, intermediate): High-intensity interval training
- **Yoga Flow** (60 min, all levels): Dynamic yoga sequences
- **Strength Training** (60 min, beginner): Weight training fundamentals
- **Spin Class** (45 min, all levels): Indoor cycling workout
- **Pilates** (50 min, all levels): Core strengthening

#### `classes`

Individual class instances with scheduling and capacity management.

**Key Features:**

- **Automatic participant counting**: Real-time enrollment tracking
- **Waitlist management**: Automatic waitlist when full
- **Pricing flexibility**: Free classes or drop-in rates
- **Cancellation policies**: Configurable cancellation cutoffs
- **Status tracking**: Scheduled, in-progress, completed, cancelled

#### `class_bookings`

Member class reservations with comprehensive booking management.

**Key Features:**

- **Booking status**: Confirmed, waitlisted, cancelled, no-show, attended
- **Payment tracking**: Drop-in payment amounts
- **Waitlist positioning**: Automatic waitlist queue management
- **Check-in system**: Timestamped attendance tracking
- **Cancellation management**: Reasons and timestamps

#### `trainer_sessions`

Personal training session management.

**Key Features:**

- **Session types**: Personal training, small group, consultation, assessment
- **Payment integration**: Session pricing and payment status
- **Goal tracking**: Session objectives and workout plans
- **Feedback system**: Member and trainer notes
- **Progress tracking**: Session outcomes and next steps

#### `attendance_logs`

Comprehensive gym attendance tracking.

**Key Features:**

- **Check-in/out tracking**: Entry and exit timestamps
- **Activity linking**: Connect to classes or trainer sessions
- **Location tracking**: Where member checked in
- **Automatic creation**: Auto-created when members attend classes

### Functions and Triggers

#### `generate_trainer_code()`

Creates sequential trainer identification codes.

#### `update_class_participant_count()`

Automatically updates class enrollment and waitlist counts when bookings change.

#### `create_attendance_on_booking()`

Creates attendance log entries when members check into classes.

### RLS Policies

- **Trainer access**: Trainers can manage their own classes and sessions
- **Staff management**: All staff can manage classes and bookings
- **Admin oversight**: Admins have full access to all training data

---

## Database Relationships

### Key Foreign Key Relationships

1. **User Hierarchy**:
   - `user_profiles` → `auth.users`
   - `trainers` → `user_profiles`

2. **Member Ecosystem**:
   - `member_emergency_contacts` → `members`
   - `member_subscriptions` → `members`
   - `subscription_payments` → `members`
   - `class_bookings` → `members`
   - `trainer_sessions` → `members`
   - `attendance_logs` → `members`

3. **Equipment Chain**:
   - `equipment` → `equipment_categories`
   - `equipment_maintenance_logs` → `equipment`

4. **Subscription Flow**:
   - `member_subscriptions` → `subscription_plans`
   - `subscription_payments` → `member_subscriptions`
   - `payment_reminders` → `subscription_payments`

5. **Training Structure**:
   - `trainers` → `trainer_specializations` (array reference)
   - `classes` → `class_types`
   - `classes` → `trainers`
   - `class_bookings` → `classes`
   - `trainer_sessions` → `trainers`

## Performance Optimizations

### Indexes Created

**User Management:**

- Email lookups for authentication
- Role-based queries
- Active user filtering

**Member Operations:**

- UUID-based member lookups
- Status-based filtering
- Join date chronological sorting

**Equipment Tracking:**

- Category-based grouping
- Status filtering
- Location-based queries
- Maintenance scheduling

**Subscription Management:**

- Member subscription lookups
- Payment due date sorting
- Status-based filtering
- Billing cycle queries

**Training Operations:**

- Trainer availability queries
- Class date/time scheduling
- Member booking history
- Attendance chronological tracking

## Security Features

### Row Level Security (RLS)

All tables implement comprehensive RLS policies ensuring:

1. **Role-based access**: Admins have broader access than trainers
2. **Data isolation**: Users can only access relevant data
3. **Operation restrictions**: Sensitive operations require admin privileges
4. **Audit trails**: All modifications tracked with user attribution

### Data Integrity

1. **Foreign key constraints**: Maintain referential integrity
2. **Check constraints**: Validate data ranges and formats
3. **Unique constraints**: Prevent duplicate critical data
4. **Trigger enforcement**: Business rule automation
5. **JSON validation**: Structured data in flexible fields

## Maintenance and Monitoring

### Automated Processes

1. **UUID identification**: Standard database UUID primary keys
2. **Equipment maintenance scheduling**: Automatic date calculations
3. **Payment reminders**: Automated reminder scheduling
4. **Attendance tracking**: Automatic log creation
5. **Subscription status updates**: Payment-driven status changes

### Audit Capabilities

1. **Creation tracking**: Who created each record
2. **Modification timestamps**: When records were last updated
3. **Status change history**: Track status transitions
4. **Payment history**: Complete financial audit trail
5. **Maintenance logs**: Equipment service history

This comprehensive database schema provides a solid foundation for a full-featured gym management system with room for future enhancements and scaling.

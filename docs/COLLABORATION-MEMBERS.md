# Collaboration Members Guide

> **User Guide** for managing commercial partnerships, influencer relationships, and promotional member arrangements in the gym management system.

## Table of Contents

1. [Overview](#overview)
2. [What Are Collaboration Members?](#what-are-collaboration-members)
3. [Creating a Collaboration Member](#creating-a-collaboration-member)
4. [Creating Collaboration Plans](#creating-collaboration-plans)
5. [Assigning Subscriptions](#assigning-subscriptions)
6. [Booking Sessions](#booking-sessions)
7. [Managing Partnership Information](#managing-partnership-information)
8. [Converting to Full Member](#converting-to-full-member)
9. [Reporting & Analytics](#reporting--analytics)
10. [Best Practices](#best-practices)
11. [FAQ](#faq)

---

## Overview

The collaboration member system helps you track and manage members who receive complimentary or promotional memberships through partnerships, influencer arrangements, or commercial agreements.

**Key Benefits**:

- ✅ Track partnership details (company, contract dates, deliverables)
- ✅ Separate analytics for partnership vs regular members
- ✅ Enforce session type restrictions
- ✅ Manage member lifecycle (partnership → paying member)
- ✅ Maintain historical records

---

## What Are Collaboration Members?

**Collaboration members** are individuals who receive gym access through:

- 🤝 **Commercial partnerships** (e.g., corporate wellness programs)
- 📱 **Influencer agreements** (e.g., social media promotion)
- 🏢 **Brand collaborations** (e.g., equipment suppliers)
- 📰 **Media partnerships** (e.g., magazine features)

**Key Characteristics**:

- Have a **partnership company** associated with them
- Receive **complimentary or discounted** subscriptions ($0 pricing allowed)
- Can **only book collaboration sessions** (restricted from regular sessions)
- **Stay separate** in analytics and reporting
- Can be **converted** to full paying members when partnership ends

---

## Creating a Collaboration Member

### Step-by-Step

1. **Navigate to Members** → Click **"New Member"**

2. **Complete Steps 1-3** (Personal, Contact, Address information)

3. **Step 4: Member Type**
   - Select **"Collaboration Partner"** from dropdown
   - ⚠️ This determines available fields in next steps

4. **Step 5: Partnership Details** ⭐
   - **Company Name\*** (required) - Enter partner company/brand name
   - **Partnership Type** (optional) - Select type:
     - Influencer
     - Corporate
     - Brand
     - Media
     - Other
   - **Contract Start Date** (optional) - When partnership began
   - **Contract End Date\*** (required) - When partnership expires
     - ⚠️ Must be a future date
     - 💡 System will warn when contract expires in < 30 days
   - **Partnership Notes** (optional) - Contract terms, deliverables, special conditions

5. **Complete Steps 6-10** (Equipment, Referral, Training, Health, Settings)

6. **Click "Create Member"**

### Required vs Optional Fields

**Required for Collaboration Members**:

- ✅ Company Name
- ✅ Contract End Date (future date)

**Optional but Recommended**:

- 📝 Partnership Type (helps with reporting)
- 📅 Contract Start Date (for tracking duration)
- 📄 Partnership Notes (for reference on deliverables)

### Example Partnership Notes

```
Agreement Details:
- 12 complimentary sessions over 6 months
- 3 Instagram posts per month featuring gym
- Use of gym logo in promotional materials
- Monthly progress photo shoot
Contact: John Smith (john@nikesports.com)
```

---

## Creating Collaboration Plans

Collaboration plans are subscription plans designed for partnership arrangements, allowing $0 pricing.

### Step-by-Step

1. **Navigate to Plans** → Click **"New Plan"**

2. **Enter Plan Details**:
   - **Name**: "Nike Partnership - 12 Sessions" (be descriptive)
   - **Description**: Contract terms, what's included
   - **Price**: $0 (or any amount ≥ $0)
   - **Signup Fee**: $0 (usually $0 for partnerships)
   - **Duration**: 6 months (or contract length)
   - **Session Count**: 12 (or agreed amount)

3. **Check "Collaboration Plan"** ✓
   - ℹ️ Info appears: "Collaboration plans can have $0 price for partnership arrangements"

4. **Set "Active Plan"** ✓

5. **Click "Save Plan"**

### Naming Conventions

**Recommended format**: `[Company] Partnership - [Sessions] Sessions`

**Examples**:

- "Nike Partnership - 12 Sessions"
- "GymShark Influencer - 8 Sessions"
- "Tech Corp Wellness - 24 Sessions"
- "Magazine Feature - 4 Sessions"

**Benefits**:

- Easy to identify in subscription dialogs
- Clear session count
- Associates with company

---

## Assigning Subscriptions

### Automatic Filtering

When you open the subscription dialog for a collaboration member, **only collaboration plans appear** in the dropdown. Regular plans are automatically hidden.

### Step-by-Step

1. **Navigate to collaboration member's profile**

2. **Click "Add Subscription"** button

3. **Select a collaboration plan** (only collaboration plans visible)

4. **Set subscription details**:
   - Start Date (defaults to today)
   - Initial Payment (usually $0)
   - Payment Method (if applicable)
   - Notes

5. **Click "Create Subscription"**

### Important Notes

- ⚠️ You **cannot** assign regular plans to collaboration members
- ✅ Member type stays as "collaboration" (no auto-conversion)
- 📊 Subscription tracked normally (session counts, usage, etc.)

---

## Booking Sessions

### Session Type Restrictions

**Collaboration members can ONLY book**:

- ✅ Collaboration sessions

**Collaboration members CANNOT book**:

- ❌ Member sessions
- ❌ Makeup sessions
- ❌ Trial sessions
- ❌ Contractual sessions

### Booking Process

1. **Navigate to Training Sessions** → Click **"Book Session"**

2. **Step 1: Select Session Type**
   - Select **"Collaboration"**

3. **Step 2: Select Member**
   - **Only collaboration members** appear in dropdown
   - Regular members automatically filtered out

4. **Select Date/Time**

5. **Add Notes** (optional)

6. **Click "Book Session"**

### What Happens Behind the Scenes

The system automatically:

- Filters member dropdown based on session type
- Validates member type matches session type
- Prevents invalid bookings with clear error messages
- Increments session usage on subscription

---

## Managing Partnership Information

### Viewing Partnership Details

On the member's detail page, you'll see:

```
Partnership Details
├─ Company: Nike Inc.
├─ Type: [Brand Badge]
├─ Contract: Jan 1, 2025 - Dec 31, 2025 (365 days remaining)
└─ Notes: 12 complimentary sessions, Instagram posts required
```

**Expiration Warning**: If contract expires in < 30 days:

```
⚠️ Partnership expires in 15 days
```

### Editing Partnership Information

1. **Navigate to member's profile**
2. **Click "Edit Member"**
3. **Update partnership fields** in Step 5
4. **Save changes**

**Note**: All fields are editable except member_type (use conversion for that).

### Tracking Contract Expiration

**Manual Check**:

1. Navigate to Members page
2. Filter by "Collaboration" member type
3. Sort by join date or use search
4. Check contract end dates

**Future Enhancement**: Dashboard widget for expiring contracts (Phase 4, planned later).

---

## Converting to Full Member

When a partnership ends and the member wants to continue as a paying member, you can convert them to a full member.

### When to Convert

- ✅ Partnership contract expired
- ✅ Member wants to continue with paid membership
- ✅ Partnership terms changed to paid arrangement
- ✅ Company ended partnership early

### Conversion Process

1. **Navigate to collaboration member's detail page**

2. **Click "Convert to Full"** button (UserCog icon)

3. **Review Partnership Information** displayed in dialog:
   - Current company
   - Contract dates
   - Partnership type

4. **Review Warning**: "This action cannot be undone"

5. **Select Options**:
   - ✓ **Mark partnership as ended today** (recommended)
     - Sets contract_end to today's date
     - Partnership marked as officially complete
   - ✓ **Create regular subscription after conversion** (optional)
     - Opens subscription dialog after conversion
     - Helps ensure continuity

6. **Add Conversion Notes** (optional but recommended):

   ```
   Partnership contract completed successfully.
   Member wishes to continue with regular membership.
   Discussed pricing options - selected Gold plan.
   ```

7. **Click "Convert to Full Member"**

8. **Success!** Member is now a full member

### What Happens During Conversion

**Changed**:

- ✅ Member type: `collaboration` → `full`
- ✅ Status: Set to `active`
- ✅ Partnership end date: Set to today (if option checked)
- ✅ Member notes: Conversion notes appended with timestamp

**Preserved (NOT deleted)**:

- ✅ Partnership company name
- ✅ Partnership type
- ✅ Contract start date
- ✅ Original contract end date (if not updated)
- ✅ Partnership notes
- ✅ All session history
- ✅ All payment history

**Why Preserve Data?**

- Historical reference
- Reporting and analytics
- Audit trail
- Potential future re-partnering

### After Conversion

**Member Can Now**:

- ✅ Receive regular subscription plans
- ✅ Book member/makeup sessions
- ✅ Appear in regular member analytics

**Member Cannot**:

- ❌ Receive collaboration plans anymore
- ❌ Book collaboration sessions
- ❌ Be converted back (one-way process)

### Best Practices for Conversion

**Before Converting**:

1. ✅ Confirm partnership is officially ended
2. ✅ Discuss payment options with member
3. ✅ Review their session usage during partnership
4. ✅ Prepare subscription plan options

**During Conversion**:

1. ✅ Always check "Mark partnership as ended"
2. ✅ Add detailed conversion notes
3. ✅ Consider checking "Create subscription" for continuity

**After Converting**:

1. ✅ Create regular subscription immediately
2. ✅ Update member on new payment schedule
3. ✅ Provide them with payment information
4. ✅ Thank them for their partnership participation

---

## Reporting & Analytics

### Current Capabilities

**Member Filters**:

- Filter members by "Collaboration" type
- View all collaboration members
- Search by company name

**Session Tracking**:

- View collaboration session usage
- Track completed vs scheduled sessions
- Monitor subscription consumption

### Viewing Collaboration Members

1. **Navigate to Members page**
2. **Filter** → Select "Collaboration" from Member Type dropdown
3. **View all collaboration members** with orange badges

### Identifying Active Partnerships

Members with:

- Member type = "Collaboration"
- Contract end date in the future
- Status = "Active"

### Future Enhancements (Phase 4, planned later)

- **Collaboration Dashboard** with specific metrics
- **Expiring Contracts Widget** (30-day warning)
- **Partnership Performance Metrics**
- **Separate Analytics** (excluding collaboration from regular stats)

---

## Best Practices

### Setting Up Partnerships

**Documentation**:

- ✅ Always fill in Partnership Notes with contract terms
- ✅ Include contact information for partner company
- ✅ Document deliverables (posts, photos, testimonials)
- ✅ Note any special conditions

**Contract Dates**:

- ✅ Set realistic end dates based on actual contract
- ✅ Add buffer time if contract might extend
- ✅ Review contracts regularly (monthly check)

**Naming**:

- ✅ Use clear, descriptive plan names
- ✅ Include company name in plan
- ✅ Specify session count in plan name

### Managing Active Partnerships

**Regular Reviews** (Monthly):

1. Check collaboration members list
2. Review contracts expiring in next 30-60 days
3. Contact members about renewal/conversion
4. Update partnership notes with progress

**Communication**:

- 📧 Email reminders 60 days before contract end
- 📞 Call/meeting 30 days before contract end
- 💬 Discuss continuation options (renew vs convert)

**Session Monitoring**:

- Track session usage vs contract allowance
- Follow up if member underutilizing sessions
- Ensure partner getting value from agreement

### Ending Partnerships

**Smooth Offboarding**:

1. ✅ Discuss continuation options with member
2. ✅ Offer conversion to full member with discount
3. ✅ Use conversion dialog with detailed notes
4. ✅ Create regular subscription immediately
5. ✅ Thank member for partnership

**Data Retention**:

- ✅ Never delete partnership information
- ✅ Use conversion process (preserves data)
- ✅ Keep detailed notes in member profile

---

## FAQ

### General Questions

**Q: What's the difference between collaboration and trial members?**
A: Trial members are prospects trying the gym for free (temporary). Collaboration members are partners with formal agreements, often for marketing/promotional purposes. Trials auto-convert to full members, collaborations require manual conversion.

**Q: Can collaboration members have multiple subscriptions?**
A: Yes, just like regular members. They can have multiple collaboration subscriptions sequentially or overlapping.

**Q: Can I change a full member to collaboration type?**
A: Not directly. You would need to create a new collaboration member. The conversion only goes one way (collaboration → full).

### Partnership Management

**Q: What if partnership extends beyond original contract date?**
A: Edit the member's partnership details and update the contract end date.

**Q: Can collaboration plans have non-zero prices?**
A: Yes! Collaboration plans can have any price ≥ $0, including discounted rates.

**Q: Do collaboration members count toward studio capacity limits?**
A: Yes, they're regular members for capacity purposes, just tracked separately for analytics.

### Session Booking

**Q: Why can't I assign a collaboration member to a regular session?**
A: This is by design. Collaboration sessions are separate and help track partnership-specific attendance. Use collaboration session type for all their sessions.

**Q: What if collaboration member wants to attend a regular class?**
A: You can book them into a collaboration session at the same time as the class, or convert them to full member first if the partnership allows.

**Q: Can collaboration members attend makeup sessions?**
A: No, only collaboration session type. Makeup sessions are for paying members who miss their regular sessions.

### Conversion

**Q: Can I undo a conversion?**
A: No, conversion is one-way by design. If you converted by mistake, you would need to manually change the member_type in the database (not recommended) or create a new collaboration member.

**Q: What happens to their subscription after conversion?**
A: Existing collaboration subscriptions remain but are no longer usable. Create a new regular subscription for continued access.

**Q: Will converted members lose their session history?**
A: No! All session history, payment history, and partnership information is preserved.

### Technical Questions

**Q: Where is partnership data stored?**
A: In the `members` table with fields: `partnership_company`, `partnership_type`, `partnership_contract_start`, `partnership_contract_end`, `partnership_notes`.

**Q: Can I query collaboration members via API?**
A: Yes, filter members where `member_type = 'collaboration'`. See CLAUDE.md for query examples.

**Q: Are there any automated workflows?**
A: Currently, all processes are manual. Future enhancements may include automated expiration reminders and renewal workflows.

---

## Need Help?

**Technical Issues**:

- Check CLAUDE.md for developer documentation
- Review test files for examples
- Check the troubleshooting section

**Feature Requests**:

- Phase 4 (Dashboard analytics) planned for future
- Submit enhancement ideas to development team

**Questions**:

- Consult with gym administrator
- Review partnership agreement documents
- Contact technical support if needed

---

**Last Updated**: November 2, 2025
**Feature Version**: 1.0
**Status**: Production Ready ✅

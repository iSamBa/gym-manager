# Trainer Access Control - START HERE

**Feature Status:** 🔴 Not Started
**Priority:** P0 (Critical - Blocking trainers from using system)
**Timeline:** ASAP
**Branch:** `feature/trainer-access-control`

---

## 🎯 What This Feature Does

Enable trainers to access and manage training sessions and members with full CRUD permissions, while keeping admin-only features (like machine toggles, exports, dashboard) restricted to administrators.

---

## 🚨 Current Problem

**Trainers are completely blocked from using the system.**

- ✅ 5 trainers have user profiles and auth accounts
- ✅ Trainers can log in successfully
- ❌ After login, trainers get redirected to `/` (dashboard)
- ❌ Dashboard requires admin role → redirects back to `/login`
- ❌ **Infinite redirect loop** → trainers cannot access ANY pages

**Result:** System is unusable for all 5 active trainers.

---

## ✅ What Trainers Need

### Access Granted:

- 📋 View ALL training sessions (all trainers)
- ➕ Create new training sessions
- ✏️ Edit and cancel training sessions
- 👥 View ALL members
- ➕ Create new members
- ✏️ Edit member profiles
- 📄 View member detail pages

### Access Denied (Admin-Only):

- ❌ Dashboard (/)
- ❌ Machine availability toggle
- ❌ Export functionality
- ❌ Collaboration member fields
- ❌ Trainers management
- ❌ Payments, Plans, Subscriptions
- ❌ Studio Settings

---

## 📚 User Stories Overview

This feature is broken into 5 user stories:

| ID     | Story                                      | Complexity | Est. Time | Status         |
| ------ | ------------------------------------------ | ---------- | --------- | -------------- |
| US-001 | Create Staff Authentication Hook           | Small      | 20 min    | 🔴 Not Started |
| US-002 | Enable Trainer Access to Training Sessions | Small      | 30 min    | 🔴 Not Started |
| US-003 | Enable Trainer Access to Members           | Medium     | 45 min    | 🔴 Not Started |
| US-004 | Role-Based Navigation and Redirects        | Medium     | 40 min    | 🔴 Not Started |
| US-005 | Hide Admin-Only UI Features                | Small      | 25 min    | 🔴 Not Started |

**Total Estimated Time:** 2.5-3 hours

---

## 🚀 Quick Start

### Step 1: Verify Git Branch

```bash
git branch --show-current
```

**Expected:** `feature/trainer-access-control`

**If not on feature branch:**

```bash
git checkout feature/trainer-access-control
```

### Step 2: Read Implementation Guide

Open `AGENT-GUIDE.md` for step-by-step implementation instructions.

### Step 3: Start with US-001

Run the implementation command:

```bash
# Once you're ready to implement
/implement-userstory US-001
```

---

## 📋 Dependencies & Order

```
US-001 (Foundation Hook)
  ├──> US-002 (Training Sessions)
  ├──> US-003 (Members)
  └──> US-004 (Navigation & Redirects)
         └──> US-005 (Admin UI Features)
```

**IMPORTANT:** Implement in order. Each story depends on previous ones.

---

## 🧪 Testing Strategy

### Manual Testing Checklist

After completing all user stories, test with trainer account:

**Account:** karim.elouardi@gymmanager.ma
**Password:** trainer123456

**Test Cases:**

- [ ] Login succeeds
- [ ] Redirects to `/training-sessions` (not dashboard)
- [ ] No infinite redirect loop
- [ ] Can view all sessions
- [ ] Can create, edit, cancel sessions
- [ ] Machine toggle NOT visible
- [ ] Can view all members
- [ ] Can create members
- [ ] Can view/edit member details
- [ ] Export button NOT visible
- [ ] Sidebar shows: Members, Training Sessions
- [ ] Sidebar hides: Dashboard, Trainers, Payments, Plans, Subscriptions, Settings
- [ ] Cannot access `/` (dashboard)
- [ ] Cannot access admin-only pages

### Admin Testing (Verify Unchanged):

- [ ] Admin login still works
- [ ] Dashboard accessible
- [ ] All admin features intact
- [ ] Machine toggle visible
- [ ] Export visible

---

## 🎯 Success Criteria

✅ Trainers can log in successfully
✅ Trainers land on `/training-sessions` after login
✅ Trainers have full CRUD on sessions and members
✅ Admin-only features hidden from trainers
✅ Navigation shows role-appropriate items
✅ No security vulnerabilities
✅ `npm run lint` passes (0 errors/warnings)
✅ `npm test` passes (100% pass rate)
✅ `npm run build` succeeds

---

## 📁 Key Files to Modify

1. `src/hooks/use-require-auth.ts` - Add staff access hook
2. `src/app/training-sessions/page.tsx` - Change to staff access
3. `src/app/training-sessions/new/page.tsx` - Change to staff access
4. `src/app/members/page.tsx` - Change to staff access + admin UI controls
5. `src/app/members/new/page.tsx` - Change to staff access
6. `src/app/members/[id]/page.tsx` - Add staff access check
7. `src/components/layout/sidebar.tsx` - Role-based navigation
8. `[login-form].tsx` - Role-based redirect logic

**Total:** 8 files to modify

---

## 🔒 Security Considerations

### Multiple Protection Layers:

1. **Middleware** - Server-side auth validation
2. **Page-level hooks** - `useRequireStaff()` checks
3. **Component-level** - Admin UI conditionals
4. **Database RLS** - Row-level security policies

### What's Already Protected:

- ✅ `MachineAvailabilityToggle` has admin check (line 57-60)
- ✅ All pages have auth middleware
- ✅ RLS policies enforce database security

---

## 📖 Additional Documentation

- **AGENT-GUIDE.md** - Step-by-step implementation workflow
- **README.md** - Technical architecture and design decisions
- **STATUS.md** - Progress tracking
- **US-001 to US-005** - Individual user story specifications

---

## 👥 Affected Trainers

| Name            | Email                         | Sessions | Status        |
| --------------- | ----------------------------- | -------- | ------------- |
| Karim El Ouardi | karim.elouardi@gymmanager.ma  | 359      | ✅ Auth Ready |
| Omar Chakir     | omar.chakir@gymmanager.ma     | 167      | ✅ Auth Ready |
| Youssef Bennani | youssef.bennani@gymmanager.ma | 2        | ✅ Auth Ready |
| Samira Mouhib   | samira.mouhib@gymmanager.ma   | 2        | ✅ Auth Ready |
| Fatima Alami    | fatima.alami@gymmanager.ma    | 0        | ✅ Auth Ready |

**All trainers have auth accounts** (created in previous migration)
**Password:** trainer123456

---

## ⚡ Performance Standards

All code must follow CLAUDE.md performance guidelines:

- ✅ Use `React.memo` for complex components
- ✅ Use `useCallback` for event handlers
- ✅ Use `useMemo` for expensive computations
- ✅ Components < 300 lines
- ✅ No `any` types
- ✅ No console statements (use logger)
- ✅ JSDoc documentation

---

## 🐛 Known Issues

None yet - this is the initial implementation.

---

## 📞 Support

If you encounter issues:

1. Check AGENT-GUIDE.md troubleshooting section
2. Review STATUS.md for known blockers
3. Verify git branch is correct
4. Ensure all quality checks pass (lint/test/build)

---

**Ready to begin?** Open `AGENT-GUIDE.md` and start with US-001!

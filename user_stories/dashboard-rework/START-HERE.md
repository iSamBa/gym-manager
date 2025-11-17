# Dashboard Rework - START HERE

## 🎯 Feature Overview

Complete dashboard overhaul with session analytics (3 weeks view) and monthly activity metrics to give admins actionable insights into gym operations and member engagement.

## 📋 Quick Start

1. **Read This File First** - You're in the right place!
2. **Read AGENT-GUIDE.md** - Detailed implementation workflow
3. **Read README.md** - Feature architecture and technical details
4. **Check STATUS.md** - Current progress and what's next
5. **Start with US-001** - Begin systematic implementation

## 🎯 What This Feature Does

### Problem Statement

The current dashboard shows basic stats (total members, revenue, recent activity) but lacks critical operational insights admins need:

- No visibility into session booking patterns and type distribution across time periods
- No tracking of trial member conversions
- No clear view of subscription lifecycle (expirations, renewals, cancellations)
- Cannot make data-driven decisions about resource allocation or identify trends

### Solution

A new analytics-focused dashboard with:

- **Weekly Session Statistics**: 3 pie charts (last week, current week, next week) showing session distribution by type
- **Monthly Activity Metrics**: Trial sessions, conversions, subscription lifecycle tracking
- **Historical Data**: Month selector to view past performance
- **Performance Optimized**: Server-side aggregation, lazy loading, React Query caching

## 📊 User Stories Overview

This feature is broken into **8 user stories**:

| Story  | Title                          | Complexity | Status      |
| ------ | ------------------------------ | ---------- | ----------- |
| US-001 | Database Layer - RPC Functions | Medium     | Not Started |
| US-002 | Type Definitions and Utilities | Small      | Not Started |
| US-003 | Data Layer - Analytics Hooks   | Medium     | Not Started |
| US-004 | Weekly Session Pie Charts      | Medium     | Not Started |
| US-005 | Monthly Activity Metrics       | Small      | Not Started |
| US-006 | Dashboard Page Integration     | Large      | Not Started |
| US-007 | Testing and Quality Assurance  | Medium     | Not Started |
| US-008 | Production Readiness           | Medium     | Not Started |

**Total Estimated Effort**: ~10-12 hours

## 🚀 Implementation Order

**CRITICAL**: User stories MUST be implemented in dependency order:

```
US-001 (Database) → US-002 (Types/Utils) → US-003 (Hooks)
                                              ↓
                      US-004 (Charts) ← ← ← ← ┘
                           ↓
                      US-005 (Activity Cards)
                           ↓
                      US-006 (Dashboard Integration)
                           ↓
                      US-007 (Testing)
                           ↓
                      US-008 (Production Readiness)
```

## ⚡ Quick Command Reference

```bash
# Start implementing a user story
/implement-userstory US-001

# Check current branch (MUST be on feature branch!)
git branch --show-current

# Run tests
npm test

# Run linting
npm run lint

# Build check
npm run build
```

## 🎯 Target Users

**Primary**: Admin - Gym managers and administrators who need to monitor operations and make strategic decisions

## 📦 Technical Stack

- **Database**: PostgreSQL with Supabase
- **Backend**: RPC functions for server-side aggregation
- **Frontend**: Next.js 15.5, React 19, TypeScript
- **Charts**: shadcn/ui + recharts
- **State**: React Query for data fetching/caching
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest + Testing Library

## ✅ Success Criteria

This feature is complete when:

- ✅ All 8 user stories implemented and tested
- ✅ Dashboard shows 3-week session analytics
- ✅ Monthly activity metrics displayed
- ✅ Month selector works for historical data
- ✅ All tests passing (100%)
- ✅ Lint check passes (0 errors)
- ✅ Build successful
- ✅ Production readiness checklist complete
- ✅ Performance targets met (<300KB bundle, <100ms queries)

## 📚 Next Steps

1. **Review AGENT-GUIDE.md** for detailed implementation workflow
2. **Read README.md** for architecture details
3. **Start US-001** to begin implementation
4. **Update STATUS.md** as you progress

## 🔗 Related Documentation

- [AGENT-GUIDE.md](./AGENT-GUIDE.md) - Implementation workflow
- [README.md](./README.md) - Architecture and technical details
- [STATUS.md](./STATUS.md) - Progress tracking
- [CLAUDE.md](/CLAUDE.md) - Project standards
- [docs/RPC_SIGNATURES.md](/docs/RPC_SIGNATURES.md) - Database functions

---

**Ready to start?** Read AGENT-GUIDE.md next!

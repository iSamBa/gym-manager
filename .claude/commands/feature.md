---
description: "Structured workflow for developing new features with optimal collaboration"
---

# Feature Development Workflow

I'll guide you through developing a new feature using our proven 3-phase approach:

## 📋 Phase 1: Discovery & Context

Please provide the following information:

### Feature Overview

**Feature Name:** [e.g., "Member Management Rework", "Payment Dashboard"]

**Goals & Requirements:**

- [ ] Goal 1 (e.g., Fix search not working on mobile)
- [ ] Goal 2 (e.g., Add bulk actions - export, delete)
- [ ] Goal 3 (e.g., Improve detail view performance)

**Priority Classification:**

- **P0 (Must Have):** [Critical features]
- **P1 (Should Have):** [Important but not blocking]
- **P2 (Nice to Have):** [Enhancement opportunities]

**User Stories:**

- As a [user type], I need to [action] so that [benefit]
- Example: "As a gym admin, I need to export member data to Excel so that I can generate reports for management"

**Design References:**

- Screenshots: [Describe or provide path to images]
- Wireframes: [Link or description]
- Inspiration: [Reference to similar features in other apps]

**Timeline:**

- Deadline: [Date or "Flexible"]
- Estimated effort: [Small/Medium/Large or "Unknown"]

---

## 🔍 What I'll Do Next

Once you provide the above information, I will:

1. **Analyze Current State**
   - Review existing code in relevant feature directory
   - Check database schema and relationships
   - Identify reusable patterns from other features
   - Assess performance implications

2. **Propose Architecture**
   - Component breakdown using shadcn/ui primitives
   - Hook consolidation strategy (max 4 hooks per feature)
   - Database query optimization (server-side operations)
   - Performance checklist compliance
   - Bundle impact analysis

3. **Create Implementation Plan**
   - Break down into incremental iterations (~100-200 lines each)
   - Define acceptance criteria for each iteration
   - Identify potential risks or blockers

4. **Get Your Approval**
   - You review the plan and say "approved" or suggest changes
   - We iterate on architecture before writing code
   - This prevents rework and ensures alignment

---

## ⚡ Implementation Guidelines

**Incremental Development:**

- One component/feature at a time
- Immediate testing after each piece
- Commits pass lint + tests automatically
- Follow performance optimization patterns from CLAUDE.md

**Quality Gates (Applied Automatically):**

- ✅ React.memo for complex components
- ✅ useCallback for event handlers
- ✅ useMemo for expensive computations
- ✅ Server-side sorting/filtering
- ✅ Dynamic imports for heavy libraries
- ✅ TypeScript strict mode (no `any`)
- ✅ Components under 300 lines
- ✅ Maximum 4 hooks per feature

**Collaboration Best Practices:**

- Share screenshots of current/desired state
- Quick approvals ("looks good, continue")
- Immediate feedback on concerns
- Let me handle testing/linting between iterations

---

## 🚀 Ready to Start?

Please fill out the **Phase 1: Discovery & Context** section above with your feature requirements, and I'll proceed with analysis and architecture planning.

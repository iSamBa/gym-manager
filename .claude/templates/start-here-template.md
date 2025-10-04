# START HERE - {{feature_name}}

## IMPORTANT: Read This First

If you are an **AI agent** or **developer** starting work on the {{feature_name}} feature, follow these steps in order:

---

## Step 1: Read the Agent Guide

**File**: [AGENT-GUIDE.md](./AGENT-GUIDE.md)

This guide contains:

- Pre-implementation checklist
- Implementation workflow
- Quick reference for each user story
- Common pitfalls to avoid
- Success criteria

**DO NOT skip this step.** It will save you time and prevent mistakes.

---

## Step 2: Read the Feature Overview

**File**: [README.md](./README.md)

Understand:

- Feature goals and objectives
- Overall architecture
- Implementation phases
- Success metrics

---

## Step 3: Check Current Status

**File**: [STATUS.md](./STATUS.md)

Review:

- Which user stories are complete
- Which user story you should work on next
- Current blockers
- Time tracking

---

## Step 4: Start Implementation

Begin with the next incomplete user story in order:

{{user_stories_list}}

**Never skip user stories.** They have dependencies and must be completed in order.

---

## Quick Start Commands

```bash
# Navigate to user stories folder
cd user_stories/{{feature_folder}}

# Read agent guide
cat AGENT-GUIDE.md

# Check status
cat STATUS.md

# Start with first user story
cat {{first_user_story}}
```

---

## Questions?

- Review [AGENT-GUIDE.md](./AGENT-GUIDE.md) for common questions
- Check each user story's "Notes" section for design decisions
- Refer to [../../CLAUDE.md](../../CLAUDE.md) for project-wide guidelines
- Refer to [../../CLAUDE.local.md](../../CLAUDE.local.md) for enforcement rules

---

## Remember

1. **Read AGENT-GUIDE.md first** (most important)
2. **Follow user stories in order** ({{first_us}} → {{second_us}} → {{third_us}}...)
3. **Check every item in Definition of Done** before marking complete
4. **Update STATUS.md** after completing each user story
5. **Quality over speed** - do it right the first time

---

**Good luck!**

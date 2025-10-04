---
description: "Interactive feature planning and user story generation"
---

# Create Feature - Interactive User Story Generator

I'll guide you through creating a complete feature specification with structured user stories. This command generates all the documentation needed for systematic implementation.

---

## 🎯 What This Command Does

1. **Interactive Discovery** - Asks questions to understand your feature
2. **Generate User Stories** - Creates structured, testable user stories
3. **Complete Documentation** - Builds START-HERE, AGENT-GUIDE, README, STATUS files
4. **Ready for Implementation** - Output is ready for `/implement-userstory` command

---

## 📋 Phase 1: Feature Discovery

Let me understand what you want to build:

### Question 1: Feature Name

**What is the feature name?**
_Example: "Members Table Rework", "Payment Dashboard", "Trainer Scheduling"_

→ **Answer:**

### Question 2: Brief Description

**Describe the feature in 1-2 sentences**
_What is it and why do you need it?_

→ **Answer:**

### Question 3: Problem Statement

**What problem does this feature solve?**
_Current pain points, inefficiencies, or missing functionality_

→ **Answer:**

### Question 4: Target Users

**Who will use this feature?**
_Examples: admin, gym member, trainer, manager, etc._

→ **Answer:**

---

## 🎯 Phase 2: Requirements Gathering

### Question 5: Main Goals

**List the main goals for this feature (minimum 3)**

## → **Goals:**

-
-

### Question 6: Priority Classification

## **P0 (Must Have) - Critical for launch:**

## **P1 (Should Have) - Important but not blocking:**

## **P2 (Nice to Have) - Enhancement opportunities:**

### Question 7: Design References

**Do you have any design references?**
_Screenshots, wireframes, links to similar features, or "None"_

→ **Answer:**

### Question 8: Timeline

**What's the timeline for this feature?**
_Deadline date, "2 weeks", "Flexible", or "ASAP"_

→ **Answer:**

---

## 🔧 Phase 3: Technical Context

### Question 9: Codebase Areas

**Which areas of the codebase will this touch?**
_Examples: features/members, features/database, components/ui, etc._

→ **Answer:**

### Question 10: Database Changes

**Are database changes needed?**

- [ ] Yes - New tables/columns
- [ ] Yes - New functions/procedures
- [ ] Yes - Schema modifications
- [ ] No - Only frontend changes
- [ ] Unknown - Need to investigate

→ **Details (if yes):**

### Question 11: Components

**Will you create new components or modify existing ones?**

- [ ] Create new components
- [ ] Modify existing components
- [ ] Both

→ **Details:**

### Question 12: Performance Considerations

**Any performance concerns?**
_Large datasets, heavy computations, real-time updates, etc._

→ **Answer:**

---

## 📝 Phase 4: User Story Planning

Based on your answers, I'll suggest breaking this into **[X]** user stories.

**Does this sound right? (I'll ask about each story next)**

For each user story, I'll need:

### Story Template (I'll ask these for each):

1. **Story Goal** - What does this story accomplish?
2. **Acceptance Criteria** - How do we know it's done? (3-5 criteria)
3. **Technical Scope** - Database/API/UI/Tests
4. **Dependencies** - Does it depend on other stories?
5. **Complexity** - Small/Medium/Large

---

## ✅ What Happens Next

Once you answer all questions, I will:

1. **Generate User Stories** - Complete markdown files with:
   - User story format (As a... I want... So that...)
   - Business value explanation
   - Detailed acceptance criteria
   - Technical implementation guidance
   - Testing requirements
   - Definition of Done checklist

2. **Create Documentation**:
   - `START-HERE.md` - Entry point for implementation
   - `AGENT-GUIDE.md` - Step-by-step implementation workflow
   - `README.md` - Feature overview and architecture
   - `STATUS.md` - Progress tracking template

3. **Setup Folder Structure**:

   ```
   user_stories/{feature-name}/
   ├── START-HERE.md
   ├── AGENT-GUIDE.md
   ├── README.md
   ├── STATUS.md
   ├── US-001-{descriptive-name}.md
   ├── US-002-{descriptive-name}.md
   └── ...
   ```

4. **Ready for Implementation** - Use `/implement-userstory US-001` to start

---

## 🚀 Ready to Start?

Please fill out all the questions above, and I'll generate your complete feature specification!

**Tip**: The more detail you provide, the better the generated user stories will be. Don't worry about being perfect - we can refine as we go!

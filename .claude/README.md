# Claude Code Custom Commands & Templates

This directory contains custom slash commands and templates for Claude Code to streamline feature development with user stories.

---

## 📁 Directory Structure

```
.claude/
├── commands/           # Slash commands for Claude Code
│   ├── create-feature.md
│   └── implement-userstory.md
├── templates/          # Templates for generating user stories
│   ├── user-story-template.md
│   ├── agent-guide-template.md
│   ├── start-here-template.md
│   ├── readme-template.md
│   └── status-template.md
├── agents/             # Custom agent configurations
└── settings.local.json # Local Claude Code settings
```

---

## 🎯 Available Commands

### `/create-feature` - Interactive Feature Planning

**Purpose:** Create complete feature specifications with structured user stories

**Usage:**

```
/create-feature
```

**What it does:**

1. Asks interactive questions about your feature
2. Generates structured user stories following proven format
3. Creates complete documentation (README, AGENT-GUIDE, STATUS, START-HERE)
4. Sets up folder structure in `user_stories/{feature-name}/`

**When to use:**

- Starting a new feature from scratch
- Need systematic breakdown of requirements
- Want consistent documentation across features

**Example Flow:**

```
You: /create-feature

Claude: Let me understand what you want to build:

Question 1: Feature Name?
You: Payment Dashboard

Question 2: Brief Description?
You: A dashboard for tracking and managing gym payment transactions...

[... interactive Q&A continues ...]

Claude: ✅ Created user_stories/payment-dashboard/
   - 5 user stories generated
   - Complete documentation ready
   - Ready for implementation with /implement-userstory
```

---

### `/implement-userstory` - Systematic Implementation

**Purpose:** Implement a user story following AGENT-GUIDE workflow

**Usage:**

```
/implement-userstory US-001
/implement-userstory 1      # Also works
```

**What it does:**

1. Pre-flight checks (dependencies, files exist, etc.)
2. Context analysis (acceptance criteria, testing requirements)
3. Implementation plan (files to change, approach)
4. Systematic implementation (data layer → components → integration)
5. Comprehensive testing (all criteria from user story)
6. Definition of Done verification
7. STATUS.md update and commit

**When to use:**

- Ready to implement a specific user story
- Want systematic, quality-focused development
- Need testing and DoD enforcement

**Example Flow:**

```
You: /implement-userstory US-001

Claude: 🔍 Pre-flight Checks...
   ✓ User story file exists
   ✓ Dependencies complete
   ✓ AGENT-GUIDE.md loaded

   📖 Context Analysis...
   User Story: Database Foundation
   - 4 acceptance criteria
   - 8 files to create/modify
   - Database changes required

   📐 Implementation Plan...
   [Shows detailed plan]

   Approve to proceed? (yes/no)

You: yes

Claude: 🛠️ Implementing...
   [Systematic implementation with progress updates]

   🧪 Testing Phase...
   ✓ Unit Tests: 12/12 passing
   ✓ Integration Tests: 5/5 passing
   ✓ Type Safety: No errors
   ✓ Linting: 0 errors
   ✓ Build: Successful

   ✅ Definition of Done...
   [Verifies all checkboxes]

   📝 Completion...
   ✓ STATUS.md updated
   ✓ Commit created

   Push changes? (yes/no)
```

---

## 📄 Templates

### User Story Template

**File:** `templates/user-story-template.md`

Structured format for consistent user stories:

- User story (As a... I want... So that...)
- Business value
- Acceptance criteria (Given/When/Then format)
- Technical implementation guidance
- Testing requirements
- Definition of Done
- Dependencies tracking

### Agent Guide Template

**File:** `templates/agent-guide-template.md`

Workflow guide for AI agents:

- Pre-implementation checklist
- Step-by-step workflow
- Testing standards
- Common pitfalls
- Success criteria

### Other Templates

- `start-here-template.md` - Entry point for feature implementation
- `readme-template.md` - Feature overview and architecture
- `status-template.md` - Progress tracking and metrics

---

## 🔄 Workflow: From Idea to Implementation

### Step 1: Create Feature Specification

```bash
/create-feature
```

Answer interactive questions → Get complete user stories

### Step 2: Review Generated Documentation

```bash
cd user_stories/{feature-name}/
cat START-HERE.md    # Read this first
cat AGENT-GUIDE.md   # Implementation workflow
cat STATUS.md        # Progress tracking
```

### Step 3: Implement User Stories in Order

```bash
/implement-userstory US-001  # First story
/implement-userstory US-002  # Second story
# ... continue in sequence
```

### Step 4: Track Progress

- STATUS.md automatically updated after each user story
- All tests must pass before proceeding
- Definition of Done enforced

---

## ✅ Best Practices

### For `/create-feature`

1. **Be Specific** - Detailed answers = better user stories
2. **Think User-First** - Focus on user value, not technical details
3. **Prioritize Clearly** - P0/P1/P2 helps with scope management
4. **Include Design** - Screenshots/wireframes improve clarity

### For `/implement-userstory`

1. **Follow Order** - Don't skip user stories (dependencies!)
2. **Review Plans** - Approve/modify before implementation
3. **Trust the Process** - Testing and DoD ensure quality
4. **Update STATUS** - Automatic, but review for accuracy

### General

- **One Feature at a Time** - Don't mix features
- **Commit Frequently** - After each user story
- **Test Thoroughly** - All tests must pass
- **Document Decisions** - Use Notes sections

---

## 🎯 Success Metrics

Features built with this workflow achieve:

✅ **100% Test Coverage** - All acceptance criteria tested
✅ **Consistent Quality** - DoD enforced on every story
✅ **Clear Documentation** - README, guides, status tracking
✅ **Maintainability** - Structured, well-tested code
✅ **Velocity** - Faster subsequent features (reuse patterns)

---

## 📚 Examples

### Successful Feature: Members Table Rework

Located at: `user_stories/members-table-rework/`

This feature demonstrates the full workflow:

- 7 user stories (US-001 through US-007)
- Complete documentation
- All tests passing
- Followed systematic implementation

**Study this for reference!**

---

## 🆘 Troubleshooting

### Command Not Found

**Issue:** `/create-feature` or `/implement-userstory` not recognized

**Solution:**

- Ensure files exist in `.claude/commands/`
- Restart Claude Code
- Check file permissions

### Missing Dependencies

**Issue:** `/implement-userstory` says "Complete US-001 first"

**Solution:**

- User stories have dependencies
- Complete them in order (US-001 → US-002 → US-003...)
- Check STATUS.md for current state

### Tests Failing

**Issue:** Implementation blocked by failing tests

**Solution:**

- Don't skip testing phase
- Fix all test failures before proceeding
- Check Testing Criteria in user story
- Run tests manually: `npm test -- <file>`

### Template Variables Not Replaced

**Issue:** User story has `{{placeholder}}` text

**Solution:**

- This is expected - `/create-feature` fills these in
- Manually replace if needed
- Check template file for correct variable names

---

## 🔧 Customization

### Adding New Commands

1. Create `.md` file in `.claude/commands/`
2. Add frontmatter with description
3. Document command in this README

### Modifying Templates

1. Edit files in `.claude/templates/`
2. Use `{{variable}}` syntax for placeholders
3. Test with `/create-feature` command

### Custom Agents

1. Add agent configs to `.claude/agents/`
2. Reference in commands as needed

---

## 📖 Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project coding standards
- [CLAUDE.local.md](../CLAUDE.local.md) - Enforcement rules
- [User Stories](../user_stories/) - All feature specifications

---

## 🚀 Quick Start

```bash
# 1. Create new feature
/create-feature

# 2. Navigate to generated folder
cd user_stories/{feature-name}/

# 3. Read the start guide
cat START-HERE.md

# 4. Implement first user story
/implement-userstory US-001

# 5. Continue with subsequent stories
/implement-userstory US-002
/implement-userstory US-003
# ...
```

---

**Happy coding! 🎉**

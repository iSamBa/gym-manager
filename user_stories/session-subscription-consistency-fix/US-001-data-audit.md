# US-001: Data Audit & Discovery

**Story ID**: US-001
**Feature**: Session-Subscription Consistency Fix
**Type**: Investigation
**Priority**: P0 (Must Have)
**Complexity**: Small
**Estimated Effort**: 3 hours

---

## User Story

**As a** system administrator
**I want to** audit current session-subscription data
**So that** I can identify existing inconsistencies before applying fixes

---

## Business Value

Understanding the current state of data inconsistencies is critical before applying any fixes. This audit will:

1. **Quantify the problem**: How many records are affected?
2. **Identify severity**: Which issues are critical vs minor?
3. **Guide implementation**: Inform backfill strategy and validation logic
4. **Establish baseline**: Measure improvement after fixes applied
5. **Prevent surprises**: Discover edge cases before they cause issues

**Without this audit**, we risk:

- Applying migrations that fail due to unexpected data states
- Missing critical edge cases
- Creating fixes that don't address real-world issues

---

## Acceptance Criteria

### Must Have

- [ ] **AC-1**: Audit script runs successfully without modifying any data
- [ ] **AC-2**: Script identifies members with multiple active subscriptions
- [ ] **AC-3**: Script reports sessions without clear subscription attribution
- [ ] **AC-4**: Script calculates session count mismatches (completed + scheduled + remaining ≠ total)
- [ ] **AC-5**: Script identifies negative remaining_sessions values
- [ ] **AC-6**: Script checks for orphaned sessions (member deleted but sessions remain)
- [ ] **AC-7**: Report generates summary with count of affected records per category
- [ ] **AC-8**: Report assigns severity level (critical/high/medium/low) to each issue type
- [ ] **AC-9**: Report provides actionable repair recommendations
- [ ] **AC-10**: Findings documented in STATUS.md

### Nice to Have

- [ ] Script exports detailed results to JSON for further analysis
- [ ] Script provides sample affected records for manual review
- [ ] Performance metrics (query execution times)

---

## Technical Scope

### Database Queries Required

1. **Multiple Active Subscriptions Check**:

```typescript
const { data: multipleActive } = await supabase
  .from("member_subscriptions")
  .select("member_id, count")
  .eq("status", "active")
  .group("member_id")
  .having("count(*) > 1");
```

2. **Session Count Mismatch Check**:

```typescript
// For each member with active subscription:
// 1. Count completed sessions (member/makeup/contractual only)
// 2. Count scheduled sessions
// 3. Get remaining from subscription
// 4. Compare: completed + scheduled + remaining vs total_sessions_snapshot
```

3. **Negative Remaining Sessions Check**:

```typescript
const { data: negativeRemaining } = await supabase
  .from("member_subscriptions")
  .select("*")
  .lt("remaining_sessions", 0);
```

4. **Orphaned Sessions Check**:

```typescript
const { data: orphaned } = await supabase
  .from("training_sessions")
  .select("id, member_id")
  .is("members.id", null) // Left join shows null for deleted members
  .leftJoin("members", "training_sessions.member_id", "members.id");
```

### Files to Create

- `scripts/audit-session-subscription-consistency.ts` - Main audit script
- `scripts/audit-report-[date].json` - Generated report (optional)

### Files to Modify

- `user_stories/session-subscription-consistency-fix/STATUS.md` - Document findings

---

## Implementation Guide

### Step 1: Create Audit Script Structure

```typescript
// scripts/audit-session-subscription-consistency.ts

import { createClient } from "@/lib/supabase-server";

interface AuditResult {
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  count: number;
  description: string;
  recommendation: string;
  samples?: any[];
}

async function auditSessionSubscriptionConsistency() {
  const results: AuditResult[] = [];

  // Run all audit checks
  results.push(await checkMultipleActiveSubscriptions());
  results.push(await checkSessionCountMismatches());
  results.push(await checkNegativeRemainingessions());
  results.push(await checkOrphanedSessions());
  results.push(await checkSessionsWithoutSubscription());

  // Generate report
  generateReport(results);
}
```

### Step 2: Implement Each Audit Check

**Check 1: Multiple Active Subscriptions**

```typescript
async function checkMultipleActiveSubscriptions(): Promise<AuditResult> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("member_subscriptions")
    .select("member_id")
    .eq("status", "active");

  if (error) throw error;

  // Group by member_id and count
  const memberCounts = data.reduce(
    (acc, sub) => {
      acc[sub.member_id] = (acc[sub.member_id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const affected = Object.entries(memberCounts).filter(
    ([_, count]) => count > 1
  );

  return {
    category: "Multiple Active Subscriptions",
    severity: "critical",
    count: affected.length,
    description: `${affected.length} members have multiple active subscriptions`,
    recommendation:
      "Review and deactivate duplicate subscriptions before applying unique constraint",
    samples: affected.slice(0, 5).map(([memberId, count]) => ({
      member_id: memberId,
      active_count: count,
    })),
  };
}
```

**Check 2: Session Count Mismatches**

```typescript
async function checkSessionCountMismatches(): Promise<AuditResult> {
  const supabase = createClient();

  // Get all active subscriptions
  const { data: subscriptions } = await supabase
    .from("member_subscriptions")
    .select("id, member_id, total_sessions_snapshot, remaining_sessions")
    .eq("status", "active");

  const mismatches = [];

  for (const sub of subscriptions || []) {
    // Count completed sessions (member/makeup/contractual only)
    const { count: completed } = await supabase
      .from("training_sessions")
      .select("*", { count: "exact", head: true })
      .eq("member_id", sub.member_id)
      .eq("status", "completed")
      .in("session_type", ["member", "makeup", "contractual"]);

    // Count scheduled sessions
    const { count: scheduled } = await supabase
      .from("training_sessions")
      .select("*", { count: "exact", head: true })
      .eq("member_id", sub.member_id)
      .in("status", ["scheduled", "in_progress"])
      .in("session_type", ["member", "makeup", "contractual"]);

    const total = (completed || 0) + (scheduled || 0) + sub.remaining_sessions;

    if (total !== sub.total_sessions_snapshot) {
      mismatches.push({
        member_id: sub.member_id,
        subscription_id: sub.id,
        expected: sub.total_sessions_snapshot,
        actual: total,
        breakdown: { completed, scheduled, remaining: sub.remaining_sessions },
      });
    }
  }

  return {
    category: "Session Count Mismatches",
    severity: "high",
    count: mismatches.length,
    description: `${mismatches.length} members have session counts that don't add up`,
    recommendation: "Investigate and correct session consumption logic",
    samples: mismatches.slice(0, 5),
  };
}
```

**Check 3: Negative Remaining Sessions**

```typescript
async function checkNegativeRemainingSessions(): Promise<AuditResult> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("member_subscriptions")
    .select("id, member_id, remaining_sessions")
    .lt("remaining_sessions", 0);

  return {
    category: "Negative Remaining Sessions",
    severity: "critical",
    count: data?.length || 0,
    description: `${data?.length || 0} subscriptions have negative remaining sessions`,
    recommendation:
      "Correct remaining_sessions values before adding CHECK constraint",
    samples: data?.slice(0, 5),
  };
}
```

**Check 4: Orphaned Sessions**

```typescript
async function checkOrphanedSessions(): Promise<AuditResult> {
  const supabase = createClient();

  // This requires a custom query
  const { data, error } = await supabase.rpc("find_orphaned_sessions");
  // Or use a LEFT JOIN approach

  return {
    category: "Orphaned Sessions",
    severity: "medium",
    count: data?.length || 0,
    description: `${data?.length || 0} sessions reference deleted members`,
    recommendation: "Delete orphaned sessions or reassign to valid members",
    samples: data?.slice(0, 5),
  };
}
```

**Check 5: Sessions Without Subscription Attribution**

```typescript
async function checkSessionsWithoutSubscription(): Promise<AuditResult> {
  const supabase = createClient();

  // Count member/makeup/contractual sessions
  const { count } = await supabase
    .from("training_sessions")
    .select("*", { count: "exact", head: true })
    .in("session_type", ["member", "makeup", "contractual"]);

  return {
    category: "Sessions Without subscription_id",
    severity: "high",
    count: count || 0,
    description: `${count || 0} sessions will need subscription_id backfilled`,
    recommendation:
      "Backfill logic will assign sessions to appropriate subscriptions",
    samples: [],
  };
}
```

### Step 3: Generate Report

```typescript
function generateReport(results: AuditResult[]) {
  console.log("\n" + "=".repeat(80));
  console.log("SESSION-SUBSCRIPTION CONSISTENCY AUDIT REPORT");
  console.log("Date:", new Date().toISOString());
  console.log("=".repeat(80) + "\n");

  // Summary
  const totalIssues = results.reduce((sum, r) => sum + r.count, 0);
  const critical = results.filter((r) => r.severity === "critical");
  const high = results.filter((r) => r.severity === "high");

  console.log("SUMMARY");
  console.log(`Total Issues Found: ${totalIssues}`);
  console.log(`Critical: ${critical.reduce((sum, r) => sum + r.count, 0)}`);
  console.log(`High: ${high.reduce((sum, r) => sum + r.count, 0)}`);
  console.log("\n");

  // Detailed results
  for (const result of results) {
    const icon =
      result.severity === "critical"
        ? "🔴"
        : result.severity === "high"
          ? "🟠"
          : result.severity === "medium"
            ? "🟡"
            : "🟢";

    console.log(
      `${icon} ${result.category} [${result.severity.toUpperCase()}]`
    );
    console.log(`   Count: ${result.count}`);
    console.log(`   Description: ${result.description}`);
    console.log(`   Recommendation: ${result.recommendation}`);

    if (result.samples && result.samples.length > 0) {
      console.log(`   Samples:`, JSON.stringify(result.samples, null, 2));
    }
    console.log("\n");
  }

  console.log("=".repeat(80));
  console.log("END OF REPORT");
  console.log("=".repeat(80) + "\n");
}
```

### Step 4: Document Findings

Update `STATUS.md` under "Audit Findings" section with:

- Summary counts for each category
- Severity assessment
- Samples of affected records
- Recommendations for next steps

---

## Testing Requirements

### Manual Testing

- [ ] Run script on development environment
- [ ] Verify no database changes occurred (`SELECT * FROM pg_stat_activity`)
- [ ] Review report output for accuracy
- [ ] Spot-check sample records manually
- [ ] Verify query performance (should complete in <1 minute)

### Edge Cases to Consider

- Members with no subscriptions
- Deleted members with active sessions
- Subscriptions with zero total_sessions
- Future-dated subscriptions

---

## Definition of Done

- [ ] Audit script created and runs successfully
- [ ] All acceptance criteria met
- [ ] Report generated with clear findings
- [ ] Findings documented in STATUS.md
- [ ] No database modifications made (verified)
- [ ] Performance acceptable (<1 minute execution)
- [ ] Code committed with proper message format

---

## Dependencies

**Blocked By**: None (starting point)

**Blocks**:

- US-002 (need audit results to plan migrations)
- US-003 (need to understand edge cases)

---

## Notes & Questions

### Questions to Answer

- How many members have multiple active subscriptions?
- What percentage of sessions have count mismatches?
- Are there any negative remaining_sessions values?
- How many sessions need subscription_id backfilled?

### Assumptions

- Database is accessible via Supabase MCP or client
- Member and subscription data is reasonably clean
- Audit can run on production data (read-only)

### Risks

- Query performance on large datasets (mitigate with pagination)
- Incomplete data revealing more issues than expected (good to know!)

---

## Related Documentation

- [START-HERE.md](./START-HERE.md) - Feature overview
- [AGENT-GUIDE.md](./AGENT-GUIDE.md) - Implementation workflow
- [README.md](./README.md) - Technical architecture
- [STATUS.md](./STATUS.md) - Track progress

---

## Commit Message Template

```bash
git add scripts/audit-session-subscription-consistency.ts
git add user_stories/session-subscription-consistency-fix/STATUS.md
git commit -m "feat(audit): add session-subscription consistency audit script [US-001]

- Created audit script to identify data inconsistencies
- Checks for multiple active subscriptions per member
- Identifies session count mismatches
- Detects negative remaining_sessions
- Finds orphaned sessions
- Generates comprehensive report with severity levels
- Documented findings in STATUS.md

Read-only audit, no database modifications."
```

---

**Status**: 🔴 Not Started
**Last Updated**: 2025-10-31

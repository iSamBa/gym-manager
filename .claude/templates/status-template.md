# {{feature_name}} - Status Tracking

## Current Status

**Overall Progress:** {{progress_percentage}}% Complete

**Current Phase:** {{current_phase}}

**Last Updated:** {{last_updated}}

---

## User Stories Progress

| ID  | User Story | Status | Assignee | Started | Completed | Notes |
| --- | ---------- | ------ | -------- | ------- | --------- | ----- |

{{user_stories_status_table}}

---

## Status Legend

- 🔴 **Not Started** - Work hasn't begun
- 🟡 **In Progress** - Currently being worked on
- 🟢 **Complete** - All DoD items checked, tests passing
- 🔵 **Blocked** - Waiting on dependency or external factor
- ⚪ **Deferred** - Deprioritized, will revisit later

---

## Current Sprint/Iteration

**Focus:** {{current_focus}}

**Active Stories:**
{{active_stories_list}}

**Blockers:**
{{blockers_list}}

---

## Completion Metrics

### Overall Stats

- **Total User Stories:** {{total_stories}}
- **Completed:** {{completed_stories}}
- **In Progress:** {{in_progress_stories}}
- **Not Started:** {{not_started_stories}}
- **Blocked:** {{blocked_stories}}

### Velocity Tracking

| Sprint/Week | Stories Completed | Story Points | Notes |
| ----------- | ----------------- | ------------ | ----- |

{{velocity_table}}

---

## Testing Progress

| Test Type         | Total          | Passing       | Failing       | Coverage           |
| ----------------- | -------------- | ------------- | ------------- | ------------------ |
| Unit Tests        | {{unit_total}} | {{unit_pass}} | {{unit_fail}} | {{unit_coverage}}% |
| Integration Tests | {{int_total}}  | {{int_pass}}  | {{int_fail}}  | {{int_coverage}}%  |
| E2E Tests         | {{e2e_total}}  | {{e2e_pass}}  | {{e2e_fail}}  | {{e2e_coverage}}%  |
| Performance Tests | {{perf_total}} | {{perf_pass}} | {{perf_fail}} | N/A                |

---

## Quality Metrics

### Code Quality

- **Linting Errors:** {{lint_errors}}
- **Linting Warnings:** {{lint_warnings}}
- **TypeScript Errors:** {{ts_errors}}
- **Components >300 lines:** {{large_components}}
- **Hooks per feature:** {{hooks_count}} / 4 max

### Performance Benchmarks

{{performance_benchmarks}}

---

## Risk Register

| Risk | Impact | Probability | Mitigation | Status |
| ---- | ------ | ----------- | ---------- | ------ |

{{risks_table}}

---

## Dependencies Status

### Completed Dependencies

{{completed_deps}}

### Pending Dependencies

{{pending_deps}}

### External Blockers

{{external_blockers}}

---

## Next Steps

1. {{next_step_1}}
2. {{next_step_2}}
3. {{next_step_3}}

---

## Timeline

**Original Estimate:** {{original_estimate}}
**Current Projection:** {{current_projection}}
**Deadline:** {{deadline}}

---

## Notes & Decisions

### Recent Decisions

{{recent_decisions}}

### Open Questions

{{open_questions}}

### Lessons Learned

{{lessons_learned}}

---

## Update Log

| Date | Updated By | Changes |
| ---- | ---------- | ------- |

{{update_log}}

---

**Last Status Review:** {{last_review_date}}
**Next Review:** {{next_review_date}}

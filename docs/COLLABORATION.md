# Team Collaboration Guide

## Code Review Guidelines

### Pull Request Requirements

**Before Creating PR:**

- [ ] Feature branch created from latest `main`
- [ ] All tests pass (`npm test`)
- [ ] Linting clean (`npm run lint`)
- [ ] Build successful (`npm run build`)
- [ ] Manual testing completed
- [ ] Performance checklist verified (see CLAUDE.md optimization guidelines)

**PR Description Template:**

```markdown
## Summary

Brief description of changes and motivation

## Changes Made

- [ ] Added/Updated components
- [ ] Database schema changes
- [ ] New API endpoints
- [ ] Performance optimizations

## Testing

- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Edge cases considered

## Performance Impact

- [ ] Bundle size checked
- [ ] React DevTools profiling done
- [ ] Database query optimization verified

## Screenshots/Videos

(If UI changes)

## Related Issues

Closes #123
```

### Code Review Checklist

**Reviewer Must Check:**

- [ ] **Performance**: Follows optimization guidelines
- [ ] **Security**: No exposed secrets, proper validation
- [ ] **TypeScript**: No `any` types, proper interfaces
- [ ] **Testing**: Adequate test coverage
- [ ] **Documentation**: Code is self-documenting or commented
- [ ] **Architecture**: Follows project patterns

**Review Process:**

1. **Request Changes** for optimization violations
2. **Approve** only when all guidelines met
3. **Merge** using "Squash and merge" for clean history

## Commit Message Format

```bash
# Format: type(scope): description
feat(members): add bulk export functionality
fix(auth): resolve token refresh issue
perf(tables): optimize member list rendering
docs: update API documentation
test: add unit tests for payment processing

# Types: feat, fix, perf, docs, test, refactor, style, chore
```

## Communication

**Daily Standup Topics:**

- Blockers related to performance
- Code review requests
- Optimization discoveries
- Technical debt items

**Weekly Reviews:**

- Bundle size analysis (`npm run analyze`)
- Performance metrics review
- Code quality assessment
- Documentation updates

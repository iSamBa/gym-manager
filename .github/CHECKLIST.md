# CI/CD Setup Validation Checklist

Use this checklist to ensure your CI/CD pipeline is working correctly.

## ✅ Pre-Setup Validation

- [ ] **Repository Structure**
  - [ ] Main branch exists and is default
  - [ ] Dev branch exists
  - [ ] All workflow files are committed to main branch

- [ ] **Local Development**
  - [ ] `npm test` passes locally
  - [ ] `npm run lint` passes locally
  - [ ] `npm run build` succeeds locally
  - [ ] All dependencies are installed

## ✅ GitHub Configuration

### Branch Protection Rules

- [ ] **Main branch protection configured**
  - [ ] Requires PR before merge
  - [ ] Requires status checks: `CI Success`
  - [ ] Requires up-to-date branches
  - [ ] Restricts direct pushes

- [ ] **Dev branch protection configured**
  - [ ] Requires PR before merge
  - [ ] Requires status checks: `CI Success`
  - [ ] Less restrictive than main

### Environments (Optional but Recommended)

- [ ] **Staging environment created**
  - [ ] Deployment protection rules set
  - [ ] Required secrets added

- [ ] **Production environment created**
  - [ ] Deployment protection rules set
  - [ ] Required reviewers assigned
  - [ ] Required secrets added

### Labels Created

- [ ] `run-e2e` - Trigger E2E tests
- [ ] `dependencies` - Dependency updates
- [ ] `automated` - Automated PRs
- [ ] `github-actions` - Workflow updates

## ✅ CI Pipeline Testing

### Test 1: Basic CI Workflow

1. **Create test branch:**

   ```bash
   git checkout -b test/ci-validation
   echo "# CI Test" > TEST.md
   git add TEST.md
   git commit -m "test: validate CI pipeline"
   git push origin test/ci-validation
   ```

2. **Create PR to dev branch**
   - [ ] PR created successfully
   - [ ] CI workflow triggered automatically
   - [ ] All jobs appear in "Checks" tab

3. **Verify CI jobs:**
   - [ ] ✅ Setup & Install (should complete in ~1min)
   - [ ] ✅ Lint & Format Check (should complete in ~30sec)
   - [ ] ✅ Unit Tests (should complete in ~1min)
   - [ ] ✅ Build Application (should complete in ~2min)
   - [ ] ✅ CI Success (should complete after others)

4. **Check job details:**
   - [ ] View detailed logs in Actions tab
   - [ ] Verify caching is working (cache hit messages)
   - [ ] Check test coverage upload
   - [ ] Verify build artifacts upload

### Test 2: E2E Testing (Optional)

1. **Trigger E2E tests:**
   - Add `run-e2e` label to existing PR, OR
   - Manual trigger: Actions → CI → Run workflow

2. **Verify E2E execution:**
   - [ ] ✅ E2E Tests job appears
   - [ ] Playwright browsers install correctly
   - [ ] Application builds and starts
   - [ ] E2E tests execute (may take 2-5min)
   - [ ] Test results uploaded as artifacts

### Test 3: PR Merge Process

1. **Attempt merge without approval:**
   - [ ] ❌ Merge blocked by branch protection
   - [ ] Status checks required message displayed

2. **Approve and merge PR:**
   - [ ] Add approval review
   - [ ] ✅ Merge button becomes available
   - [ ] Merge completes successfully
   - [ ] Branch auto-deleted (if configured)

### Test 4: Main Branch Validation

1. **Verify merge to dev triggers CI:**
   - [ ] CI runs on dev branch after merge
   - [ ] All checks pass on dev

2. **Create PR from dev to main:**
   - [ ] CI runs again for main branch
   - [ ] Stricter checks apply (if configured)
   - [ ] E2E tests run automatically (if configured)

## ✅ Deployment Pipeline Testing

### Test 1: Deployment Workflow

1. **Manual deployment trigger:**
   - Actions → Deploy → Run workflow
   - Select `main` branch and `staging` environment
   - [ ] Deployment workflow starts
   - [ ] Environment protection rules apply
   - [ ] Deployment status tracked

2. **Verify deployment steps:**
   - [ ] ✅ Check CI Status
   - [ ] ✅ Prepare Deployment
   - [ ] ✅ Build for Deployment
   - [ ] ✅ Deploy to Staging
   - [ ] ✅ Post-Deployment Tasks

### Test 2: Production Deployment (When Ready)

1. **Production deployment:**
   - Trigger with `production` environment
   - [ ] Additional protection rules enforced
   - [ ] Required reviewers notified
   - [ ] Deployment completes successfully
   - [ ] Release created automatically

## ✅ Dependabot Validation

### Test 1: Dependabot Configuration

1. **Check Dependabot status:**
   - Insights → Dependency graph → Dependabot
   - [ ] Dependabot is active
   - [ ] Configuration file recognized
   - [ ] Update schedules displayed

2. **Verify first run:**
   - [ ] Wait for Monday (npm updates) or manually trigger
   - [ ] PRs created for available updates
   - [ ] PRs have correct labels and assignees
   - [ ] Related updates are grouped

### Test 2: Dependabot PR Handling

1. **Review Dependabot PR:**
   - [ ] CI runs automatically on Dependabot PR
   - [ ] Tests pass with updated dependencies
   - [ ] Review and merge (or close) as appropriate

## ✅ Performance Validation

### CI Pipeline Performance

- [ ] **Total CI time: <5 minutes** for typical PR
- [ ] **Cache effectiveness: >80%** (check logs for cache hits)
- [ ] **Parallel execution:** Jobs run simultaneously where possible
- [ ] **Resource usage:** Within GitHub Actions limits

### Build Performance

- [ ] **Build time: <3 minutes** for production build
- [ ] **Test execution: <2 minutes** for full test suite
- [ ] **Lint/format: <1 minute** for code quality checks

## ✅ Error Handling Testing

### Test 1: Failing Tests

1. **Create failing test:**

   ```typescript
   // Add to any test file
   it("should fail for validation", () => {
     expect(true).toBe(false);
   });
   ```

2. **Verify behavior:**
   - [ ] CI pipeline fails at test stage
   - [ ] Subsequent stages don't run (fail-fast)
   - [ ] PR merge is blocked
   - [ ] Clear error messages in logs

### Test 2: Build Failures

1. **Create build error:**

   ```typescript
   // Add syntax error to any component
   const BrokenComponent = () => {
     return <div>Unclosed tag;
   }
   ```

2. **Verify behavior:**
   - [ ] Build stage fails with clear error
   - [ ] Artifacts still uploaded for debugging
   - [ ] PR status shows failure

### Test 3: Lint Failures

1. **Create lint error:**

   ```typescript
   // Add unused variable
   const unusedVariable = "test";
   ```

2. **Verify behavior:**
   - [ ] Lint stage fails
   - [ ] Specific lint errors shown
   - [ ] Other stages may still run

## ✅ Cleanup

### Remove Test Resources

- [ ] **Delete test branch:** `test/ci-validation`
- [ ] **Remove test files:** `TEST.md`, failing tests, etc.
- [ ] **Close test PRs:** If any remain open
- [ ] **Verify clean state:** Repository back to original state

### Final Validation

- [ ] **CI working:** Create one final test PR to confirm
- [ ] **Documentation updated:** Team knows how to use new CI/CD
- [ ] **Secrets secured:** All sensitive data properly stored
- [ ] **Monitoring setup:** Team can check CI/CD health

## 🎉 Success Criteria

Your CI/CD pipeline is successfully configured when:

✅ **All checklist items completed**  
✅ **PRs automatically run comprehensive checks**  
✅ **Branch protection prevents broken code merges**  
✅ **Team can deploy with confidence**  
✅ **Dependencies stay automatically updated**  
✅ **Pipeline completes in <5 minutes**

## 🆘 Troubleshooting

If any checklist items fail:

1. **Check GitHub Actions logs** for detailed error messages
2. **Review SETUP.md** for configuration instructions
3. **Verify all secrets** are correctly set
4. **Test locally first** - ensure tests pass on your machine
5. **Check branch protection settings** match requirements
6. **Validate workflow file syntax** using GitHub's workflow validator

---

**Need Help?** Open an issue or review the documentation in this `.github/` directory.

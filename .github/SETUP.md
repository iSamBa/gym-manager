# CI/CD Setup Guide

This guide walks you through setting up the complete CI/CD pipeline for the gym management system.

## 📋 Prerequisites

- [ ] Admin access to the GitHub repository
- [ ] Repository has `main` and `dev` branches
- [ ] All workflow files are committed to the repository

## 🛡️ Branch Protection Rules Setup

### Step 1: Navigate to Branch Protection Settings

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Branches**
4. Click **Add rule** or **Add branch protection rule**

### Step 2: Configure Main Branch Protection

**Branch name pattern:** `main`

**Protect matching branches:**

- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `1`
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners (if CODEOWNERS file exists)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `CI Success`
    - `Lint & Format Check`
    - `Unit Tests`
    - `Build Application`

- ✅ **Require conversation resolution before merging**

- ✅ **Require signed commits** (recommended)

- ✅ **Require linear history** (recommended)

- ✅ **Restrict pushes that create files**
  - **Restrict to push rules:** None (allow all file types)

- **Rules applied to administrators:**
  - ❌ Do not include administrators (allows admin override in emergencies)

- ✅ **Allow force pushes**
  - ❌ Everyone (no one can force push)

- ✅ **Allow deletions**
  - ❌ No one can delete this branch

### Step 3: Configure Dev Branch Protection

**Branch name pattern:** `dev`

**Protect matching branches:**

- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `1` (can be reduced to 0 for development speed)
  - ❌ Dismiss stale PR approvals (more flexible for dev branch)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `CI Success`
    - `Lint & Format Check`
    - `Unit Tests`
    - `Build Application`

- ❌ **Require conversation resolution** (optional for dev)

- **Other settings:** Less restrictive than main branch

## 🔧 Environment Setup

### Step 1: Create GitHub Environments

1. Go to **Settings** → **Environments**
2. Click **New environment**

**Create these environments:**

**Staging Environment:**

- Name: `staging`
- **Deployment branches:** Selected branches
  - Add rule: `main`
- **Environment secrets:** Add staging-specific secrets
- **Required reviewers:** Add team members (optional)

**Production Environment:**

- Name: `production`
- **Deployment branches:** Selected branches
  - Add rule: `main`
- **Environment secrets:** Add production secrets
- **Required reviewers:** Add at least 1-2 team members
- **Wait timer:** 5 minutes (gives time to cancel if needed)

### Step 2: Add Required Secrets

Go to **Settings** → **Secrets and variables** → **Actions**

**Repository secrets (if needed for deployment):**

```bash
# Example deployment secrets (add as needed)
VERCEL_TOKEN=your_vercel_token
NETLIFY_TOKEN=your_netlify_token
STAGING_HOST=staging.yourapp.com
STAGING_USER=deploy_user
STAGING_SSH_KEY=your_private_key
```

**Environment secrets:**

- Add environment-specific variables in each environment

## 🚀 Workflow Features

### CI Workflow (`ci.yml`)

**Triggers:**

- Pull requests to `main` or `dev`
- Pushes to `main`
- Manual trigger via GitHub UI

**Jobs:**

1. **Setup & Install** - Dependency caching and installation
2. **Lint & Format Check** - Code quality validation
3. **Unit Tests** - Vitest test suite with coverage
4. **Build Application** - Next.js production build
5. **E2E Tests** - Playwright tests (conditional)
6. **CI Success** - Status aggregation for branch protection

**Performance Features:**

- Dependency caching (`node_modules`, `.next/cache`)
- Parallel job execution
- Conditional E2E testing
- Artifact uploads for debugging

### Deploy Workflow (`deploy.yml`)

**Triggers:**

- Push to `main` (after CI passes)
- Manual trigger with environment selection
- CI workflow completion

**Features:**

- Environment-aware deployment
- Deployment status tracking
- Rollback preparation
- Release creation for production

### Dependabot (`dependabot.yml`)

**Features:**

- Weekly dependency updates
- Grouped related package updates
- Automated security patches
- GitHub Actions updates
- Ignore major version bumps for critical packages

## 🏷️ PR Labels for Enhanced Workflow

Create these labels in your repository (**Issues** → **Labels** → **New label**):

| Label            | Color     | Description                       |
| ---------------- | --------- | --------------------------------- |
| `run-e2e`        | `#0366d6` | Trigger E2E tests on this PR      |
| `e2e`            | `#0366d6` | Alternative trigger for E2E tests |
| `dependencies`   | `#0366d6` | Dependency updates                |
| `automated`      | `#7057ff` | Automated PRs (Dependabot)        |
| `github-actions` | `#2cbe4e` | GitHub Actions updates            |
| `skip-ci`        | `#d73a49` | Skip CI checks (use carefully)    |

## 📝 Usage Examples

### Running E2E Tests

**Option 1:** Add label to PR

- Add `run-e2e` or `e2e` label to any pull request

**Option 2:** Manual trigger

- Go to **Actions** → **CI** → **Run workflow**

**Option 3:** Automatic on main

- E2E tests always run on push to main

### Manual Deployment

1. Go to **Actions** → **Deploy** → **Run workflow**
2. Select branch (usually `main`)
3. Choose environment (`staging` or `production`)
4. Click **Run workflow**

### Checking CI Status

- All CI jobs must pass for PR merge
- Check **Checks** tab on pull requests
- View detailed logs in **Actions** tab

## 🔍 Monitoring and Troubleshooting

### Common Issues

**CI Job Failures:**

- Check **Actions** tab for detailed logs
- Review artifact uploads for build outputs
- Verify all required secrets are set

**Branch Protection Bypassing:**

- Only repository admins can override protection rules
- Use admin override sparingly and document reasons

**Deployment Failures:**

- Check environment-specific secrets and variables
- Verify deployment target connectivity
- Review deployment logs in workflow runs

### Performance Monitoring

**CI Pipeline Metrics:**

- Target: <5 minutes total CI time
- Monitor cache hit rates
- Track test execution times

**Optimization Tips:**

- Use `npm ci` instead of `npm install`
- Leverage GitHub Actions cache effectively
- Run independent jobs in parallel
- Skip unnecessary steps with conditions

## 🎯 Next Steps

1. **Immediate Setup:**
   - [ ] Configure branch protection rules
   - [ ] Create GitHub environments
   - [ ] Add required secrets
   - [ ] Create PR labels

2. **First Test:**
   - [ ] Create a test PR to `dev` branch
   - [ ] Verify all CI checks pass
   - [ ] Test merge process

3. **Production Readiness:**
   - [ ] Configure actual deployment targets
   - [ ] Set up monitoring and alerting
   - [ ] Document deployment procedures
   - [ ] Train team on workflow

4. **Future Enhancements:**
   - [ ] Add performance testing
   - [ ] Implement blue-green deployments
   - [ ] Set up automated rollbacks
   - [ ] Add deployment notifications

## 🆘 Support

For issues with this CI/CD setup:

1. Check GitHub Actions logs first
2. Review this documentation
3. Check GitHub's documentation on Actions and branch protection
4. Open an issue in the repository for team discussion

---

**Last updated:** [Current Date]
**Workflow version:** v1.0

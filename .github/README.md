# GitHub Configuration

This directory contains GitHub-specific configuration files for the gym management system.

## 📁 Structure

```
.github/
├── workflows/          # GitHub Actions workflows
│   ├── ci.yml         # Main CI pipeline
│   └── deploy.yml     # Deployment automation
├── dependabot.yml     # Automated dependency updates
├── SETUP.md          # Complete setup guide
└── README.md         # This file
```

## 🔄 Workflows

### CI Workflow (`ci.yml`)

**Purpose:** Validate code quality and functionality on every PR

**Triggers:**

- Pull requests to `main` and `dev` branches
- Push to `main` branch
- Manual execution

**Pipeline Stages:**

1. **Setup** → Dependencies and caching
2. **Quality Checks** → Lint, format, type checking
3. **Testing** → Unit tests with coverage
4. **Build** → Production build verification
5. **E2E Testing** → End-to-end tests (conditional)

**Key Features:**

- ⚡ Fast feedback (~3-5 minutes)
- 🗂️ Intelligent caching for performance
- 🔄 Parallel job execution
- 📊 Test coverage reports
- 🎯 Conditional E2E testing

### Deploy Workflow (`deploy.yml`)

**Purpose:** Automated deployment to staging/production environments

**Triggers:**

- Successful CI completion on `main`
- Manual deployment with environment selection

**Capabilities:**

- 🌍 Multi-environment deployment (staging/production)
- 🔒 Environment-specific protection rules
- 📈 Deployment status tracking
- 🏷️ Automatic release creation
- ↩️ Rollback preparation

## 🤖 Dependabot Configuration

**Purpose:** Automated dependency management and security updates

**Features:**

- 📅 Weekly schedule (Mondays for npm, Tuesdays for Actions)
- 🎯 Grouped related package updates
- 🔒 Security patch prioritization
- ⬆️ Major version update controls
- 🏷️ Automatic labeling and assignment

**Package Groups:**

- React ecosystem (React, Next.js)
- Testing tools (Vitest, Playwright)
- Code quality (ESLint, Prettier)
- UI components (Radix, Tailwind)
- State management (Zustand, TanStack Query)
- Backend services (Supabase)

## 🛡️ Branch Protection

**Required Status Checks:**

- ✅ CI Success (aggregated status)
- ✅ Lint & Format Check
- ✅ Unit Tests
- ✅ Build Application

**Protection Rules:**

- 👥 Require PR review (1 approver)
- 🔄 Require up-to-date branches
- 💬 Require conversation resolution
- 🚫 No direct pushes to protected branches
- 📝 Linear history enforcement

## 🎯 Quick Start

1. **First Time Setup:**

   ```bash
   # Repository is already configured with workflows
   # Follow SETUP.md for GitHub UI configuration
   ```

2. **Creating a PR:**

   ```bash
   git checkout -b feature/your-feature
   git commit -m "feat: your changes"
   git push origin feature/your-feature
   # Create PR via GitHub UI → CI runs automatically
   ```

3. **Running E2E Tests:**
   - Add `run-e2e` label to PR, or
   - Push to `main` branch (auto-runs), or
   - Manual trigger via Actions tab

4. **Manual Deployment:**
   ```bash
   # Via GitHub UI:
   # Actions → Deploy → Run workflow → Select environment
   ```

## 📊 Monitoring

**CI Performance:**

- Target pipeline time: <5 minutes
- Cache effectiveness: >90% hit rate
- Test coverage: Maintain >80%

**Deployment Success:**

- Zero-downtime deployments
- Automatic rollback on failure
- Health check validation

## 🔧 Customization

### Adding New Environments

1. Update `deploy.yml` workflow
2. Create GitHub environment in Settings
3. Configure environment-specific secrets

### Modifying CI Checks

1. Edit `ci.yml` workflow
2. Update branch protection requirements
3. Test changes on feature branch first

### Custom Notification Integrations

Add to workflow files:

```yaml
- name: Slack Notification
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Branch Protection Guide](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Dependabot Configuration](https://docs.github.com/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [Environment Protection Rules](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)

---

**Questions or Issues?**

- Check the [SETUP.md](./SETUP.md) guide
- Review workflow run logs in the Actions tab
- Open an issue for team discussion

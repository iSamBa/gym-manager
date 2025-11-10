# Deployment Guide

This guide provides comprehensive instructions for deploying the Gym Manager application to production, including monitoring setup, environment configuration, and rollback procedures.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Process](#deployment-process)
- [Monitoring Setup](#monitoring-setup)
- [Database Migrations](#database-migrations)
- [Rollback Procedures](#rollback-procedures)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying to production, ensure you have:

### Required Accounts & Services

- [ ] **Supabase Project**: Production project created and configured
- [ ] **Sentry Account**: Error tracking project created
- [ ] **Hosting Platform**: Vercel, Netlify, or similar (recommended: Vercel for Next.js)
- [ ] **Domain**: Custom domain configured (optional)

### Development Requirements

- [ ] **Node.js 18+**: Installed on local machine
- [ ] **Git**: Repository access and proper branching strategy
- [ ] **Environment Variables**: All required variables documented in `.env.example`

### Quality Gates

- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Database migrations tested on staging
- [ ] Security audit completed (RLS policies verified)

---

## Environment Variables

### Required Variables

Copy `.env.example` to `.env.production` and configure the following:

#### Supabase Configuration

```bash
# Supabase API URL (from Supabase Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous Key (public key, safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Sentry Configuration (Error Tracking)

```bash
# Sentry DSN (from Sentry Dashboard > Settings > Projects > [project] > Client Keys)
# REQUIRED in production
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456

# Sentry Organization slug
SENTRY_ORG=your-org-slug

# Sentry Project slug
SENTRY_PROJECT=gym-manager

# Sentry Auth Token (for source map uploads)
# Create at: https://sentry.io/settings/account/api/auth-tokens/
# Required scopes: project:releases, org:read
SENTRY_AUTH_TOKEN=your-auth-token-here
```

#### Environment

```bash
NODE_ENV=production
```

### Environment Variable Validation

The application uses Zod schemas to validate environment variables at startup. If any required variables are missing or invalid, the application will fail to start with a clear error message.

See `src/lib/env.ts` for validation logic.

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npm run build` (checks types)
- [ ] No `console.log` statements (use logger utility)
- [ ] No `any` types in TypeScript

### Security

- [ ] Environment variables validated with Zod
- [ ] RLS policies enabled on all sensitive tables
- [ ] No secrets committed to repository
- [ ] `.env.local` added to `.gitignore`
- [ ] Sentry DSN configured
- [ ] Authentication middleware protecting routes

### Performance

- [ ] Bundle size under 400 KB per route
- [ ] Images optimized with Next.js Image component
- [ ] Database queries indexed
- [ ] Pagination implemented on large datasets
- [ ] Heavy libraries (jsPDF, charts) dynamically imported

### Database

- [ ] All migrations applied to staging
- [ ] Database indexes created
- [ ] RPC functions tested
- [ ] Data integrity constraints verified
- [ ] Backup strategy in place

### Documentation

- [ ] `DEPLOYMENT.md` reviewed (this file)
- [ ] `RLS-POLICIES.md` up to date
- [ ] `RPC_SIGNATURES.md` reflects current functions
- [ ] Runbook created for common operations

---

## Deployment Process

### Step 1: Prepare Production Environment

1. **Create Supabase Production Project**

   ```bash
   # Go to https://supabase.com/dashboard
   # Click "New project"
   # Choose production-tier resources
   # Note: Project URL and API keys
   ```

2. **Create Sentry Production Project**

   ```bash
   # Go to https://sentry.io/organizations/[org]/projects/
   # Click "Create Project"
   # Choose "Next.js" platform
   # Note: DSN and Auth Token
   ```

3. **Configure Environment Variables**

   For Vercel:

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Link project
   vercel link

   # Add environment variables
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add NEXT_PUBLIC_SENTRY_DSN production
   vercel env add SENTRY_ORG production
   vercel env add SENTRY_PROJECT production
   vercel env add SENTRY_AUTH_TOKEN production
   vercel env add NODE_ENV production
   ```

### Step 2: Apply Database Migrations

**CRITICAL**: Test migrations on staging first!

1. **Create Database Backup**

   ```bash
   # From Supabase Dashboard > Database > Backups
   # Click "Create backup"
   # Wait for confirmation
   ```

2. **Apply Migrations**

   Use Supabase MCP server or CLI:

   ```bash
   # Using Supabase CLI
   npx supabase db push

   # Or apply migrations manually in Supabase SQL Editor
   # Copy from user_stories/production-readiness/migrations/
   ```

3. **Verify RLS Policies**

   ```bash
   # Test with different user roles
   # Verify RLS preventing unauthorized access
   # See docs/RLS-POLICIES.md for details
   ```

### Step 3: Deploy Application

#### Option A: Deploy with Vercel (Recommended)

```bash
# Production deployment
vercel --prod

# Monitor deployment
vercel logs --follow
```

#### Option B: Deploy with Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Option C: Deploy with Docker

```bash
# Build Docker image
docker build -t gym-manager:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY \
  -e NEXT_PUBLIC_SENTRY_DSN=$SENTRY_DSN \
  gym-manager:latest
```

### Step 4: Verify Deployment

See [Post-Deployment Verification](#post-deployment-verification) section below.

---

## Monitoring Setup

### Sentry Configuration

1. **Verify Error Tracking**
   - Trigger a test error in production
   - Check Sentry dashboard for error capture
   - Verify source maps uploaded correctly

2. **Configure Alert Rules**

   In Sentry Dashboard:
   - Go to **Settings > Alerts**
   - Create alert: "High Error Rate"
     - Condition: `errors > 10 in 1 hour`
     - Action: Email/Slack notification
   - Create alert: "Slow Queries"
     - Condition: `duration > 500ms`
     - Action: Email notification

3. **Set Up Performance Monitoring**
   - Enable Performance in Sentry project settings
   - Configure sample rate (10% recommended)
   - Set up transaction thresholds

### Supabase Monitoring

1. **Database Performance**
   - Monitor query performance in Supabase Dashboard > Database > Query Performance
   - Set up alerts for slow queries (>500ms)
   - Track connection pool usage

2. **API Usage**
   - Monitor API requests in Dashboard > API > Logs
   - Set up rate limiting if needed
   - Track error rates

### Application Monitoring

1. **Core Web Vitals**
   - Monitor in Sentry Performance tab
   - Track: FCP, LCP, CLS, FID, TTFB
   - Set alerts for poor scores

2. **Custom Metrics**

   Use monitoring utilities from `src/lib/monitoring.ts`:

   ```typescript
   import { trackPerformance, trackQueryPerformance } from "@/lib/monitoring";

   // Track custom operations
   trackPerformance({
     name: "member_import",
     value: duration,
     tags: { count: memberCount },
   });

   // Track database queries
   trackQueryPerformance({
     query: "fetch_active_members",
     duration: queryTime,
     status: "success",
     timestamp: Date.now(),
   });
   ```

---

## Database Migrations

### Migration Strategy

1. **Create Migration**

   ```bash
   # Using Supabase MCP
   # Create migration file in user_stories/[feature]/migrations/
   ```

2. **Test on Staging**

   ```bash
   # Apply to staging database first
   # Verify data integrity
   # Test rollback procedure
   ```

3. **Apply to Production**

   ```bash
   # Create backup first (see Step 2 above)
   # Apply migration during low-traffic window
   # Monitor error logs during and after migration
   ```

### Migration Checklist

- [ ] Migration tested on staging
- [ ] Rollback procedure documented
- [ ] Backup created before migration
- [ ] Migration applied during maintenance window
- [ ] Data integrity verified after migration
- [ ] Application functionality tested
- [ ] Performance monitored for regressions

---

## Rollback Procedures

### Application Rollback

#### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

#### Manual Rollback

```bash
# Checkout previous working version
git checkout [previous-commit-hash]

# Redeploy
vercel --prod
```

### Database Rollback

1. **Restore from Backup**

   ```bash
   # From Supabase Dashboard > Database > Backups
   # Select backup
   # Click "Restore"
   # WARNING: This will overwrite current database
   ```

2. **Revert Migrations**

   ```sql
   -- Manually revert migration changes
   -- See migration file for reverse operations
   -- Example:
   DROP INDEX IF EXISTS idx_members_status;
   ```

### Rollback Decision Matrix

| Issue Type          | Severity | Rollback Application? | Rollback Database? |
| ------------------- | -------- | --------------------- | ------------------ |
| UI Bug              | Low      | No                    | No                 |
| API Error           | Medium   | Yes                   | No                 |
| Data Corruption     | High     | Yes                   | Yes                |
| Security Breach     | Critical | Yes                   | Assess             |
| Performance Degr.   | Medium   | Assess                | No                 |
| Failed Migration    | High     | Yes                   | Yes                |
| Authentication Fail | Critical | Yes                   | No                 |

---

## Post-Deployment Verification

### Manual Testing Checklist

1. **Authentication**
   - [ ] Login with valid credentials
   - [ ] Logout works correctly
   - [ ] Session persistence across page refresh
   - [ ] Protected routes redirect to login
   - [ ] Token refresh works

2. **Core Functionality**
   - [ ] Create new member
   - [ ] Update member details
   - [ ] Delete member (if applicable)
   - [ ] Create subscription
   - [ ] Process payment
   - [ ] Book training session
   - [ ] Generate invoice PDF

3. **Data Display**
   - [ ] Members list loads correctly
   - [ ] Pagination works
   - [ ] Search/filter functions
   - [ ] Detail pages render
   - [ ] Charts display data

4. **Performance**
   - [ ] Page load time <3 seconds
   - [ ] No console errors
   - [ ] Images load correctly
   - [ ] Database queries <500ms

5. **Monitoring**
   - [ ] Sentry capturing errors
   - [ ] Performance metrics tracking
   - [ ] Source maps working (stack traces readable)
   - [ ] Alerts configured and working

### Automated Checks

```bash
# Run production health checks
curl https://your-domain.com/api/health

# Check Sentry integration
curl -X POST https://your-domain.com/api/test-sentry

# Verify database connection
curl https://your-domain.com/api/db-health
```

### Performance Benchmarks

| Metric         | Target  | How to Verify                        |
| -------------- | ------- | ------------------------------------ |
| FCP            | <1.8s   | Sentry Performance > Web Vitals      |
| LCP            | <2.5s   | Sentry Performance > Web Vitals      |
| CLS            | <0.1    | Sentry Performance > Web Vitals      |
| Database Query | <500ms  | Supabase Dashboard > Query Perf      |
| API Response   | <200ms  | Sentry Performance > Transactions    |
| Bundle Size    | <400 KB | Build output or Vercel Analytics     |
| Error Rate     | <0.1%   | Sentry Dashboard > Issues            |
| Uptime         | >99.9%  | Vercel Analytics or external monitor |

---

## Troubleshooting

### Common Issues

#### Issue: Environment Variables Not Loading

**Symptoms**: Application fails to start, "Environment validation failed" error

**Solution**:

```bash
# Verify all variables are set
vercel env ls

# Check .env.production file locally
cat .env.production

# Re-add missing variables
vercel env add [VARIABLE_NAME] production
```

#### Issue: Sentry Not Capturing Errors

**Symptoms**: Errors not appearing in Sentry dashboard

**Solution**:

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Check Sentry project is active
3. Trigger test error:

   ```typescript
   // Add to a test page
   throw new Error("Sentry test error");
   ```

4. Check browser console for Sentry initialization errors
5. Verify source maps uploaded: `vercel logs | grep sentry`

#### Issue: Database Connection Errors

**Symptoms**: "Failed to connect to database" errors

**Solution**:

1. Verify Supabase URL and keys are correct
2. Check Supabase project status
3. Verify RLS policies not blocking access
4. Check connection pool limits in Supabase settings

#### Issue: Slow Page Load Times

**Symptoms**: Pages take >5 seconds to load

**Solution**:

1. Check bundle size: `npm run build`
2. Verify images optimized (using Next.js Image)
3. Check database query performance in Supabase
4. Review Sentry Performance tab for bottlenecks
5. Verify CDN caching enabled

#### Issue: Authentication Failures

**Symptoms**: Users can't log in, session errors

**Solution**:

1. Verify Supabase auth settings
2. Check redirect URLs configured correctly
3. Verify cookies enabled in production domain
4. Check browser console for auth errors
5. Review middleware configuration

### Emergency Contacts

| Role             | Contact             | When to Contact                   |
| ---------------- | ------------------- | --------------------------------- |
| DevOps Lead      | [Name/Email]        | Deployment failures, infra issues |
| Database Admin   | [Name/Email]        | Database errors, migrations       |
| Security Lead    | [Name/Email]        | Security incidents, breaches      |
| Product Owner    | [Name/Email]        | Business-critical issues          |
| Supabase Support | support@supabase.io | Platform issues                   |
| Sentry Support   | support@sentry.io   | Monitoring issues                 |
| Hosting Support  | [Vercel/Netlify]    | Hosting, deployment issues        |

### Monitoring Dashboards

- **Sentry Dashboard**: https://sentry.io/organizations/[org]/issues/
- **Supabase Dashboard**: https://supabase.com/dashboard/project/[project-id]
- **Vercel Analytics**: https://vercel.com/[team]/[project]/analytics
- **Application Status**: https://your-domain.com/api/health

---

## Production Readiness Checklist

Use this checklist before each production deployment:

### Pre-Deployment

- [ ] All user stories completed and tested
- [ ] Code reviewed and approved
- [ ] Tests passing (100% pass rate)
- [ ] Linting clean (0 errors, 0 warnings)
- [ ] Build successful
- [ ] Environment variables configured
- [ ] Database migrations tested on staging
- [ ] Security audit completed
- [ ] Performance benchmarks met

### Deployment

- [ ] Database backup created
- [ ] Migrations applied successfully
- [ ] Application deployed
- [ ] DNS/domain configured
- [ ] SSL certificate active
- [ ] Monitoring configured

### Post-Deployment

- [ ] Manual testing completed
- [ ] Performance verified
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Team notified
- [ ] Documentation updated

---

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Sentry Next.js Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [RLS Policies Documentation](./RLS-POLICIES.md)
- [Database RPC Functions](./RPC_SIGNATURES.md)

---

**Last Updated**: 2025-11-09
**Version**: 1.0.0
**Maintained By**: Development Team

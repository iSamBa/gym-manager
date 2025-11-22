# Monitoring and Error Tracking Setup

## Overview

This document provides comprehensive guidance for configuring, using, and troubleshooting the monitoring and error tracking infrastructure for the Gym Manager application.

**Monitoring Stack**:

- **Sentry** (@sentry/nextjs v10.23.0) - Error tracking and performance monitoring
- **Custom Monitoring** (`src/lib/monitoring.ts`) - Performance utilities
- **Next.js Instrumentation** (`instrumentation.ts`) - Server-side monitoring hooks

**Last Updated**: 2025-01-22

---

## Table of Contents

1. [Sentry Configuration](#sentry-configuration)
2. [Performance Monitoring](#performance-monitoring)
3. [Error Tracking](#error-tracking)
4. [Alert Rules](#alert-rules)
5. [Source Maps](#source-maps)
6. [Dashboard Setup](#dashboard-setup)
7. [Troubleshooting](#troubleshooting)

---

## Sentry Configuration

### Overview

Sentry is configured for all Next.js runtime environments:

- **Client-side** (`sentry.client.config.ts`) - Browser error tracking and Web Vitals
- **Server-side** (`sentry.server.config.ts`) - API route and server component errors
- **Edge Runtime** (`sentry.edge.config.ts`) - Middleware and edge function errors

### Installation

**Already installed**. If reinstalling from scratch:

```bash
npm install --save @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Environment Variables

Required environment variables in `.env.local`:

```bash
# Sentry DSN (Data Source Name)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id

# Optional: Sentry configuration
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token

# Node environment
NODE_ENV=production  # or development
```

**Security Note**: `NEXT_PUBLIC_SENTRY_DSN` is exposed to the client. Use proper Sentry project settings to control what gets accepted.

### Configuration Files

#### 1. Client Configuration (`sentry.client.config.ts`)

```typescript
import * as Sentry from "@sentry/nextjs";
import { env, isDevelopment } from "@/lib/env";

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,

  // Sample rate for performance monitoring (10% of transactions)
  tracesSampleRate: 0.1,

  // Debug mode (disable in production)
  debug: false,

  // Environment name
  environment: env.NODE_ENV,

  // Only send events in production
  beforeSend(event) {
    if (isDevelopment()) {
      return null;
    }
    return event;
  },

  // Session Replay configuration
  replaysOnErrorSampleRate: 1.0, // 100% of errors
  replaysSessionSampleRate: 0.1, // 10% of normal sessions

  // Replay integration for session recording
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true, // Privacy: mask all text
      blockAllMedia: true, // Privacy: block images/videos
    }),
  ],
});
```

**Key Settings**:

- **tracesSampleRate**: 10% sampling to reduce costs
- **replaysOnErrorSampleRate**: Record all error sessions
- **replaysSessionSampleRate**: Record 10% of normal sessions
- **beforeSend**: Prevents development errors from being sent

---

#### 2. Server Configuration (`sentry.server.config.ts`)

```typescript
import * as Sentry from "@sentry/nextjs";
import { env, isDevelopment } from "@/lib/env";

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,

  // Sample rate for performance monitoring
  tracesSampleRate: 0.1,

  // Debug mode
  debug: false,

  // Environment
  environment: env.NODE_ENV,

  // Only send events in production
  beforeSend(event) {
    if (isDevelopment()) {
      return null;
    }
    return event;
  },
});
```

**Differences from Client**:

- No Session Replay (server-side only)
- Same sampling rates for consistency

---

#### 3. Edge Configuration (`sentry.edge.config.ts`)

```typescript
import * as Sentry from "@sentry/nextjs";
import { env, isDevelopment } from "@/lib/env";

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,

  // Sample rate for performance monitoring
  tracesSampleRate: 0.1,

  // Debug mode
  debug: false,

  // Environment
  environment: env.NODE_ENV,

  // Only send events in production
  beforeSend(event) {
    if (isDevelopment()) {
      return null;
    }
    return event;
  },
});
```

**Edge Runtime Notes**:

- Lightweight configuration for edge functions
- Same security model as server-side

---

#### 4. Next.js Configuration (`next.config.ts`)

```typescript
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Your Next.js config
};

// Sentry webpack plugin options
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs in CI
  silent: !process.env.CI,

  // Upload larger source maps for better stack traces
  widenClientFileUpload: true,

  // Annotate React components in breadcrumbs
  reactComponentAnnotation: {
    enabled: true,
  },

  // Tunnel Sentry requests through Next.js rewrite (bypass ad-blockers)
  tunnelRoute: "/monitoring",

  // Hide source maps from client bundles
  hideSourceMaps: true,

  // Tree-shake Sentry logger statements
  disableLogger: true,

  // Vercel Cron Monitors (automatic instrumentation)
  automaticVercelMonitors: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
```

**Key Features**:

- **tunnelRoute**: Routes Sentry traffic through `/monitoring` to bypass ad-blockers
- **hideSourceMaps**: Prevents source maps from being publicly accessible
- **reactComponentAnnotation**: Adds component names to error breadcrumbs
- **disableLogger**: Removes Sentry debug logs from production builds

---

## Performance Monitoring

### Web Vitals Tracking

Web Vitals are automatically tracked via `src/lib/monitoring.ts` and reported to Sentry.

#### Setup

**Add to `src/app/layout.tsx`**:

```typescript
import { reportWebVital } from "@/lib/monitoring";

export function reportWebVitals(metric: NextWebVitalsMetric) {
  reportWebVital(metric);
}
```

#### Tracked Metrics

| Metric   | Name                      | Purpose                             |
| -------- | ------------------------- | ----------------------------------- |
| **FCP**  | First Contentful Paint    | Time to first content rendered      |
| **LCP**  | Largest Contentful Paint  | Time to largest content rendered    |
| **CLS**  | Cumulative Layout Shift   | Visual stability score              |
| **FID**  | First Input Delay         | Interaction responsiveness (legacy) |
| **TTFB** | Time to First Byte        | Server response time                |
| **INP**  | Interaction to Next Paint | Interaction responsiveness (new)    |

**Automatic Actions**:

- Metrics logged in development (console)
- Metrics sent to Sentry in production
- Poor metrics trigger warnings in logs
- Measurements added to error context

#### Viewing Web Vitals in Sentry

1. Navigate to **Performance** tab in Sentry
2. Select **Web Vitals** from sidebar
3. View distribution across metrics
4. Filter by route, browser, device

---

### Custom Performance Metrics

Use the monitoring utilities to track custom performance:

#### Example: Track API Response Time

```typescript
import { trackPerformance } from "@/lib/monitoring";

export async function GET(request: Request) {
  const start = performance.now();

  const data = await fetchData();

  trackPerformance({
    name: "api_members_fetch",
    value: performance.now() - start,
    unit: "ms",
    tags: {
      route: "/api/members",
      count: data.length.toString(),
    },
  });

  return Response.json(data);
}
```

#### Example: Track Database Query

```typescript
import { trackQueryPerformance } from "@/lib/monitoring";

const start = performance.now();
try {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("status", "active");

  if (error) throw error;

  trackQueryPerformance({
    query: "fetch_active_members",
    duration: performance.now() - start,
    status: "success",
    timestamp: Date.now(),
    tags: {
      table: "members",
      rows: data.length.toString(),
    },
  });
} catch (error) {
  trackQueryPerformance({
    query: "fetch_active_members",
    duration: performance.now() - start,
    status: "error",
    timestamp: Date.now(),
    tags: { error: error.message },
  });
  throw error;
}
```

**Slow Query Alert**: Queries > 500ms are automatically logged as warnings.

---

### Performance Tracker Utility

For complex operations, use the performance tracker:

```typescript
import { createPerformanceTracker } from "@/lib/monitoring";

async function processData() {
  const tracker = createPerformanceTracker("data_processing");

  // Step 1
  await fetchData();

  // Step 2
  await transformData();

  // Step 3
  await saveData();

  const duration = tracker.end({
    tags: { records: "1000" },
  });

  console.log(`Processing took ${duration}ms`);
}
```

---

### Async Function Tracking

Wrap async functions for automatic tracking:

```typescript
import { trackAsyncPerformance } from "@/lib/monitoring";

// Original function
async function fetchMembers() {
  const { data } = await supabase.from("members").select("*");
  return data;
}

// Wrapped with tracking
const fetchMembersWithTracking = trackAsyncPerformance(
  "fetch_members",
  fetchMembers,
  { feature: "members-list" }
);

// Use tracked version
const members = await fetchMembersWithTracking();
```

---

## Error Tracking

### Automatic Error Capture

Sentry automatically captures:

- ✅ Unhandled exceptions (client + server)
- ✅ Unhandled promise rejections
- ✅ React component errors (via error boundaries)
- ✅ API route errors
- ✅ Middleware errors

### Manual Error Capture

#### Capture Exception

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    level: "error",
    tags: {
      feature: "member-creation",
      user_id: userId,
    },
    extra: {
      memberData: sanitizedData,
      timestamp: Date.now(),
    },
  });

  // Handle error gracefully
  toast.error("Failed to create member");
}
```

#### Capture Message

```typescript
import * as Sentry from "@sentry/nextjs";

// Log a warning
Sentry.captureMessage("Slow query detected", {
  level: "warning",
  tags: {
    query: "fetch_members",
    duration: "520ms",
  },
});
```

---

### Error Context

Add context to errors before they're captured:

#### Set User Context

```typescript
import * as Sentry from "@sentry/nextjs";

// In authentication handler
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: `${user.first_name} ${user.last_name}`,
  role: user.role,
});

// Clear on logout
Sentry.setUser(null);
```

#### Set Tags

```typescript
Sentry.setTag("feature", "payments");
Sentry.setTag("subscription_type", "premium");
```

#### Set Context

```typescript
Sentry.setContext("member", {
  id: member.id,
  type: member.member_type,
  status: member.status,
  subscription_active: hasActiveSubscription,
});
```

#### Add Breadcrumbs

```typescript
Sentry.addBreadcrumb({
  category: "user-action",
  message: "User clicked create member button",
  level: "info",
  data: {
    button_id: "create-member-btn",
    page: "/members",
  },
});
```

**Breadcrumbs are automatically added for**:

- Console logs
- Network requests (fetch/XHR)
- User interactions (clicks)
- Navigation changes
- Performance metrics

---

### Error Grouping

Sentry groups errors by:

1. Error type (TypeError, ReferenceError, etc.)
2. Error message
3. Stack trace fingerprint

**Custom Fingerprinting**:

```typescript
Sentry.captureException(error, {
  fingerprint: ["database-error", error.code, error.table],
});
```

---

## Alert Rules

### Sentry Alert Configuration

Navigate to **Alerts** in Sentry dashboard to configure:

#### 1. Error Spike Alert

**Trigger**: When error rate increases by > 50% in 5 minutes

**Configuration**:

```yaml
Alert Name: Error Spike
Conditions:
  - Type: Error
  - Metric: Count of errors
  - Threshold: 50% increase
  - Time Window: 5 minutes
Actions:
  - Send email to: team@example.com
  - Send Slack notification to: #alerts
```

---

#### 2. High Error Rate Alert

**Trigger**: When error rate > 10 errors/minute

**Configuration**:

```yaml
Alert Name: High Error Rate
Conditions:
  - Type: Error
  - Metric: Count of errors
  - Threshold: > 10 per minute
  - Time Window: 1 minute
Actions:
  - Send email
  - Create PagerDuty incident
```

---

#### 3. Performance Degradation Alert

**Trigger**: When P95 LCP > 4 seconds

**Configuration**:

```yaml
Alert Name: Slow Page Load
Conditions:
  - Type: Performance
  - Metric: LCP
  - Percentile: p95
  - Threshold: > 4000ms
  - Time Window: 10 minutes
Actions:
  - Send Slack notification
  - Create issue in GitHub
```

---

#### 4. Slow Query Alert

**Trigger**: When database query > 1 second

**Configuration**:

```yaml
Alert Name: Slow Database Query
Conditions:
  - Type: Performance
  - Metric: Query Duration
  - Threshold: > 1000ms
  - Tag filter: category=query
Actions:
  - Send email to: dev-team@example.com
```

---

### Recommended Alert Rules

| Alert                     | Severity | Threshold         | Recipients         |
| ------------------------- | -------- | ----------------- | ------------------ |
| Error Spike               | High     | +50% in 5min      | Team email + Slack |
| High Error Rate           | Critical | >10/min           | PagerDuty + Email  |
| Slow Page Load (LCP)      | Medium   | P95 > 4s          | Slack #performance |
| Slow Query                | Medium   | >1s               | Email dev-team     |
| Failed Deployments        | High     | Any deploy errors | Team email + Slack |
| High Session Replay Usage | Low      | >1000/day         | Email (cost alert) |

---

## Source Maps

### Purpose

Source maps enable Sentry to un-minify stack traces, showing original code locations instead of bundled/minified positions.

### Configuration

**Already configured in `next.config.ts`**:

```typescript
const sentryWebpackPluginOptions = {
  // Upload source maps during build
  widenClientFileUpload: true,

  // Hide source maps from public access
  hideSourceMaps: true,

  // Auth token for upload
  authToken: process.env.SENTRY_AUTH_TOKEN,

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
};
```

### Upload Process

**Automatic during production build**:

```bash
# Build production app
npm run build

# Source maps uploaded automatically by Sentry webpack plugin
# Check output for:
# ✓ Source maps uploaded successfully
```

### Manual Upload (if needed)

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Configure auth
export SENTRY_AUTH_TOKEN=your-token
export SENTRY_ORG=your-org
export SENTRY_PROJECT=your-project

# Upload source maps
sentry-cli sourcemaps upload \
  --release=your-release-version \
  --url-prefix='~/_next' \
  .next
```

### Verify Source Maps

1. Trigger an error in production
2. Open error in Sentry dashboard
3. Check stack trace - should show original filenames and line numbers
4. If showing minified code, source maps failed to upload

**Common Issues**:

- Missing `SENTRY_AUTH_TOKEN` environment variable
- Wrong `SENTRY_ORG` or `SENTRY_PROJECT` values
- Build failed during source map upload step
- Network issues during CI/CD build

---

## Dashboard Setup

### Sentry Dashboard Structure

#### 1. Issues Dashboard

**URL**: `https://sentry.io/organizations/[org]/issues/`

**Widgets to Add**:

- Errors by route
- Errors by browser
- Errors by user role
- Error trends (7 days)
- Most frequent errors (top 10)

---

#### 2. Performance Dashboard

**URL**: `https://sentry.io/organizations/[org]/performance/`

**Widgets to Add**:

- Web Vitals summary (FCP, LCP, CLS, FID, TTFB, INP)
- Slowest transactions (top 10)
- Transaction duration trends
- Database query performance
- API response times

---

#### 3. Releases Dashboard

**URL**: `https://sentry.io/organizations/[org]/releases/`

**Purpose**: Track errors by deployment version

**Setup**:

```bash
# Tag releases during deployment
export SENTRY_RELEASE=$(git rev-parse HEAD)

# Or in package.json
{
  "scripts": {
    "build": "SENTRY_RELEASE=$(git rev-parse HEAD) next build"
  }
}
```

**Benefits**:

- Compare error rates between releases
- Identify which deployment introduced new errors
- Track resolution of issues across releases

---

#### 4. Alerts Dashboard

**URL**: `https://sentry.io/organizations/[org]/alerts/`

**Configure alerts** (see Alert Rules section)

---

### Custom Dashboards

Create custom dashboards for specific needs:

#### Example: Member Management Health Dashboard

**Metrics**:

- Member creation errors
- Member list load time (P50, P95, P99)
- Search query performance
- Member profile load time

**Alerts**:

- Member creation failure rate > 5%
- Search query > 500ms
- Member list load > 3s

---

## Troubleshooting

### Sentry Not Capturing Errors

**Symptoms**: No errors appearing in Sentry dashboard

**Diagnosis Steps**:

1. **Check environment variables**:

   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   # Should output: https://...@sentry.io/...
   ```

2. **Verify Sentry initialization**:
   - Check browser console for Sentry SDK loading errors
   - Look for "Sentry SDK initialized" message (if debug: true)

3. **Check beforeSend filter**:

   ```typescript
   // In sentry config
   beforeSend(event) {
     console.log('Sentry event:', event);  // Add temporarily
     if (isDevelopment()) {
       return null;  // ⚠️ This prevents dev errors
     }
     return event;
   }
   ```

4. **Test error capture manually**:

   ```typescript
   // Add to a page component
   import * as Sentry from '@sentry/nextjs';

   function TestButton() {
     return (
       <button onClick={() => {
         Sentry.captureMessage('Test error', 'error');
       }}>
         Test Sentry
       </button>
     );
   }
   ```

5. **Check Sentry project settings**:
   - Verify DSN is correct
   - Check rate limits (Settings > Quotas)
   - Verify project is not archived

---

### Source Maps Not Working

**Symptoms**: Stack traces show minified code in Sentry

**Solutions**:

1. **Verify source maps uploaded**:

   ```bash
   # Check build logs for:
   # ✓ Source maps uploaded to Sentry
   npm run build 2>&1 | grep -i sentry
   ```

2. **Check release tagging**:
   - Ensure `SENTRY_RELEASE` matches between build and runtime
   - Verify release exists in Sentry Releases page

3. **Verify auth token**:

   ```bash
   # Test token
   export SENTRY_AUTH_TOKEN=your-token
   sentry-cli releases list
   # Should list releases without error
   ```

4. **Check source map URLs**:
   - Source maps must match exact file paths in errors
   - Verify `url-prefix` in upload command matches runtime paths

---

### High Event Volume (Cost Management)

**Symptoms**: Exceeding Sentry event quotas, unexpected costs

**Solutions**:

1. **Reduce sample rates**:

   ```typescript
   // In sentry.client.config.ts
   tracesSampleRate: 0.05,  // Reduce from 0.1 to 0.05 (5%)
   replaysSessionSampleRate: 0.05,  // Reduce from 0.1 to 0.05
   ```

2. **Filter noisy errors**:

   ```typescript
   beforeSend(event) {
     // Ignore specific errors
     if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
       return null;
     }
     return event;
   }
   ```

3. **Set rate limits in Sentry**:
   - Navigate to Settings > Quotas
   - Set per-key rate limits
   - Configure spike protection

4. **Review inbound filters**:
   - Enable "Filter out known web crawlers"
   - Enable "Filter out localhost errors"
   - Add custom filters for browser extensions

---

### Performance Data Not Appearing

**Symptoms**: No transactions in Performance tab

**Solutions**:

1. **Verify tracesSampleRate**:

   ```typescript
   // Must be > 0
   tracesSampleRate: 0.1,  // 10% of transactions
   ```

2. **Check if transactions are being created**:

   ```typescript
   // Manual transaction for testing
   const transaction = Sentry.startTransaction({
     name: "test-transaction",
     op: "test",
   });

   // ... do work ...

   transaction.finish();
   ```

3. **Verify environment is production**:
   - Performance monitoring often disabled in development
   - Check `beforeSend` filter isn't blocking production events

---

### Web Vitals Not Reported

**Symptoms**: No Web Vitals in Sentry Performance tab

**Solutions**:

1. **Add reportWebVitals to layout**:

   ```typescript
   // src/app/layout.tsx
   import { reportWebVital } from "@/lib/monitoring";

   export function reportWebVitals(metric: NextWebVitalsMetric) {
     reportWebVital(metric);
   }
   ```

2. **Verify production deployment**:
   - Web Vitals use real user monitoring
   - Requires actual user traffic in production

3. **Check browser compatibility**:
   - Web Vitals require modern browsers
   - Some metrics (INP) are newer and have limited support

---

## Testing Monitoring Setup

### Development Testing

```typescript
// Add to any component for testing
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

function MonitoringTest() {
  const testError = () => {
    try {
      throw new Error('Test error for Sentry');
    } catch (error) {
      Sentry.captureException(error);
      logger.error('Test error captured', { error });
    }
  };

  const testPerformance = () => {
    trackPerformance({
      name: 'test_metric',
      value: 123,
      tags: { test: 'true' }
    });
    logger.info('Test performance metric sent');
  };

  return (
    <div>
      <button onClick={testError}>Test Error Tracking</button>
      <button onClick={testPerformance}>Test Performance</button>
    </div>
  );
}
```

### Production Testing

**Staged Rollout**:

1. Deploy to staging environment first
2. Generate test errors and performance events
3. Verify data appears in Sentry
4. Check alerts trigger correctly
5. Deploy to production with confidence

---

## Best Practices

### Error Handling

✅ **Do**:

- Always add context to errors (user, feature, tags)
- Sanitize sensitive data before capture
- Use appropriate severity levels (error, warning, info)
- Group related errors with fingerprints
- Add breadcrumbs for debugging context

❌ **Don't**:

- Capture expected errors (use logs instead)
- Send PII (personally identifiable information)
- Over-sample (causes cost issues)
- Ignore beforeSend filters

---

### Performance Monitoring

✅ **Do**:

- Use sampling to control costs (10% is reasonable)
- Track critical user journeys
- Monitor database query performance
- Set up alerts for degradation
- Review performance regularly

❌ **Don't**:

- Track every single operation (too noisy)
- Ignore slow query warnings
- Skip performance budgets
- Forget to update thresholds as app grows

---

### Cost Management

✅ **Do**:

- Set rate limits in Sentry project settings
- Use appropriate sample rates
- Filter noisy errors (browser extensions, bots)
- Review quota usage monthly
- Archive old releases

❌ **Don't**:

- Sample at 100% (very expensive)
- Leave debug mode on in production
- Ignore cost alerts from Sentry

---

## Additional Resources

- **Sentry Documentation**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Web Vitals Library**: https://github.com/GoogleChrome/web-vitals
- **Next.js Instrumentation**: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
- **Performance Benchmarks**: See `docs/PERFORMANCE-BENCHMARKS.md`
- **Database Monitoring**: See `docs/DATABASE-INDEXES.md`

---

**Document Version**: 1.0
**Last Updated**: 2025-01-22
**Maintained By**: Development Team
**Review Schedule**: Quarterly, or after major changes

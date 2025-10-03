# Deployment & Production Guide

## Production Build Process

```bash
# 1. Pre-deployment checks
npm run lint          # Must pass with 0 errors
npm run test          # Must pass with 100% success
npm run build         # Must complete successfully
npm run analyze       # Check bundle size

# 2. Environment verification
# Ensure production environment variables are set
# Verify Supabase production project configuration
# Check all API endpoints are accessible

# 3. Production deployment
npm run build
npm start             # Test production build locally first
```

## Environment Variables

**Required for Production:**

```bash
# .env.production or deployment platform
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-production-domain.com
```

**Security Checklist:**

- [ ] Never commit `.env.local` to git
- [ ] Use different Supabase projects for dev/staging/prod
- [ ] Rotate API keys regularly
- [ ] Enable RLS on all Supabase tables
- [ ] Use service role key only for server-side operations

## Performance Monitoring

**Post-Deployment Verification:**

```bash
# Use tools like:
# - Lighthouse for performance scoring
# - Chrome DevTools for bundle analysis
# - React DevTools Profiler for runtime performance

# Target metrics:
# - First Contentful Paint: < 1.5s
# - Largest Contentful Paint: < 2.5s
# - Cumulative Layout Shift: < 0.1
# - First Input Delay: < 100ms
```

**Bundle Size Monitoring:**

- Initial bundle should be < 500KB gzipped
- Monitor for unexpected size increases
- Use `npm run analyze` before each deployment

## Database Considerations

**Production Database Setup:**

- Enable Point-in-Time Recovery (PITR)
- Set up automated backups
- Configure proper connection pooling
- Monitor query performance
- Set up alerts for slow queries (>500ms)

**Migration Strategy:**

- Test migrations on staging first
- Use database transactions for multi-step changes
- Have rollback plan for each migration
- Monitor database performance after deployments

## Monitoring & Alerting

**Key Metrics to Monitor:**

- Application uptime and response times
- Database connection pool usage
- Error rates in logs
- User authentication success rates
- Bundle size and performance metrics

**Recommended Tools:**

- Vercel Analytics (if deployed on Vercel)
- Supabase Dashboard for database metrics
- Sentry for error tracking
- Google Analytics for user behavior

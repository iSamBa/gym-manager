# Troubleshooting Guide

## Common Development Issues

### Environment Setup Problems

**Node.js Version Issues:**

```bash
# Check Node version
node --version

# If < 18, update Node.js:
# - Use Node Version Manager (nvm) recommended
# - Or download from nodejs.org
```

**Package Installation Failures:**

```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# If still failing, try:
npm install --legacy-peer-deps
```

### Supabase Connection Issues

**Environment Variables Not Loading:**

```bash
# Verify .env.local exists and has correct format
cat .env.local

# Should contain:
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Database Connection Errors:**

- Check Supabase project status in dashboard
- Verify URL format: `https://your-project.supabase.co`
- Ensure API key is the "anon/public" key, not service role
- Check network connectivity and firewall settings

### Build & Development Issues

**Tailwind CSS Not Working:**

```bash
# Restart dev server after Tailwind config changes
npm run dev

# Check tailwind.config.js for correct paths
# Ensure all content paths include your files
```

**TypeScript Errors:**

```bash
# Clear TypeScript cache
rm -rf .next
npm run build

# Check tsconfig.json path aliases
# Ensure all imports use correct @ aliases
```

**Linting Failures:**

```bash
# Auto-fix common issues
npm run lint -- --fix

# If persistent errors, check:
# - Unused imports
# - Missing React import for JSX
# - Incorrect file extensions (.js vs .tsx)
```

### Performance Issues During Development

**Slow Hot Reload:**

- Check if too many files are being watched
- Exclude `node_modules` from file watchers
- Close unnecessary browser tabs
- Restart development server

**Memory Issues:**

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

### Database/Supabase Issues

**RLS Policy Errors:**

- Check Row Level Security policies in Supabase dashboard
- Ensure authenticated users have proper permissions
- Test policies with different user roles

**Migration Failures:**

- Check migration file syntax
- Verify foreign key constraints
- Ensure proper data types in schema

## Quick Diagnostic Commands

```bash
# Health check script
echo "=== Environment Check ==="
node --version
npm --version
git --version

echo "=== Project Check ==="
npm run lint
npm run build
npm test

echo "=== Dependencies Check ==="
npm audit
npm outdated
```

## Getting Help

1. **Check logs first**: Development server console, browser console, network tab
2. **Search existing issues**: Check repository issues for similar problems
3. **Include context**: Node version, OS, exact error messages
4. **Minimal reproduction**: Create smallest possible example that reproduces the issue

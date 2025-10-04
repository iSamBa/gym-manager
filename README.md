## Gym Manager

A comprehensive gym management system built with Next.js 15.5, React 19, and Supabase.

### Features

- **Enhanced Members Table** - Advanced member management with:
  - Real-time subscription tracking and status monitoring
  - Session statistics (last/next sessions, remaining/scheduled counts)
  - Financial tracking (balance, last payment date)
  - Advanced filtering (status, member type, subscription state, payment state)
  - Column visibility controls with persistent preferences
  - Server-side sorting and filtering for optimal performance
  - Responsive design for all device sizes
- **Subscription Management** - Track memberships, payments, and renewals
- **Training Sessions** - Schedule and manage training sessions
- **Trainer Management** - Manage trainer profiles and availability
- **Payment Processing** - Handle payments, refunds, and receipts

### Documentation

- [Members Table Architecture](./docs/members-table-architecture.md)
- [API Documentation](./docs/api/members-api.md)
- [Troubleshooting Guide](./docs/troubleshooting-members-table.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

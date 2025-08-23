# API Documentation

This document outlines the API structure for the Gym Manager application.

## Base Configuration

All API routes follow Next.js App Router conventions and are located in `src/app/api/`.

### Authentication

All API endpoints use Supabase authentication with JWT tokens.

### Response Format

```typescript
// Success Response
{
  success: true,
  data: any,
  message?: string
}

// Error Response
{
  success: false,
  error: string,
  statusCode: number
}
```

## Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Members

- `GET /api/members` - List all members
- `POST /api/members` - Create new member
- `GET /api/members/[id]` - Get member details
- `PUT /api/members/[id]` - Update member
- `DELETE /api/members/[id]` - Delete member

### Memberships

- `GET /api/memberships` - List all memberships
- `POST /api/memberships` - Create new membership
- `GET /api/memberships/[id]` - Get membership details
- `PUT /api/memberships/[id]` - Update membership
- `DELETE /api/memberships/[id]` - Delete membership

### Payments

- `GET /api/payments` - List all payments
- `POST /api/payments` - Process new payment
- `GET /api/payments/[id]` - Get payment details

## Database Schema

Refer to Supabase schema documentation for detailed table structures.

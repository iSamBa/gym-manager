# US-003: Environment Validation & Input Sanitization

**Status**: ✅ Completed
**Priority**: P0 (Must Have - Critical)
**Estimated Effort**: 4-5 hours
**Actual Effort**: 2.5 hours
**Sprint**: Week 1 - Security Hardening
**Completed**: 2025-11-09

---

## 📖 User Story

**As a** system administrator and security engineer
**I want** validated environment variables and sanitized user inputs
**So that** we prevent XSS attacks, runtime failures, and ensure configuration correctness

---

## 💼 Business Value

### Why This Matters

1. **Security**: Prevents XSS and injection attacks
2. **Reliability**: Catches configuration errors at startup
3. **Debugging**: Clear error messages for missing env vars
4. **Compliance**: Meets security best practices
5. **Prevention**: Stops attacks before they reach the database

### Cost of NOT Doing This

- **Security Breach**: XSS attacks via user comments/notes
- **Production Crashes**: Missing env vars cause runtime failures
- **Data Corruption**: Unsanitized input breaks display/storage
- **Lost Revenue**: Downtime from configuration issues

---

## ✅ Acceptance Criteria

### 1. Environment Validation

- [x] `src/lib/env.ts` created with Zod schema
- [x] All environment variables validated at startup
- [x] Invalid env vars cause clear error messages
- [x] Type-safe env object exported for use

### 2. Input Sanitization

- [x] `src/lib/sanitize.ts` created with DOMPurify
- [x] HTML sanitization for member notes
- [x] HTML sanitization for member comments
- [x] Text sanitization for search inputs
- [x] File upload validation (type, size, content)

### 3. Implementation Coverage

- [x] All env var usage migrated to validated env
- [x] All user-generated content sanitized before display
- [x] All file uploads validated before processing
- [x] URL validation for external links

### 4. Testing

- [x] Tests verify env validation catches errors
- [x] Tests verify XSS attempts are blocked
- [x] Tests verify file validation works
- [x] Manual security testing complete

---

## 🔧 Technical Implementation

### Step 1: Environment Validation

**Create** `src/lib/env.ts`:

```typescript
import { z } from "zod";

const envSchema = z.object({
  // Supabase (Required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, "Invalid Supabase anon key"),

  // Environment
  NODE_ENV: z.enum(["development", "production", "test"]),

  // Optional: Monitoring
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Optional: Analytics
  NEXT_PUBLIC_GA_ID: z.string().optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  });

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);

    throw new Error(
      "Invalid environment variables. Check the console for details."
    );
  }

  return parsed.data;
}

export const env = validateEnv();

// Type-safe usage:
// import { env } from '@/lib/env';
// const url = env.NEXT_PUBLIC_SUPABASE_URL; // Typed and validated!
```

### Step 2: Input Sanitization

**Create** `src/lib/sanitize.ts`:

```typescript
import DOMPurify from "isomorphic-dompurify";

/**
 * Configuration for HTML sanitization
 */
const sanitizeConfig = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "a"],
  ALLOWED_ATTR: ["href", "title", "target"],
  ALLOWED_URI_REGEXP: /^(?:https?:\/\/)/i,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Use for: member notes, comments, rich text fields
 *
 * @example
 * const safe = sanitizeHTML('<script>alert("xss")</script>Hello');
 * // Returns: 'Hello'
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, sanitizeConfig);
}

/**
 * Escapes plain text to prevent HTML injection
 * Use for: search queries, plain text inputs
 *
 * @example
 * const safe = sanitizeText('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert("xss")&lt;/script&gt;'
 */
export function sanitizeText(input: string): string {
  if (!input) return "";

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validates and sanitizes URLs
 * Use for: external links, profile pictures
 */
export function sanitizeURL(url: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // Only allow http(s) protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Validates file uploads
 */
export interface FileValidationOptions {
  maxSize?: number; // bytes
  allowedTypes?: string[]; // MIME types
  allowedExtensions?: string[];
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"],
  } = options;

  // Check size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed`,
    };
  }

  // Check extension
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} not allowed`,
    };
  }

  return { valid: true };
}
```

### Step 3: Update Existing Code

**Update** `src/lib/supabase.ts`:

```typescript
// Before
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// After
import { env } from "@/lib/env";

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
```

**Update Member Comment Components**:

```typescript
import { sanitizeHTML } from '@/lib/sanitize';

export function MemberNotes({ notes }: { notes: string }) {
  // Sanitize before displaying
  const safeNotes = sanitizeHTML(notes);

  return <div dangerouslySetInnerHTML={{ __html: safeNotes }} />;
}
```

**Update Form Submissions**:

```typescript
import { sanitizeText, sanitizeHTML } from '@/lib/sanitize';

export function MemberCommentForm() {
  const handleSubmit = async (data: FormData) => {
    const comment = data.get('comment') as string;

    // Sanitize before sending to database
    const safeComment = sanitizeHTML(comment);

    await createComment({
      member_id: memberId,
      comment: safeComment,
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Step 4: Add File Upload Validation

```typescript
import { validateFile } from '@/lib/sanitize';

export function ProfilePictureUpload() {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png'],
      allowedExtensions: ['.jpg', '.jpeg', '.png'],
    });

    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Proceed with upload
    uploadProfilePicture(file);
  };

  return <input type="file" accept="image/*" onChange={handleFileChange} />;
}
```

---

## 🧪 Testing Requirements

**Create** `src/lib/__tests__/env.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Environment Validation", () => {
  it("should throw error for missing SUPABASE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    expect(() => {
      require("@/lib/env");
    }).toThrow();

    vi.unstubAllEnvs();
  });

  it("should throw error for invalid URL format", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url");

    expect(() => {
      require("@/lib/env");
    }).toThrow();

    vi.unstubAllEnvs();
  });
});
```

**Create** `src/lib/__tests__/sanitize.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  sanitizeHTML,
  sanitizeText,
  sanitizeURL,
  validateFile,
} from "@/lib/sanitize";

describe("Input Sanitization", () => {
  describe("sanitizeHTML", () => {
    it("should remove script tags", () => {
      const dirty = '<script>alert("xss")</script>Hello';
      const clean = sanitizeHTML(dirty);

      expect(clean).not.toContain("<script>");
      expect(clean).toContain("Hello");
    });

    it("should allow safe HTML tags", () => {
      const dirty = "<p><strong>Hello</strong> <em>World</em></p>";
      const clean = sanitizeHTML(dirty);

      expect(clean).toContain("<strong>");
      expect(clean).toContain("<em>");
    });

    it("should remove dangerous attributes", () => {
      const dirty = '<a href="javascript:alert(1)">Click</a>';
      const clean = sanitizeHTML(dirty);

      expect(clean).not.toContain("javascript:");
    });
  });

  describe("sanitizeText", () => {
    it("should escape HTML entities", () => {
      const dirty = '<script>alert("xss")</script>';
      const clean = sanitizeText(dirty);

      expect(clean).toBe(
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;"
      );
    });
  });

  describe("validateFile", () => {
    it("should reject files over size limit", () => {
      const largeFile = new File(["x".repeat(10 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      });

      const result = validateFile(largeFile, { maxSize: 5 * 1024 * 1024 });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds");
    });

    it("should reject invalid file types", () => {
      const txtFile = new File(["hello"], "file.txt", { type: "text/plain" });

      const result = validateFile(txtFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("not allowed");
    });
  });
});
```

---

## 📚 Documentation Updates

**Update** `.env.example`:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Environment
NODE_ENV=development

# Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=your-sentry-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Update** `CLAUDE.md`:

Reference the new env validation and sanitization utilities in the security section.

---

## 🎯 Definition of Done

- [ ] `src/lib/env.ts` created and working
- [ ] `src/lib/sanitize.ts` created and working
- [ ] All env vars migrated to validated env
- [ ] User inputs sanitized before display
- [ ] File uploads validated
- [ ] Tests passing
- [ ] `.env.example` updated
- [ ] STATUS.md updated

---

## 🔗 Dependencies

**Depends On**: None
**Blocks**: None

---

**Created**: 2025-11-09
**Estimated Time**: 4-5 hours

/**
 * Input Sanitization & Validation Utilities
 *
 * Provides secure input sanitization for HTML content, URLs, file uploads,
 * and user-generated content to prevent XSS and other injection attacks.
 *
 * @see https://github.com/cure53/DOMPurify - DOMPurify documentation
 */

import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";
import { logger } from "./logger";

/**
 * HTML Sanitization Configuration
 */
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "code",
  "pre",
];

const ALLOWED_ATTRIBUTES = ["href", "title", "target", "rel"];

/**
 * File Upload Validation Configuration
 */
export const FILE_VALIDATION = {
  IMAGE: {
    ALLOWED_TYPES: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ] as const,
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_DIMENSION: 4096, // 4096px max width/height
  },
  DOCUMENT: {
    ALLOWED_TYPES: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ] as const,
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
  },
} as const;

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * @param html - Raw HTML string to sanitize
 * @param allowedTags - Optional custom allowed tags (defaults to ALLOWED_TAGS)
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```typescript
 * const userInput = '<script>alert("XSS")</script><p>Hello</p>';
 * const safe = sanitizeHtml(userInput);
 * // Returns: '<p>Hello</p>'
 * ```
 */
export function sanitizeHtml(
  html: string,
  allowedTags: string[] = ALLOWED_TAGS
): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  try {
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: ALLOWED_ATTRIBUTES,
      KEEP_CONTENT: true,
    });

    return sanitized;
  } catch (error) {
    logger.error("HTML sanitization failed", {
      error,
      htmlLength: html.length,
    });
    return "";
  }
}

/**
 * Sanitize plain text by stripping all HTML tags
 *
 * @param text - Text that may contain HTML
 * @returns Plain text with all HTML removed
 *
 * @example
 * ```typescript
 * const input = 'Hello <b>World</b>';
 * const safe = sanitizePlainText(input);
 * // Returns: 'Hello World'
 * ```
 */
export function sanitizePlainText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  try {
    // Strip all HTML tags
    const stripped = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true,
    });

    return stripped.trim();
  } catch (error) {
    logger.error("Plain text sanitization failed", {
      error,
      textLength: text.length,
    });
    return "";
  }
}

/**
 * Validate and sanitize URL
 *
 * @param url - URL string to validate
 * @param allowedProtocols - Allowed URL protocols (defaults to http/https)
 * @returns Sanitized URL or null if invalid
 *
 * @example
 * ```typescript
 * const url = sanitizeUrl('javascript:alert("XSS")');
 * // Returns: null
 *
 * const safe = sanitizeUrl('https://example.com');
 * // Returns: 'https://example.com'
 * ```
 */
export function sanitizeUrl(
  url: string,
  allowedProtocols: string[] = ["http:", "https:"]
): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  try {
    const trimmed = url.trim();
    const parsed = new URL(trimmed);

    // Check protocol is allowed
    if (!allowedProtocols.includes(parsed.protocol)) {
      logger.warn("Blocked URL with disallowed protocol", {
        protocol: parsed.protocol,
        url: trimmed.substring(0, 100),
      });
      return null;
    }

    // Return the href (normalized URL)
    return parsed.href;
  } catch {
    logger.warn("Invalid URL provided", { url: url.substring(0, 100) });
    return null;
  }
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

/**
 * Validate image file upload
 *
 * @param file - File object to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validateImageFile(file);
 * if (!result.valid) {
 *   toast.error(result.error);
 *   return;
 * }
 * ```
 */
export function validateImageFile(file: File): FileValidationResult {
  // Check file type
  if (!FILE_VALIDATION.IMAGE.ALLOWED_TYPES.includes(file.type as never)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${FILE_VALIDATION.IMAGE.ALLOWED_TYPES.join(", ")}`,
    };
  }

  // Check file size
  if (file.size > FILE_VALIDATION.IMAGE.MAX_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${FILE_VALIDATION.IMAGE.MAX_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true, file };
}

/**
 * Validate document file upload
 *
 * @param file - File object to validate
 * @returns Validation result with error message if invalid
 */
export function validateDocumentFile(file: File): FileValidationResult {
  // Check file type
  if (!FILE_VALIDATION.DOCUMENT.ALLOWED_TYPES.includes(file.type as never)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${FILE_VALIDATION.DOCUMENT.ALLOWED_TYPES.join(", ")}`,
    };
  }

  // Check file size
  if (file.size > FILE_VALIDATION.DOCUMENT.MAX_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${FILE_VALIDATION.DOCUMENT.MAX_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true, file };
}

/**
 * Validate image dimensions
 *
 * @param file - Image file to validate
 * @returns Promise resolving to validation result
 *
 * @example
 * ```typescript
 * const result = await validateImageDimensions(file);
 * if (!result.valid) {
 *   toast.error(result.error);
 * }
 * ```
 */
export async function validateImageDimensions(
  file: File
): Promise<FileValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      if (
        img.width > FILE_VALIDATION.IMAGE.MAX_DIMENSION ||
        img.height > FILE_VALIDATION.IMAGE.MAX_DIMENSION
      ) {
        resolve({
          valid: false,
          error: `Image dimensions too large. Maximum: ${FILE_VALIDATION.IMAGE.MAX_DIMENSION}x${FILE_VALIDATION.IMAGE.MAX_DIMENSION}px`,
        });
      } else {
        resolve({ valid: true, file });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: "Failed to load image. File may be corrupted.",
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Zod schema for email validation
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address")
  .min(3, "Email is too short")
  .max(255, "Email is too long");

/**
 * Zod schema for phone number validation (international format)
 */
export const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    "Invalid phone number. Use international format (e.g., +1234567890)"
  )
  .min(10, "Phone number is too short")
  .max(15, "Phone number is too long");

/**
 * Zod schema for URL validation
 */
export const urlSchema = z
  .string()
  .url("Invalid URL")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: "URL must use http or https protocol" }
  );

/**
 * Sanitize object with multiple string fields
 *
 * @param obj - Object to sanitize
 * @param fields - Fields to sanitize
 * @param sanitizer - Sanitization function to use
 * @returns New object with sanitized fields
 *
 * @example
 * ```typescript
 * const member = {
 *   name: '<b>John</b>',
 *   notes: '<script>alert("XSS")</script>Good member'
 * };
 *
 * const safe = sanitizeObject(member, ['name', 'notes'], sanitizePlainText);
 * // Returns: { name: 'John', notes: 'Good member' }
 * ```
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
  sanitizer: (value: string) => string = sanitizePlainText
): T {
  const sanitized = { ...obj };

  for (const field of fields) {
    const value = obj[field];
    if (typeof value === "string") {
      sanitized[field] = sanitizer(value) as T[keyof T];
    }
  }

  return sanitized;
}

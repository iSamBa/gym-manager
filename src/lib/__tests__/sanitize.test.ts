/**
 * Input Sanitization & Validation Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  sanitizeHtml,
  sanitizePlainText,
  sanitizeUrl,
  validateImageFile,
  validateDocumentFile,
  validateImageDimensions,
  sanitizeObject,
  emailSchema,
  phoneSchema,
  urlSchema,
  FILE_VALIDATION,
} from "../sanitize";

describe("sanitizeHtml", () => {
  it("should remove script tags", () => {
    const input = '<script>alert("XSS")</script><p>Hello</p>';
    const result = sanitizeHtml(input);

    expect(result).not.toContain("<script>");
    expect(result).toContain("<p>Hello</p>");
  });

  it("should remove onclick handlers", () => {
    const input = "<p onclick=\"alert('XSS')\">Click me</p>";
    const result = sanitizeHtml(input);

    expect(result).not.toContain("onclick");
    expect(result).toContain("<p>Click me</p>");
  });

  it("should allow safe HTML tags", () => {
    const input = "<p>Hello <strong>World</strong> with <em>emphasis</em></p>";
    const result = sanitizeHtml(input);

    expect(result).toContain("<p>");
    expect(result).toContain("<strong>");
    expect(result).toContain("<em>");
    expect(result).toContain("Hello");
  });

  it("should allow safe links with href", () => {
    const input = '<a href="https://example.com" title="Example">Link</a>';
    const result = sanitizeHtml(input);

    expect(result).toContain('<a href="https://example.com"');
    expect(result).toContain("Link");
  });

  it("should remove javascript: protocol from links", () => {
    const input = "<a href=\"javascript:alert('XSS')\">Bad Link</a>";
    const result = sanitizeHtml(input);

    expect(result).not.toContain("javascript:");
  });

  it("should handle empty input", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(null as unknown as string)).toBe("");
    expect(sanitizeHtml(undefined as unknown as string)).toBe("");
  });

  it("should handle non-string input", () => {
    expect(sanitizeHtml(123 as unknown as string)).toBe("");
    expect(sanitizeHtml({} as unknown as string)).toBe("");
  });

  it("should allow custom tags", () => {
    const input = "<div><p>Hello</p></div>";
    const result = sanitizeHtml(input, ["div", "p"]);

    expect(result).toContain("<div>");
    expect(result).toContain("<p>");
  });

  it("should handle complex XSS attempts", () => {
    const xssAttempts = [
      '<img src=x onerror="alert(1)">',
      '<svg onload="alert(1)">',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<object data="javascript:alert(1)">',
      '<embed src="javascript:alert(1)">',
    ];

    xssAttempts.forEach((xss) => {
      const result = sanitizeHtml(xss);
      expect(result).not.toContain("onerror");
      expect(result).not.toContain("onload");
      expect(result).not.toContain("javascript:");
    });
  });
});

describe("sanitizePlainText", () => {
  it("should strip all HTML tags", () => {
    const input = "Hello <b>World</b> <script>alert('XSS')</script>";
    const result = sanitizePlainText(input);

    expect(result).toBe("Hello World");
    expect(result).not.toContain("<b>");
    expect(result).not.toContain("<script>");
  });

  it("should trim whitespace", () => {
    const input = "  Hello World  ";
    const result = sanitizePlainText(input);

    expect(result).toBe("Hello World");
  });

  it("should handle empty input", () => {
    expect(sanitizePlainText("")).toBe("");
    expect(sanitizePlainText(null as unknown as string)).toBe("");
  });

  it("should preserve text content", () => {
    const input = "<p>Line 1</p><p>Line 2</p>";
    const result = sanitizePlainText(input);

    expect(result).toContain("Line 1");
    expect(result).toContain("Line 2");
  });
});

describe("sanitizeUrl", () => {
  it("should allow valid HTTPS URLs", () => {
    const result = sanitizeUrl("https://example.com");

    expect(result).toBe("https://example.com/");
  });

  it("should allow valid HTTP URLs", () => {
    const result = sanitizeUrl("http://example.com");

    expect(result).toBe("http://example.com/");
  });

  it("should block javascript: protocol", () => {
    const result = sanitizeUrl("javascript:alert('XSS')");

    expect(result).toBeNull();
  });

  it("should block data: protocol", () => {
    const result = sanitizeUrl("data:text/html,<script>alert('XSS')</script>");

    expect(result).toBeNull();
  });

  it("should handle invalid URLs", () => {
    expect(sanitizeUrl("not a url")).toBeNull();
    expect(sanitizeUrl("")).toBeNull();
    expect(sanitizeUrl(null as unknown as string)).toBeNull();
  });

  it("should normalize URLs", () => {
    const result = sanitizeUrl("  https://example.com  ");

    expect(result).toBe("https://example.com/");
  });

  it("should respect custom allowed protocols", () => {
    const result = sanitizeUrl("ftp://example.com", ["ftp:"]);

    expect(result).toBe("ftp://example.com/");
  });

  it("should block custom protocols not in allowlist", () => {
    const result = sanitizeUrl("ftp://example.com", ["http:", "https:"]);

    expect(result).toBeNull();
  });
});

describe("validateImageFile", () => {
  it("should validate correct image type", () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 1024 * 1024 }); // 1MB

    const result = validateImageFile(file);

    expect(result.valid).toBe(true);
    expect(result.file).toBe(file);
  });

  it("should reject invalid file type", () => {
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    const result = validateImageFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file type");
  });

  it("should reject file that is too large", () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", {
      value: FILE_VALIDATION.IMAGE.MAX_SIZE + 1,
    });

    const result = validateImageFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("too large");
  });

  it("should accept all allowed image types", () => {
    const types = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    types.forEach((type) => {
      const file = new File(["content"], `test.${type.split("/")[1]}`, {
        type,
      });
      Object.defineProperty(file, "size", { value: 1024 });

      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });
  });
});

describe("validateDocumentFile", () => {
  it("should validate PDF file", () => {
    const file = new File(["content"], "test.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(file, "size", { value: 1024 * 1024 });

    const result = validateDocumentFile(file);

    expect(result.valid).toBe(true);
  });

  it("should reject invalid document type", () => {
    const file = new File(["content"], "test.exe", {
      type: "application/x-executable",
    });

    const result = validateDocumentFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file type");
  });

  it("should reject document that is too large", () => {
    const file = new File(["content"], "test.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(file, "size", {
      value: FILE_VALIDATION.DOCUMENT.MAX_SIZE + 1,
    });

    const result = validateDocumentFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("too large");
  });
});

describe("validateImageDimensions", () => {
  beforeEach(() => {
    // Mock Image constructor for JSDOM
    global.Image = class {
      private _src = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 0;
      height = 0;

      set src(value: string) {
        this._src = value;
        setTimeout(() => {
          // Simulate image load
          if (this.onload) {
            this.width = 100;
            this.height = 100;
            this.onload();
          }
        }, 0);
      }

      get src() {
        return this._src;
      }
    } as unknown as typeof Image;

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = () => "blob:mock-url";
    global.URL.revokeObjectURL = () => {};
  });

  it("should validate image with acceptable dimensions", async () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    const result = await validateImageDimensions(file);

    expect(result.valid).toBe(true);
  });

  it("should reject image with dimensions too large", async () => {
    // Override Image mock for this test
    global.Image = class {
      private _src = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 5000;
      height = 5000;

      set src(value: string) {
        this._src = value;
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }

      get src() {
        return this._src;
      }
    } as unknown as typeof Image;

    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    const result = await validateImageDimensions(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("dimensions too large");
  });
});

describe("sanitizeObject", () => {
  it("should sanitize specified fields", () => {
    const obj = {
      name: "<b>John</b>",
      notes: '<script>alert("XSS")</script>Good member',
      age: 25,
    };

    const result = sanitizeObject(obj, ["name", "notes"]);

    expect(result.name).toBe("John");
    expect(result.notes).toBe("Good member");
    expect(result.age).toBe(25);
  });

  it("should not modify non-string fields", () => {
    const obj = {
      name: "John",
      count: 42,
      active: true,
      data: { nested: "value" },
    };

    const result = sanitizeObject(obj, ["name", "count", "active", "data"]);

    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
    expect(result.data).toEqual({ nested: "value" });
  });

  it("should use custom sanitizer", () => {
    const obj = {
      html: "<p>Hello</p>",
    };

    const result = sanitizeObject(obj, ["html"], sanitizeHtml);

    expect(result.html).toBe("<p>Hello</p>");
  });

  it("should not modify original object", () => {
    const obj = {
      name: "<b>John</b>",
    };

    const result = sanitizeObject(obj, ["name"]);

    expect(obj.name).toBe("<b>John</b>");
    expect(result.name).toBe("John");
  });
});

describe("Zod schemas", () => {
  describe("emailSchema", () => {
    it("should validate correct email", () => {
      const result = emailSchema.safeParse("test@example.com");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("test@example.com");
      }
    });

    it("should lowercase email", () => {
      const result = emailSchema.safeParse("Test@Example.COM");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("test@example.com");
      }
    });

    it("should trim email", () => {
      const result = emailSchema.safeParse("  test@example.com  ");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("test@example.com");
      }
    });

    it("should reject invalid email", () => {
      const result = emailSchema.safeParse("not-an-email");

      expect(result.success).toBe(false);
    });

    it("should reject email that is too short", () => {
      const result = emailSchema.safeParse("a@b");

      expect(result.success).toBe(false);
    });
  });

  describe("phoneSchema", () => {
    it("should validate international phone number", () => {
      const result = phoneSchema.safeParse("+1234567890");

      expect(result.success).toBe(true);
    });

    it("should validate phone without plus", () => {
      const result = phoneSchema.safeParse("1234567890");

      expect(result.success).toBe(true);
    });

    it("should reject invalid phone number", () => {
      const result = phoneSchema.safeParse("abc123");

      expect(result.success).toBe(false);
    });

    it("should reject phone that is too short", () => {
      const result = phoneSchema.safeParse("123");

      expect(result.success).toBe(false);
    });

    it("should reject phone that is too long", () => {
      const result = phoneSchema.safeParse("+12345678901234567890");

      expect(result.success).toBe(false);
    });
  });

  describe("urlSchema", () => {
    it("should validate HTTPS URL", () => {
      const result = urlSchema.safeParse("https://example.com");

      expect(result.success).toBe(true);
    });

    it("should validate HTTP URL", () => {
      const result = urlSchema.safeParse("http://example.com");

      expect(result.success).toBe(true);
    });

    it("should reject javascript: protocol", () => {
      const result = urlSchema.safeParse("javascript:alert('XSS')");

      expect(result.success).toBe(false);
    });

    it("should reject invalid URL", () => {
      const result = urlSchema.safeParse("not a url");

      expect(result.success).toBe(false);
    });

    it("should reject ftp protocol", () => {
      const result = urlSchema.safeParse("ftp://example.com");

      expect(result.success).toBe(false);
    });
  });
});

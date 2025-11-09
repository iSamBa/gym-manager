/**
 * LogoUploadField Component
 * File upload component for company logo with preview and validation
 * Supports PNG and JPG formats, max 2MB
 */

"use client";

import { memo, useCallback, useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LogoUploadFieldProps {
  /** Current logo URL (if exists) */
  currentLogoUrl?: string | null;
  /** Callback when file is selected */
  onChange: (file: File | null) => void;
  /** Whether the upload is disabled */
  disabled?: boolean;
  /** Validation error message */
  error?: string;
}

function LogoUploadFieldComponent({
  currentLogoUrl,
  onChange,
  disabled = false,
  error,
}: LogoUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate file type and size
   */
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      return "Only PNG and JPG files are allowed";
    }

    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return "File size must be less than 2MB";
    }

    return null;
  }, []);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        onChange(null);
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      onChange(file);
    },
    [validateFile, onChange]
  );

  /**
   * Handle file input change
   */
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  /**
   * Handle drag and drop
   */
  const handleDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const file = event.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [disabled, handleFileSelect]
  );

  /**
   * Handle remove logo
   */
  const handleRemove = useCallback(() => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onChange]);

  /**
   * Trigger file input click
   */
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const displayUrl = preview || currentLogoUrl;

  return (
    <div className="space-y-2">
      <Label htmlFor="logo-upload">Company Logo</Label>

      <div
        className={cn(
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 transition-colors",
          dragActive && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          error && "border-destructive"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!disabled ? handleClick : undefined}
      >
        {displayUrl ? (
          /* Preview Mode */
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt="Company logo preview"
              className="max-h-[160px] max-w-full object-contain"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          /* Upload Prompt */
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="bg-muted rounded-full p-4">
              {dragActive ? (
                <Upload className="text-primary h-8 w-8" />
              ) : (
                <ImageIcon className="text-muted-foreground h-8 w-8" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {dragActive
                  ? "Drop logo here"
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-muted-foreground text-xs">
                PNG or JPG (max. 2MB)
              </p>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          id="logo-upload"
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}

// Export memoized component for performance
export const LogoUploadField = memo(LogoUploadFieldComponent);
LogoUploadField.displayName = "LogoUploadField";

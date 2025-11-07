import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  certificationOptions,
  languageOptions,
  type FormStepProps,
} from "./types";

interface SpecializationsStepProps extends FormStepProps {
  availableSpecializations: { id: string; name: string }[];
  addLanguage: (lang: string) => void;
  removeLanguage: (lang: string) => void;
  addSpecialization: (spec: string) => void;
  removeSpecialization: (spec: string) => void;
  addCertification: (cert: string) => void;
  removeCertification: (cert: string) => void;
}

export const SpecializationsStep = memo(function SpecializationsStep({
  form,
  availableSpecializations,
  addLanguage,
  removeLanguage,
  addSpecialization,
  removeSpecialization,
  addCertification,
  removeCertification,
}: SpecializationsStepProps) {
  return (
    <div className="space-y-4">
      {/* Languages - Required */}
      <FormField
        control={form.control}
        name="languages"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Languages *</FormLabel>
            <Select value="" onValueChange={addLanguage}>
              <FormControl>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Add language..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {languageOptions
                  .filter((lang) => {
                    const currentLangs = Array.isArray(field.value)
                      ? field.value
                      : [];
                    return !currentLangs.includes(lang);
                  })
                  .map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.isArray(field.value)
                ? field.value.map((lang) => (
                    <Badge
                      key={lang}
                      variant="default"
                      className={cn(
                        "cursor-pointer",
                        field.value.length === 1
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-destructive hover:text-destructive-foreground"
                      )}
                      onClick={() =>
                        field.value.length > 1 && removeLanguage(lang)
                      }
                    >
                      {lang} {field.value.length > 1 && "×"}
                    </Badge>
                  ))
                : null}
            </div>
            <FormDescription>
              At least one language is required for client communication
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Specializations - Optional */}
      <FormField
        control={form.control}
        name="specializations"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Specializations</FormLabel>
            <Select value="" onValueChange={addSpecialization}>
              <FormControl>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Add specialization..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableSpecializations
                  .filter((spec) => {
                    const currentSpecs = Array.isArray(field.value)
                      ? field.value
                      : [];
                    return !currentSpecs.includes(spec.name);
                  })
                  .map((spec) => (
                    <SelectItem key={spec.id} value={spec.name}>
                      {spec.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.isArray(field.value)
                ? field.value.map((spec) => (
                    <Badge
                      key={spec}
                      variant="secondary"
                      className="hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                      onClick={() => removeSpecialization(spec)}
                    >
                      {spec} ×
                    </Badge>
                  ))
                : null}
            </div>
            <FormDescription>
              Optional - areas of fitness expertise and focus
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Certifications - Optional */}
      <FormField
        control={form.control}
        name="certifications"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Certifications</FormLabel>
            <Select value="" onValueChange={addCertification}>
              <FormControl>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Add certification..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {certificationOptions
                  .filter((cert) => {
                    const currentCerts = Array.isArray(field.value)
                      ? field.value
                      : [];
                    return !currentCerts.includes(cert);
                  })
                  .map((cert) => (
                    <SelectItem key={cert} value={cert}>
                      {cert}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.isArray(field.value)
                ? field.value.map((cert) => (
                    <Badge
                      key={cert}
                      variant="outline"
                      className="hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                      onClick={() => removeCertification(cert)}
                    >
                      {cert} ×
                    </Badge>
                  ))
                : null}
            </div>
            <FormDescription>
              Optional - professional certifications and qualifications
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});

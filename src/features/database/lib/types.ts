// Database types - Legacy file maintained for backward compatibility
// This file re-exports all types from the modular type organization
// All types are now organized in src/features/database/lib/types/

// Import and re-export everything from the modular structure
export * from "./types/index";

// This file is maintained for backward compatibility.
// New code should import from the modular structure:
// import type { Member } from "@/features/database/lib/types/member.types";
// or from the barrel export:
// import type { Member } from "@/features/database/lib/types";

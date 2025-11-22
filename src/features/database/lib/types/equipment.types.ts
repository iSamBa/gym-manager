// Equipment-related types and interfaces

import type { EquipmentStatus } from "./enums.types";

// Equipment
export interface Equipment {
  id: string;
  equipment_number: string;
  name: string;
  brand?: string;
  model?: string;
  category_id?: string;
  description?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expires?: string;
  status: EquipmentStatus;
  location?: string;
  max_weight?: number;
  specifications?: Record<string, unknown>;
  usage_instructions?: string;
  safety_notes?: string;
  qr_code_url?: string;
  image_urls?: string[];
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_interval_days: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Equipment with category information
 * Type alias since no additional fields are needed
 * (EquipmentCategory table has been removed)
 */
export type EquipmentWithCategory = Equipment;

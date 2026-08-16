export type VehicleType = "car" | "motorcycle" | "other";
export type FuelType = "petrol" | "diesel" | "lpg" | "methane" | "electric" | "hybrid";
export type ExpiryStatusName = "ok" | "warning" | "critical" | "unknown";

export interface Vehicle {
  id: number;
  owner_id: number | null;
  plate: string;
  make: string;
  model: string;
  year: number | null;
  vehicle_type: VehicleType;
  fuel_type: FuelType | null;
  vin: string | null;
  registration_date: string | null;
  photo_path: string | null;
  notes: string | null;
  created_at: string;
}

export interface ExpiryInfo {
  due_date: string | null;
  days_until: number | null;
  status: ExpiryStatusName;
  last_amount_cents: number | null;
}

export interface FuelStats {
  fillups_count: number;
  total_amount_cents: number | null;
  total_milliliters: number | null;
  avg_l_per_100km: number | null;
  avg_km_per_l: number | null;
  cost_per_km_cents: number | null;
  last_l_per_100km: number | null;
}

export interface VehicleStatus {
  vehicle_id: number;
  insurance: ExpiryInfo;
  inspection: ExpiryInfo;
  road_tax: ExpiryInfo;
  service: ExpiryInfo;
  tires: ExpiryInfo;
  current_km: number | null;
  fuel: FuelStats | null;
}

export interface VehicleWithStatus extends Vehicle {
  status: VehicleStatus;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Insurance {
  id: number;
  vehicle_id: number;
  company: string;
  policy_number: string | null;
  start_date: string;
  end_date: string;
  amount_cents: number | null;
  paid_on: string | null;
  notes: string | null;
  created_at: string;
}

export interface Inspection {
  id: number;
  vehicle_id: number;
  performed_on: string;
  expires_on: string;
  amount_cents: number | null;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export interface Service {
  id: number;
  vehicle_id: number;
  performed_on: string;
  km_at_service: number | null;
  amount_cents: number | null;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export interface RoadTax {
  id: number;
  vehicle_id: number;
  expires_on: string;
  paid_on: string | null;
  amount_cents: number | null;
  notes: string | null;
  created_at: string;
}

export interface TireChange {
  id: number;
  vehicle_id: number;
  changed_on: string;
  km_at_change: number | null;
  tire_type: "summer" | "winter" | "all_season" | null;
  brand: string | null;
  model: string | null;
  amount_cents: number | null;
  notes: string | null;
  created_at: string;
}

export interface TireRotation {
  id: number;
  vehicle_id: number;
  rotated_on: string;
  km_at_rotation: number | null;
  notes: string | null;
  created_at: string;
}

export interface OdometerReading {
  id: number;
  vehicle_id: number;
  reading_date: string;
  km: number;
  notes: string | null;
  created_at: string;
}

export interface FuelLog {
  id: number;
  vehicle_id: number;
  filled_on: string;
  km: number | null;
  milliliters: number;
  amount_cents: number | null;
  is_full_tank: boolean;
  station: string | null;
  notes: string | null;
  price_per_liter_cents: number | null;
  created_at: string;
}

export interface Member {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Family {
  id: number;
  name: string;
  created_at: string;
  members: Member[];
}

export interface FamilyInvite {
  id: number;
  code: string;
  expires_at: string;
  created_at: string;
  used_at: string | null;
}

export interface InvitePreview {
  family_name: string;
  valid: boolean;
}

export interface AuthConfig {
  registration_enabled: boolean;
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string | null;
  family_id: number | null;
  created_at: string;
}

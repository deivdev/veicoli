export type VehicleType = "car" | "motorcycle" | "other";
export type FuelType = "petrol" | "diesel" | "lpg" | "methane" | "electric" | "hybrid";
export type ExpiryStatusName = "ok" | "warning" | "critical" | "unknown";

export interface Vehicle {
  id: number;
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

export interface VehicleStatus {
  vehicle_id: number;
  insurance: ExpiryInfo;
  inspection: ExpiryInfo;
  road_tax: ExpiryInfo;
  service: ExpiryInfo;
  tires: ExpiryInfo;
  current_km: number | null;
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

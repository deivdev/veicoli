import type { EntityConfig } from "@/components/entity-tab";
import { formatMoney } from "./format";
import type {
  FuelLog,
  Inspection,
  Insurance,
  OdometerReading,
  RoadTax,
  Service,
  TireChange,
  TireRotation,
} from "./types";

export const insuranceConfig: EntityConfig<Insurance> = {
  title: "Assicurazione",
  endpoint: "insurances",
  fields: [
    { key: "company", label: "Compagnia", type: "text", required: true },
    { key: "policy_number", label: "Numero polizza", type: "text" },
    { key: "start_date", label: "Data inizio", type: "date", required: true },
    { key: "end_date", label: "Data scadenza", type: "date", required: true },
    { key: "paid_on", label: "Data pagamento", type: "date" },
    { key: "amount_cents", label: "Importo (€)", type: "money" },
    { key: "notes", label: "Note", type: "textarea" },
  ],
  columns: ["company", "start_date", "end_date", "amount_cents", "paid_on"],
};

export const inspectionConfig: EntityConfig<Inspection> = {
  title: "Revisione",
  endpoint: "inspections",
  fields: [
    { key: "performed_on", label: "Data revisione", type: "date", required: true },
    { key: "expires_on", label: "Scadenza", type: "date", required: true },
    { key: "amount_cents", label: "Importo (€)", type: "money" },
    { key: "location", label: "Centro revisione", type: "text" },
    { key: "notes", label: "Note", type: "textarea" },
  ],
  columns: ["performed_on", "expires_on", "amount_cents", "location"],
};

export const serviceConfig: EntityConfig<Service> = {
  title: "Tagliando",
  endpoint: "services",
  fields: [
    { key: "performed_on", label: "Data", type: "date", required: true },
    { key: "km_at_service", label: "Chilometraggio", type: "number" },
    { key: "amount_cents", label: "Importo (€)", type: "money" },
    { key: "location", label: "Officina", type: "text" },
    { key: "notes", label: "Note", type: "textarea" },
  ],
  columns: ["performed_on", "km_at_service", "amount_cents", "location"],
};

export const roadTaxConfig: EntityConfig<RoadTax> = {
  title: "Bollo",
  endpoint: "road-taxes",
  fields: [
    { key: "expires_on", label: "Scadenza", type: "date", required: true },
    { key: "paid_on", label: "Data pagamento", type: "date" },
    { key: "amount_cents", label: "Importo (€)", type: "money" },
    { key: "notes", label: "Note", type: "textarea" },
  ],
  columns: ["expires_on", "paid_on", "amount_cents"],
};

export const tireChangeConfig: EntityConfig<TireChange> = {
  title: "Cambio gomme",
  endpoint: "tire-changes",
  fields: [
    { key: "changed_on", label: "Data", type: "date", required: true },
    { key: "km_at_change", label: "Chilometraggio", type: "number" },
    {
      key: "tire_type",
      label: "Tipo",
      type: "select",
      options: [
        { value: "summer", label: "Estive" },
        { value: "winter", label: "Invernali" },
        { value: "all_season", label: "All season" },
      ],
    },
    { key: "brand", label: "Marca", type: "text" },
    { key: "model", label: "Modello", type: "text" },
    { key: "amount_cents", label: "Importo (€)", type: "money" },
    { key: "notes", label: "Note", type: "textarea" },
  ],
  columns: ["changed_on", "tire_type", "brand", "km_at_change", "amount_cents"],
};

export const tireRotationConfig: EntityConfig<TireRotation> = {
  title: "Rotazione gomme",
  endpoint: "tire-rotations",
  fields: [
    { key: "rotated_on", label: "Data", type: "date", required: true },
    { key: "km_at_rotation", label: "Chilometraggio", type: "number" },
    { key: "notes", label: "Note", type: "textarea" },
  ],
  columns: ["rotated_on", "km_at_rotation"],
};

export const odometerConfig: EntityConfig<OdometerReading> = {
  title: "Chilometraggio",
  endpoint: "odometer",
  fields: [
    { key: "reading_date", label: "Data lettura", type: "date", required: true },
    { key: "km", label: "Km", type: "number", required: true },
    { key: "notes", label: "Note", type: "textarea" },
  ],
  columns: ["reading_date", "km"],
};

export const fuelConfig: EntityConfig<FuelLog> = {
  title: "Rifornimenti",
  endpoint: "fuel-logs",
  fields: [
    { key: "filled_on", label: "Data", type: "date", required: true },
    { key: "km", label: "Chilometraggio", type: "number" },
    { key: "milliliters", label: "Litri", type: "liters", required: true },
    { key: "amount_cents", label: "Importo (€)", type: "money" },
    {
      key: "is_full_tank",
      label: "Pieno",
      type: "boolean",
      default: "true",
    },
    { key: "station", label: "Distributore", type: "text" },
    { key: "notes", label: "Note", type: "textarea" },
  ],
  columns: [
    "filled_on",
    "km",
    "milliliters",
    "amount_cents",
    {
      header: "€/litro",
      render: (r) =>
        r.price_per_liter_cents != null ? formatMoney(r.price_per_liter_cents) : "—",
    },
    "is_full_tank",
  ],
};

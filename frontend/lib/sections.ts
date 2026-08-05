import type { EntityConfig } from "@/components/entity-tab";
import type { VehicleStatus } from "./types";
import {
  fuelConfig,
  inspectionConfig,
  insuranceConfig,
  odometerConfig,
  roadTaxConfig,
  serviceConfig,
  tireChangeConfig,
  tireRotationConfig,
} from "./entity-configs";

// Una sezione = una sotto-pagina /vehicles/[id]/[slug].
// statusKey collega la card di panoramica al badge di stato (se presente).
export type SectionDef = {
  slug: string;
  label: string;
  statusKey: keyof Pick<
    VehicleStatus,
    "insurance" | "inspection" | "road_tax" | "service" | "tires"
  > | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configs: EntityConfig<any>[];
};

export const SECTIONS: SectionDef[] = [
  { slug: "assicurazione", label: "Assicurazione", statusKey: "insurance", configs: [insuranceConfig] },
  { slug: "revisione", label: "Revisione", statusKey: "inspection", configs: [inspectionConfig] },
  { slug: "bollo", label: "Bollo", statusKey: "road_tax", configs: [roadTaxConfig] },
  { slug: "tagliando", label: "Tagliando", statusKey: "service", configs: [serviceConfig] },
  { slug: "gomme", label: "Gomme", statusKey: "tires", configs: [tireChangeConfig, tireRotationConfig] },
  { slug: "carburante", label: "Carburante", statusKey: null, configs: [fuelConfig] },
  { slug: "chilometri", label: "Chilometri", statusKey: null, configs: [odometerConfig] },
];

export function sectionBySlug(slug: string): SectionDef | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}

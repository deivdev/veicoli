"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { EntityTab } from "@/components/entity-tab";
import { ExpiryBadge } from "@/components/expiry-badge";
import { PhotoUpload } from "@/components/photo-upload";
import { cn } from "@/lib/utils";
import type { Vehicle, VehicleStatus } from "@/lib/types";
import {
  inspectionConfig,
  insuranceConfig,
  odometerConfig,
  roadTaxConfig,
  serviceConfig,
  tireChangeConfig,
  tireRotationConfig,
} from "@/lib/entity-configs";

const TABS = [
  { key: "overview", label: "Panoramica" },
  { key: "insurance", label: "Assicurazione" },
  { key: "inspection", label: "Revisione" },
  { key: "road_tax", label: "Bollo" },
  { key: "service", label: "Tagliando" },
  { key: "tires", label: "Gomme" },
  { key: "odometer", label: "Chilometri" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [tab, setTab] = useState<TabKey>("overview");

  const vehicleQ = useQuery<Vehicle>({
    queryKey: ["vehicle", id],
    queryFn: () => apiClient<Vehicle>(`/vehicles/${id}`),
  });

  const statusQ = useQuery<VehicleStatus>({
    queryKey: ["vehicle-status", id],
    queryFn: () => apiClient<VehicleStatus>(`/vehicles/${id}/status`),
  });

  if (vehicleQ.isLoading || !vehicleQ.data) return <p>Caricamento...</p>;
  const v = vehicleQ.data;

  return (
    <div>
      <div className="flex items-start gap-6 mb-6">
        <div className="w-48 aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden shrink-0">
          {v.photo_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/photo/${v.photo_path}`}
              alt={`${v.make} ${v.model}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              Nessuna foto
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">
            {v.make} {v.model}
          </h1>
          <p className="text-slate-500">
            {v.plate}
            {v.year ? ` · ${v.year}` : ""}
            {statusQ.data?.current_km != null
              ? ` · ${statusQ.data.current_km.toLocaleString("it-IT")} km`
              : ""}
          </p>
          <div className="mt-3 flex gap-2">
            <PhotoUpload vehicle={v} />
            <Link
              href={`/vehicles/${id}/edit`}
              className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Modifica dati
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px",
              tab === t.key
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && statusQ.data && <Overview status={statusQ.data} vehicle={v} />}
      {tab === "insurance" && <EntityTab vehicleId={id} config={insuranceConfig} />}
      {tab === "inspection" && <EntityTab vehicleId={id} config={inspectionConfig} />}
      {tab === "road_tax" && <EntityTab vehicleId={id} config={roadTaxConfig} />}
      {tab === "service" && <EntityTab vehicleId={id} config={serviceConfig} />}
      {tab === "tires" && (
        <div className="space-y-10">
          <EntityTab vehicleId={id} config={tireChangeConfig} />
          <EntityTab vehicleId={id} config={tireRotationConfig} />
        </div>
      )}
      {tab === "odometer" && <EntityTab vehicleId={id} config={odometerConfig} />}
    </div>
  );
}

function Overview({ status, vehicle }: { status: VehicleStatus; vehicle: Vehicle }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <ExpiryBadge info={status.insurance} title="Assicurazione" />
        <ExpiryBadge info={status.inspection} title="Revisione" />
        <ExpiryBadge info={status.road_tax} title="Bollo" />
        <ExpiryBadge info={status.service} title="Tagliando" />
        <ExpiryBadge info={status.tires} title="Gomme" />
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-xl border border-slate-200 p-4">
        <Info label="Tipo" value={labelVehicleType(vehicle.vehicle_type)} />
        <Info label="Alimentazione" value={labelFuel(vehicle.fuel_type)} />
        <Info label="Immatricolazione" value={vehicle.registration_date ?? "—"} />
        <Info label="VIN" value={vehicle.vin ?? "—"} />
      </dl>
      {vehicle.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm font-medium text-slate-500 mb-1">Note</div>
          <p className="text-sm whitespace-pre-wrap">{vehicle.notes}</p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function labelVehicleType(t: Vehicle["vehicle_type"]) {
  return { car: "Auto", motorcycle: "Moto", other: "Altro" }[t];
}

function labelFuel(f: Vehicle["fuel_type"]) {
  if (!f) return "—";
  return {
    petrol: "Benzina",
    diesel: "Diesel",
    lpg: "GPL",
    methane: "Metano",
    electric: "Elettrico",
    hybrid: "Ibrido",
  }[f];
}

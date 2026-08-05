"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { apiClient } from "@/lib/api";
import { PhotoUpload } from "@/components/photo-upload";
import { cn } from "@/lib/utils";
import { SECTIONS } from "@/lib/sections";
import type { ExpiryInfo, Vehicle, VehicleStatus } from "@/lib/types";

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

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
  const status = statusQ.data;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
        <PhotoUpload vehicle={v} />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">
            {v.make} {v.model}
          </h1>
          <p className="text-slate-500">
            {v.plate}
            {v.year ? ` · ${v.year}` : ""}
            {status?.current_km != null
              ? ` · ${status.current_km.toLocaleString("it-IT")} km`
              : ""}
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/vehicles/${id}/edit`}
              className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Modifica dati
            </Link>
          </div>
        </div>
      </div>

      {/* Hub: ogni card apre la sotto-pagina della sezione. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {SECTIONS.map((s) => (
          <SectionCard
            key={s.slug}
            href={`/vehicles/${id}/${s.slug}`}
            label={s.label}
            info={s.statusKey && status ? status[s.statusKey] : null}
            detail={sectionDetail(s.slug, status)}
          />
        ))}
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-xl border border-slate-200 p-4">
        <Info label="Tipo" value={labelVehicleType(v.vehicle_type)} />
        <Info label="Alimentazione" value={labelFuel(v.fuel_type)} />
        <Info label="Immatricolazione" value={v.registration_date ?? "—"} />
        <Info label="VIN" value={v.vin ?? "—"} />
      </dl>
      {v.notes && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm font-medium text-slate-500 mb-1">Note</div>
          <p className="text-sm whitespace-pre-wrap">{v.notes}</p>
        </div>
      )}
    </div>
  );
}

const badgeStyles: Record<ExpiryInfo["status"], string> = {
  ok: "bg-ok-bg text-ok",
  warning: "bg-warn-bg text-warn",
  critical: "bg-crit-bg text-crit",
  unknown: "bg-slate-100 text-slate-500",
};

function expiryLabel(info: ExpiryInfo): string {
  const d = info.days_until;
  if (!info.due_date || d == null) return "Nessun dato";
  if (d < 0) return `Scaduto da ${-d}g`;
  if (d === 0) return "Scade oggi";
  if (d === 1) return "Scade domani";
  return `Tra ${d}g`;
}

function sectionDetail(slug: string, status: VehicleStatus | undefined): string | null {
  if (!status) return null;
  if (slug === "carburante") {
    if (status.fuel && status.fuel.avg_l_per_100km != null) {
      return `${status.fuel.avg_l_per_100km} L/100km`;
    }
    return null;
  }
  if (slug === "chilometri") {
    return status.current_km != null
      ? `${status.current_km.toLocaleString("it-IT")} km`
      : null;
  }
  return null;
}

function SectionCard({
  href,
  label,
  info,
  detail,
}: {
  href: string;
  label: string;
  info: ExpiryInfo | null;
  detail: string | null;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-400 hover:shadow-sm transition"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-900">{label}</div>
        {info ? (
          <span
            className={cn(
              "mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium",
              badgeStyles[info.status]
            )}
          >
            {expiryLabel(info)}
          </span>
        ) : (
          <div className="mt-1 text-xs text-slate-500">{detail ?? "—"}</div>
        )}
      </div>
      <ChevronRight
        size={18}
        className="shrink-0 text-slate-300 group-hover:text-slate-500"
      />
    </Link>
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

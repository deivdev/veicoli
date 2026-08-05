"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api";
import { EntityTab } from "@/components/entity-tab";
import { sectionBySlug } from "@/lib/sections";
import { FuelSummary } from "@/components/fuel-summary";
import type { Vehicle, VehicleStatus } from "@/lib/types";

export default function VehicleSectionPage() {
  const params = useParams<{ id: string; section: string }>();
  const id = Number(params.id);
  const section = sectionBySlug(params.section);

  const vehicleQ = useQuery<Vehicle>({
    queryKey: ["vehicle", id],
    queryFn: () => apiClient<Vehicle>(`/vehicles/${id}`),
  });

  const statusQ = useQuery<VehicleStatus>({
    queryKey: ["vehicle-status", id],
    queryFn: () => apiClient<VehicleStatus>(`/vehicles/${id}/status`),
    enabled: section?.slug === "carburante",
  });

  if (!section) notFound();
  if (vehicleQ.isLoading || !vehicleQ.data) return <p>Caricamento...</p>;
  const v = vehicleQ.data;

  return (
    <div>
      <Link
        href={`/vehicles/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4"
      >
        <ArrowLeft size={16} />
        {v.make} {v.model}
      </Link>

      <h1 className="text-2xl font-semibold mb-6">{section.label}</h1>

      <div className="space-y-10">
        {section.slug === "carburante" && statusQ.data?.fuel && (
          <FuelSummary fuel={statusQ.data.fuel} />
        )}
        {section.configs.map((config) => (
          <EntityTab key={config.endpoint} vehicleId={id} config={config} />
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { VehicleCard } from "@/components/vehicle-card";
import type { VehicleWithStatus } from "@/lib/types";

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<VehicleWithStatus[]>({
    queryKey: ["dashboard"],
    queryFn: () => apiClient<VehicleWithStatus[]>("/dashboard"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link
          href="/vehicles/new"
          className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
        >
          + Nuovo veicolo
        </Link>
      </div>

      {isLoading && <p className="text-slate-500">Caricamento...</p>}
      {error && <p className="text-crit">Errore nel caricamento.</p>}
      {data && data.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Non hai ancora veicoli. <Link href="/vehicles/new" className="underline">Aggiungine uno</Link>.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((v) => (
          <VehicleCard key={v.id} v={v} />
        ))}
      </div>
    </div>
  );
}

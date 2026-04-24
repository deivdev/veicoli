"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { Vehicle } from "@/lib/types";

export default function VehiclesPage() {
  const { data, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: () => apiClient<Vehicle[]>("/vehicles"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Veicoli</h1>
        <Link
          href="/vehicles/new"
          className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
        >
          + Nuovo
        </Link>
      </div>

      {isLoading && <p className="text-slate-500">Caricamento...</p>}
      {data && data.length === 0 && (
        <p className="text-slate-500">Nessun veicolo.</p>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-200">
        {data?.map((v) => (
          <Link
            key={v.id}
            href={`/vehicles/${v.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
          >
            <div>
              <div className="font-medium">
                {v.make} {v.model}
              </div>
              <div className="text-sm text-slate-500">
                {v.plate}
                {v.year ? ` · ${v.year}` : ""}
              </div>
            </div>
            <span className="text-slate-400">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

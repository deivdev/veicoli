import Link from "next/link";
import type { VehicleWithStatus } from "@/lib/types";
import { ExpiryBadge } from "./expiry-badge";

export function VehicleCard({ v }: { v: VehicleWithStatus }) {
  return (
    <Link
      href={`/vehicles/${v.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition overflow-hidden"
    >
      <div className="aspect-[16/9] bg-slate-100 relative">
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
      <div className="p-4 space-y-3">
        <div>
          <div className="font-semibold text-lg">
            {v.make} {v.model}
          </div>
          <div className="text-sm text-slate-500">
            {v.plate}
            {v.year ? ` · ${v.year}` : ""}
            {v.status.current_km != null ? ` · ${v.status.current_km.toLocaleString("it-IT")} km` : ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExpiryBadge info={v.status.insurance} title="Assicuraz." />
          <ExpiryBadge info={v.status.inspection} title="Revisione" />
          <ExpiryBadge info={v.status.road_tax} title="Bollo" />
          <ExpiryBadge info={v.status.service} title="Tagliando" />
          <ExpiryBadge info={v.status.tires} title="Gomme" />
        </div>
      </div>
    </Link>
  );
}

import type { VehicleStatus } from "@/lib/types";
import { formatMoney } from "@/lib/format";

// Riepilogo consumi mostrato in cima alla sotto-pagina Carburante.
export function FuelSummary({ fuel }: { fuel: NonNullable<VehicleStatus["fuel"]> }) {
  if (fuel.fillups_count === 0) return null;
  const stats: { label: string; value: string }[] = [
    {
      label: "Consumo medio",
      value: fuel.avg_l_per_100km != null ? `${fuel.avg_l_per_100km} L/100km` : "—",
    },
    {
      label: "Percorrenza",
      value: fuel.avg_km_per_l != null ? `${fuel.avg_km_per_l} km/L` : "—",
    },
    {
      label: "Ultimo pieno",
      value: fuel.last_l_per_100km != null ? `${fuel.last_l_per_100km} L/100km` : "—",
    },
    {
      label: "Costo/km",
      value: fuel.cost_per_km_cents != null ? formatMoney(fuel.cost_per_km_cents) : "—",
    },
    {
      label: "Spesa totale",
      value: fuel.total_amount_cents != null ? formatMoney(fuel.total_amount_cents) : "—",
    },
    { label: "Rifornimenti", value: String(fuel.fillups_count) },
  ];
  return (
    <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-white rounded-xl border border-slate-200 p-4">
      {stats.map((s) => (
        <div key={s.label}>
          <dt className="text-xs text-slate-500">{s.label}</dt>
          <dd className="text-sm font-medium">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

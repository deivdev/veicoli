export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatMoney(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
    cents / 100
  );
}

export function centsFromInput(value: string): number | null {
  const v = value.trim().replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  if (isNaN(n)) return null;
  return Math.round(n * 100);
}

export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

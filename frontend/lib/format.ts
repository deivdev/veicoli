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

// Litri memorizzati in millilitri (es. 50 L -> 50000), come gli euro coi centesimi.
export function litersFromInput(value: string): number | null {
  const v = value.trim().replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  if (isNaN(n)) return null;
  return Math.round(n * 1000);
}

export function litersToInput(ml: number | null | undefined): string {
  if (ml == null) return "";
  return (ml / 1000).toFixed(2);
}

export function formatLiters(ml: number | null | undefined): string {
  if (ml == null) return "—";
  return `${(ml / 1000).toLocaleString("it-IT", { maximumFractionDigits: 2 })} L`;
}

// Le date viaggiano sempre in ISO (yyyy-mm-dd) verso il backend, ma gli input
// nativi type="date" mostrano il formato del locale del browser (spesso mm/dd/yyyy).
// Questi due helper alimentano DateInput, che usa un campo testo in gg/mm/aaaa.
export function isoToItDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

export function itDateToIso(value: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!m) return "";
  const [, d, mo, y] = m;
  const day = Number(d);
  const month = Number(mo);
  const year = Number(y);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Scarta date inesistenti tipo 31/02: il rollover di Date le sposterebbe.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

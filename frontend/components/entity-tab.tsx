"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient } from "@/lib/api";
import {
  centsFromInput,
  centsToInput,
  formatDate,
  formatLiters,
  formatMoney,
  litersFromInput,
  litersToInput,
} from "@/lib/format";
import { DateInput } from "./date-input";
import { Button, Field, Input, Select, Textarea } from "./ui";

export type FieldType =
  | "date"
  | "text"
  | "number"
  | "money"
  | "liters"
  | "boolean"
  | "textarea"
  | "select";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  default?: string; // valore iniziale per i campi boolean ("true"/"false")
};

export type EntityConfig<T> = {
  title: string;
  endpoint: string; // e.g. "insurances"
  fields: FieldDef[];
  columns: (keyof T | { header: string; render: (row: T) => React.ReactNode })[];
};

function defaultValuesForCreate(fields: FieldDef[]): Record<string, string> {
  const v: Record<string, string> = {};
  for (const f of fields) v[f.key] = f.type === "boolean" ? (f.default ?? "false") : "";
  return v;
}

function valuesFromRow<T>(fields: FieldDef[], row: T): Record<string, string> {
  const v: Record<string, string> = {};
  const r = row as Record<string, unknown>;
  for (const f of fields) {
    const raw = r[f.key];
    if (raw == null) {
      v[f.key] = f.type === "boolean" ? "false" : "";
    } else if (f.type === "money") {
      v[f.key] = centsToInput(raw as number);
    } else if (f.type === "liters") {
      v[f.key] = litersToInput(raw as number);
    } else if (f.type === "boolean") {
      v[f.key] = raw ? "true" : "false";
    } else {
      v[f.key] = String(raw);
    }
  }
  return v;
}

function payloadFromValues(fields: FieldDef[], values: Record<string, string>) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = values[f.key];
    if (f.type === "boolean") {
      out[f.key] = raw === "true";
      continue;
    }
    if (raw === "" || raw == null) {
      if (!f.required) out[f.key] = null;
      continue;
    }
    if (f.type === "number") out[f.key] = Number(raw);
    else if (f.type === "money") out[f.key] = centsFromInput(raw);
    else if (f.type === "liters") out[f.key] = litersFromInput(raw);
    else out[f.key] = raw;
  }
  return out;
}

export function EntityTab<T extends { id: number }>({
  vehicleId,
  config,
}: {
  vehicleId: number;
  config: EntityConfig<T>;
}) {
  const qc = useQueryClient();
  const listKey = [config.endpoint, vehicleId];

  const { data, isLoading } = useQuery<T[]>({
    queryKey: listKey,
    queryFn: () => apiClient<T[]>(`/vehicles/${vehicleId}/${config.endpoint}`),
  });

  const [editing, setEditing] = useState<null | T | "new">(null);

  const createMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiClient(`/vehicles/${vehicleId}/${config.endpoint}`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKey });
      qc.invalidateQueries({ queryKey: ["vehicle-status", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setEditing(null);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      apiClient(`/${config.endpoint}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKey });
      qc.invalidateQueries({ queryKey: ["vehicle-status", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setEditing(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      apiClient(`/${config.endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKey });
      qc.invalidateQueries({ queryKey: ["vehicle-status", vehicleId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{config.title}</h2>
        <Button onClick={() => setEditing("new")}>+ Aggiungi</Button>
      </div>

      {isLoading && <p className="text-slate-500">Caricamento...</p>}

      {data && data.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {config.columns.map((c, i) => (
                  <th key={i} className="text-left px-4 py-2 font-medium text-slate-600">
                    {typeof c === "object" ? c.header : fieldLabel(config.fields, String(c))}
                  </th>
                ))}
                <th className="w-32" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.id}>
                  {config.columns.map((c, i) => (
                    <td key={i} className="px-4 py-2">
                      {renderCell(config.fields, row, c)}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right space-x-1">
                    <Button variant="ghost" onClick={() => setEditing(row)}>
                      Modifica
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Eliminare questa voce?")) deleteMut.mutate(row.id);
                      }}
                    >
                      Elimina
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !isLoading && (
          <div className="text-slate-500 bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center">
            Nessuna voce. Aggiungi la prima.
          </div>
        )
      )}

      {editing && (
        <EntityDialog
          config={config}
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            const payload = payloadFromValues(config.fields, values);
            if (editing === "new") {
              createMut.mutate(payload);
            } else {
              updateMut.mutate({ id: (editing as T).id, payload });
            }
          }}
          submitting={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}

function fieldLabel(fields: FieldDef[], key: string): string {
  return fields.find((f) => f.key === key)?.label ?? key;
}

function renderCell<T>(
  fields: FieldDef[],
  row: T,
  col: keyof T | { header: string; render: (row: T) => React.ReactNode }
) {
  if (typeof col === "object") return col.render(row);
  const key = String(col);
  const field = fields.find((f) => f.key === key);
  const value = (row as Record<string, unknown>)[key];
  if (field?.type === "boolean") return value ? "Sì" : "No";
  if (value == null || value === "") return <span className="text-slate-400">—</span>;
  if (field?.type === "date") return formatDate(String(value));
  if (field?.type === "money") return formatMoney(Number(value));
  if (field?.type === "liters") return formatLiters(Number(value));
  return String(value);
}

function EntityDialog<T>({
  config,
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  config: EntityConfig<T>;
  initial: T | null;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    initial ? valuesFromRow(config.fields, initial) : defaultValuesForCreate(config.fields)
  );

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          {initial ? "Modifica" : "Nuova voce"}
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
          className="space-y-3"
        >
          {config.fields.map((f) => (
            <Field key={f.key} label={f.label + (f.required ? " *" : "")}>
              {f.type === "textarea" ? (
                <Textarea
                  rows={3}
                  required={f.required}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              ) : f.type === "select" ? (
                <Select
                  required={f.required}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                >
                  <option value="">—</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : f.type === "boolean" ? (
                <Select
                  value={values[f.key] ?? "false"}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                >
                  <option value="true">Sì</option>
                  <option value="false">No</option>
                </Select>
              ) : f.type === "date" ? (
                <DateInput
                  required={f.required}
                  value={values[f.key] ?? ""}
                  onChange={(iso) => setValues({ ...values, [f.key]: iso })}
                />
              ) : (
                <Input
                  type={
                    f.type === "number" || f.type === "money" || f.type === "liters"
                      ? "number"
                      : "text"
                  }
                  step={f.type === "money" || f.type === "liters" ? "0.01" : undefined}
                  required={f.required}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              )}
            </Field>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

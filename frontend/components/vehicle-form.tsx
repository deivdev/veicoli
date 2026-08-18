"use client";

import { useState } from "react";
import { DateInput } from "./date-input";
import { Button, Field, Input, Select, Textarea } from "./ui";
import type { Vehicle, VehicleType, FuelType } from "@/lib/types";

export type VehicleFormValues = {
  plate: string;
  make: string;
  model: string;
  year: string;
  vehicle_type: VehicleType;
  fuel_type: FuelType | "";
  vin: string;
  registration_date: string;
  notes: string;
};

function emptyFromVehicle(v?: Vehicle): VehicleFormValues {
  return {
    plate: v?.plate ?? "",
    make: v?.make ?? "",
    model: v?.model ?? "",
    year: v?.year?.toString() ?? "",
    vehicle_type: v?.vehicle_type ?? "car",
    fuel_type: v?.fuel_type ?? "",
    vin: v?.vin ?? "",
    registration_date: v?.registration_date ?? "",
    notes: v?.notes ?? "",
  };
}

export function VehicleForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Vehicle;
  onSubmit: (v: VehicleFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const [values, setValues] = useState<VehicleFormValues>(emptyFromVehicle(initial));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof VehicleFormValues>(k: K, v: VehicleFormValues[K]) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Targa">
          <Input
            required
            value={values.plate}
            onChange={(e) => setField("plate", e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Tipo">
          <Select
            value={values.vehicle_type}
            onChange={(e) => setField("vehicle_type", e.target.value as VehicleType)}
          >
            <option value="car">Auto</option>
            <option value="motorcycle">Moto</option>
            <option value="other">Altro</option>
          </Select>
        </Field>
        <Field label="Marca">
          <Input required value={values.make} onChange={(e) => setField("make", e.target.value)} />
        </Field>
        <Field label="Modello">
          <Input required value={values.model} onChange={(e) => setField("model", e.target.value)} />
        </Field>
        <Field label="Anno">
          <Input
            type="number"
            value={values.year}
            onChange={(e) => setField("year", e.target.value)}
          />
        </Field>
        <Field label="Alimentazione">
          <Select
            value={values.fuel_type}
            onChange={(e) => setField("fuel_type", e.target.value as FuelType | "")}
          >
            <option value="">—</option>
            <option value="petrol">Benzina</option>
            <option value="diesel">Diesel</option>
            <option value="lpg">GPL</option>
            <option value="methane">Metano</option>
            <option value="electric">Elettrico</option>
            <option value="hybrid">Ibrido</option>
          </Select>
        </Field>
        <Field label="Numero telaio (VIN)">
          <Input value={values.vin} onChange={(e) => setField("vin", e.target.value)} />
        </Field>
        <Field label="Data immatricolazione">
          <DateInput
            value={values.registration_date}
            onChange={(iso) => setField("registration_date", iso)}
          />
        </Field>
      </div>
      <Field label="Note">
        <Textarea
          rows={3}
          value={values.notes}
          onChange={(e) => setField("notes", e.target.value)}
        />
      </Field>

      {error && <div className="text-sm text-crit">{error}</div>}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvataggio..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function formValuesToPayload(v: VehicleFormValues) {
  return {
    plate: v.plate,
    make: v.make,
    model: v.model,
    year: v.year ? Number(v.year) : null,
    vehicle_type: v.vehicle_type,
    fuel_type: v.fuel_type || null,
    vin: v.vin || null,
    registration_date: v.registration_date || null,
    notes: v.notes || null,
  };
}

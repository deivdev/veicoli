"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { VehicleForm, formValuesToPayload } from "@/components/vehicle-form";
import type { Vehicle } from "@/lib/types";
import { Button } from "@/components/ui";

export default function EditVehiclePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();

  const { data, isLoading } = useQuery<Vehicle>({
    queryKey: ["vehicle", id],
    queryFn: () => apiClient<Vehicle>(`/vehicles/${id}`),
  });

  async function handleDelete() {
    if (!confirm("Eliminare questo veicolo e tutto il suo storico?")) return;
    await apiClient(`/vehicles/${id}`, { method: "DELETE" });
    router.push("/vehicles");
    router.refresh();
  }

  if (isLoading || !data) return <p>Caricamento...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Modifica veicolo</h1>
      <VehicleForm
        initial={data}
        submitLabel="Salva"
        onSubmit={async (values) => {
          await apiClient<Vehicle>(`/vehicles/${id}`, {
            method: "PATCH",
            body: JSON.stringify(formValuesToPayload(values)),
          });
          router.push(`/vehicles/${id}`);
          router.refresh();
        }}
      />
      <div className="mt-10 pt-6 border-t border-slate-200">
        <Button variant="danger" onClick={handleDelete}>
          Elimina veicolo
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { VehicleForm, formValuesToPayload } from "@/components/vehicle-form";
import type { Vehicle } from "@/lib/types";

export default function NewVehiclePage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Nuovo veicolo</h1>
      <VehicleForm
        submitLabel="Crea veicolo"
        onSubmit={async (values) => {
          const v = await apiClient<Vehicle>("/vehicles", {
            method: "POST",
            body: JSON.stringify(formValuesToPayload(values)),
          });
          router.push(`/vehicles/${v.id}`);
          router.refresh();
        }}
      />
    </div>
  );
}

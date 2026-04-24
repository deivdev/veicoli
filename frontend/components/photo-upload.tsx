"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Vehicle } from "@/lib/types";
import { Button } from "./ui";

export function PhotoUpload({ vehicle }: { vehicle: Vehicle }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/proxy/vehicles/${vehicle.id}/photo`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || res.statusText);
      }
      qc.invalidateQueries({ queryKey: ["vehicle", vehicle.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Button
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Caricamento..." : vehicle.photo_path ? "Cambia foto" : "Carica foto"}
      </Button>
      {error && <span className="text-sm text-crit">{error}</span>}
    </div>
  );
}

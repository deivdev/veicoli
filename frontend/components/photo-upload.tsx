"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import type { Vehicle } from "@/lib/types";

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
    <div className="shrink-0">
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
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={vehicle.photo_path ? "Cambia foto" : "Carica foto"}
        className="group relative block w-48 aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-60"
      >
        {vehicle.photo_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/photo/${vehicle.photo_path}`}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400">
            <Camera size={24} />
            <span className="text-sm">Carica foto</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/0 text-transparent group-hover:bg-black/40 group-hover:text-white transition-colors text-sm font-medium">
          <Camera size={18} />
          {uploading ? "Caricamento..." : vehicle.photo_path ? "Cambia foto" : "Carica foto"}
        </div>
      </button>
      {error && <span className="mt-1 block text-sm text-crit">{error}</span>}
    </div>
  );
}

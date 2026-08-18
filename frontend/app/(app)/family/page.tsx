"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button, Input } from "@/components/ui";
import type { CurrentUser, Family, FamilyInvite } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FamilyPage() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const me = useQuery<CurrentUser>({
    queryKey: ["me"],
    queryFn: () => apiClient<CurrentUser>("/auth/me"),
  });

  const inFamily = me.data?.family_id != null;

  const family = useQuery<Family>({
    queryKey: ["family"],
    queryFn: () => apiClient<Family>("/family"),
    enabled: inFamily,
  });

  const invites = useQuery<FamilyInvite[]>({
    queryKey: ["family-invites"],
    queryFn: () => apiClient<FamilyInvite[]>("/family/invites"),
    enabled: inFamily,
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["me"] });
    qc.invalidateQueries({ queryKey: ["family"] });
    qc.invalidateQueries({ queryKey: ["family-invites"] });
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const createFamily = useMutation({
    mutationFn: (name: string) =>
      apiClient<Family>("/family", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => {
      setNewName("");
      refresh();
    },
  });

  const joinFamily = useMutation({
    mutationFn: (code: string) =>
      apiClient<Family>("/family/join", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: () => {
      setJoinCode("");
      refresh();
    },
  });

  const createInvite = useMutation({
    mutationFn: () =>
      apiClient<FamilyInvite>("/family/invites", {
        method: "POST",
        body: JSON.stringify({ expires_in_days: 7 }),
      }),
    onSuccess: refresh,
  });

  const revokeInvite = useMutation({
    mutationFn: (id: number) => apiClient(`/family/invites/${id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });

  const removeMember = useMutation({
    mutationFn: (id: number) => apiClient(`/family/members/${id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });

  const leave = useMutation({
    mutationFn: () => apiClient("/family/leave", { method: "POST" }),
    onSuccess: refresh,
  });

  async function copyLink(invite: FamilyInvite) {
    const link = `${window.location.origin}/register?invite=${invite.code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(invite.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copia il link di invito:", link);
    }
  }

  if (me.isLoading) {
    return <p className="text-slate-500">Caricamento...</p>;
  }

  if (!inFamily) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold mb-2">Famiglia</h1>
        <p className="text-slate-500 mb-6">
          Crea una famiglia per condividere i tuoi veicoli con altre persone. Ogni
          membro vede e gestisce i veicoli di tutti gli altri.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) createFamily.mutate(newName.trim());
          }}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nome della famiglia
            </label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Rossi"
              required
            />
          </div>
          <Button type="submit" disabled={createFamily.isPending}>
            {createFamily.isPending ? "Creazione..." : "Crea famiglia"}
          </Button>
          {createFamily.isError && (
            <p className="text-sm text-crit">Errore nella creazione</p>
          )}
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-sm text-slate-400">oppure</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const code = joinCode.trim().toUpperCase();
            if (code) joinFamily.mutate(code);
          }}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hai un codice di invito?
            </label>
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABCD123456"
              className="font-mono tracking-wide"
              required
            />
          </div>
          <Button type="submit" variant="secondary" disabled={joinFamily.isPending}>
            {joinFamily.isPending ? "Verifica..." : "Entra nella famiglia"}
          </Button>
          {joinFamily.isError && (
            <p className="text-sm text-crit">Codice non valido o scaduto</p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{family.data?.name ?? "Famiglia"}</h1>
          <p className="text-slate-500 text-sm">
            I veicoli sono condivisi tra tutti i membri.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm("Uscire dalla famiglia? Non vedrai più i veicoli degli altri.")) {
              leave.mutate();
            }
          }}
        >
          Esci dalla famiglia
        </Button>
      </div>

      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-2">Membri</h2>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-200">
          {family.data?.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium">{m.name ?? m.email}</div>
                {m.name && <div className="text-sm text-slate-500">{m.email}</div>}
              </div>
              {m.id === me.data?.id ? (
                <span className="text-xs text-slate-400">tu</span>
              ) : (
                <button
                  onClick={() => {
                    if (confirm(`Rimuovere ${m.name ?? m.email} dalla famiglia?`)) {
                      removeMember.mutate(m.id);
                    }
                  }}
                  aria-label="Rimuovi membro"
                  className="text-slate-400 hover:text-crit"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-slate-700">Inviti attivi</h2>
          <Button onClick={() => createInvite.mutate()} disabled={createInvite.isPending}>
            {createInvite.isPending ? "Creazione..." : "+ Nuovo invito"}
          </Button>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Ogni link vale per una sola persona e scade dopo 7 giorni.
        </p>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-200">
          {invites.data?.length === 0 && (
            <p className="px-4 py-6 text-slate-500 text-sm">
              Nessun invito attivo.
            </p>
          )}
          {invites.data?.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="min-w-0">
                <div className="font-mono text-sm">{inv.code}</div>
                <div className="text-xs text-slate-500">
                  Scade il {formatDate(inv.expires_at)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="secondary" onClick={() => copyLink(inv)}>
                  {copied === inv.id ? (
                    <span className="flex items-center gap-1">
                      <Check size={14} /> Copiato
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy size={14} /> Copia link
                    </span>
                  )}
                </Button>
                <button
                  onClick={() => revokeInvite.mutate(inv.id)}
                  aria-label="Revoca invito"
                  className="text-slate-400 hover:text-crit"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

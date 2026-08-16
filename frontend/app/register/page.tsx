"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { AuthConfig, InvitePreview } from "@/lib/types";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite")?.trim() ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [openRegistration, setOpenRegistration] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (inviteCode) {
        const res = await fetch(
          `/api/proxy/family/invites/${encodeURIComponent(inviteCode)}/preview`
        );
        const data: InvitePreview = res.ok
          ? await res.json()
          : { family_name: "", valid: false };
        if (!cancelled) setInvite(data);
        return;
      }
      const res = await fetch("/api/proxy/auth/config");
      const data: AuthConfig = res.ok
        ? await res.json()
        : { registration_enabled: false };
      if (!cancelled) setOpenRegistration(data.registration_enabled);
    }
    load().catch(() => {
      if (!cancelled) setOpenRegistration(false);
    });
    return () => {
      cancelled = true;
    };
  }, [inviteCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La password deve essere di almeno 8 caratteri");
      return;
    }
    if (password !== confirm) {
      setError("Le password non coincidono");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name || null,
          invite_code: inviteCode || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          setError("Registrazione disabilitata: serve un invito");
        } else if (res.status === 409) {
          setError("Questa email è già registrata");
        } else if (res.status === 400) {
          setError("Invito non valido o scaduto");
        } else {
          setError(data.detail ?? "Errore di registrazione");
        }
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }

  const blocked =
    (inviteCode && invite && !invite.valid) ||
    (!inviteCode && openRegistration === false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-4"
      >
        <div>
          <h1 className="text-2xl font-semibold">Crea account</h1>
          {inviteCode && invite?.valid ? (
            <p className="text-sm text-slate-500">
              Sei stato invitato nella famiglia{" "}
              <span className="font-medium text-slate-900">{invite.family_name}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-500">Registrati per accedere</p>
          )}
        </div>

        {blocked && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
            {inviteCode
              ? "Questo invito non è più valido. Chiedi un nuovo link a chi ti ha invitato."
              : "La registrazione libera è disattivata. Per entrare serve un link di invito."}
          </div>
        )}

        {!blocked && (
          <>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Nome (opzionale)</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 focus:border-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span className="text-xs text-slate-500">Almeno 8 caratteri</span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Conferma password</span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </label>

            {error && <div className="text-sm text-crit">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 text-white py-2 font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Creazione..." : "Crea account"}
            </button>
          </>
        )}

        <div className="text-sm text-center text-slate-500">
          Hai già un account?{" "}
          <Link href="/login" className="text-slate-900 font-medium hover:underline">
            Accedi
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

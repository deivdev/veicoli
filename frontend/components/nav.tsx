"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/vehicles", label: "Veicoli" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            Veicoli
          </Link>
          <div className="flex gap-4 text-sm">
            {links.map((l) => {
              const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "text-slate-600 hover:text-slate-900",
                    active && "text-slate-900 font-medium"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
        <button onClick={logout} className="text-sm text-slate-600 hover:text-slate-900">
          Esci
        </button>
      </div>
    </nav>
  );
}

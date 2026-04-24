import { Nav } from "@/components/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

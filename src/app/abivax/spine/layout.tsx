import { SpineNav } from "./SpineNav";

export default function SpineLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
        <aside className="w-48 shrink-0">
          <SpineNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

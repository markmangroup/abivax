import { SpineNav } from "./SpineNav";
import SpineShell from "./SpineShell";

export default function SpineLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <SpineShell>
      <aside className="w-60 shrink-0">
          <SpineNav />
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </SpineShell>
  );
}

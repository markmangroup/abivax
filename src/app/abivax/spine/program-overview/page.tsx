export const dynamic = "force-dynamic";

export default function ProgramOverviewPage() {
  return (
    <div style={{ margin: "-24px -24px 0", height: "calc(100vh - 64px)" }}>
      <iframe
        src="/program-command-center.html"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        title="ERP Program Command Center"
      />
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function TreasuryPage() {
  return (
    <div style={{ margin: "-24px -24px 0", height: "calc(100vh - 64px)" }}>
      <iframe
        src="/treasury-briefing.html"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        title="Treasury Workstream Briefing"
      />
    </div>
  );
}

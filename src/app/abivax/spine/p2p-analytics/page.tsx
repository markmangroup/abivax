export const dynamic = "force-dynamic";

export default function P2PAnalyticsPage() {
  return (
    <div style={{ margin: "-24px -24px 0", height: "calc(100vh - 64px)" }}>
      <iframe
        src="/p2p-france-analytics.html"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        title="France P2P Analytics"
      />
    </div>
  );
}

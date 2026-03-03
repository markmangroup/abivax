export const dynamic = "force-dynamic";

export default function NetSuitePage() {
  return (
    <div style={{ margin: "-24px -24px 0", height: "calc(100vh - 64px)" }}>
      <iframe
        src="/netsuite-vendor-brief.html"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        title="NetSuite Vendor Brief"
      />
    </div>
  );
}

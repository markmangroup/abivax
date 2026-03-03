export const dynamic = "force-dynamic";

export default function P2PPage() {
  return (
    <div style={{ margin: "-24px -24px 0", height: "calc(100vh - 64px)" }}>
      <iframe
        src="/p2p-intelligence-brief.html"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        title="P2P Intelligence Brief"
      />
    </div>
  );
}

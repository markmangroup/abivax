export const dynamic = "force-dynamic";

export default function TreasuryInvestmentsPage() {
  return (
    <div style={{ margin: "-24px -24px 0", height: "calc(100vh - 64px)" }}>
      <iframe
        src="/treasury-investments.html"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        title="Treasury Investments and Non-Operating Cash"
      />
    </div>
  );
}

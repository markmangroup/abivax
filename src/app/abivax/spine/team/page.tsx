export const dynamic = "force-dynamic";

export default function TeamPage() {
  return (
    <div style={{ margin: "-24px -24px 0", height: "calc(100vh - 64px)" }}>
      <iframe
        src="/erp-team-roles.html"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        title="ERP Team Roles and Responsibilities"
      />
    </div>
  );
}

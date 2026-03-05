export const dynamic = "force-dynamic";

export default function OperatorNotesPage() {
  return (
    <div style={{ margin: "-24px -24px 0", height: "calc(100vh - 64px)" }}>
      <iframe
        src="/erp-operator-notes.html"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        title="ERP Operator Notes"
      />
    </div>
  );
}

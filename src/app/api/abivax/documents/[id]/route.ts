import { existsSync, readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { loadDocumentRegistry } from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".zip": "application/zip",
};

function isAllowedPath(targetPath: string) {
  const normalized = path.normalize(targetPath);
  const roots = [
    path.join(process.cwd(), "data", "abivax"),
    path.join(process.cwd(), "outputs"),
  ];
  return roots.some((root) => normalized.startsWith(path.normalize(root)));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const registry = loadDocumentRegistry();
  const doc = registry.documents.find((item) => item.id === id);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), doc.sourcePath);
  if (!isAllowedPath(filePath)) {
    return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
  }

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_BY_EXT[ext] || "application/octet-stream";
  const file = readFileSync(filePath);
  return new NextResponse(file, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
      "Cache-Control": "no-store",
    },
  });
}

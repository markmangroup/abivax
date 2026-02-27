import { readFileSync, existsSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { loadPresentations } from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

function safeFileName(input: string): string {
  return input.replace(/[\\/:*?"<>|]/g, "-");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { presentations } = loadPresentations();
  const deck = presentations.find((p) => p.id === id);
  if (!deck) {
    return NextResponse.json({ error: "Presentation not found" }, { status: 404 });
  }

  const filename = `${safeFileName(deck.title)}.pptx`;
  const filePath = path.join(process.cwd(), "outputs", "presentations", filename);
  if (!existsSync(filePath)) {
    return NextResponse.json(
      { error: "PPTX not generated yet. Run `npm run presentations:build`." },
      { status: 404 }
    );
  }

  const file = readFileSync(filePath);
  return new NextResponse(file, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

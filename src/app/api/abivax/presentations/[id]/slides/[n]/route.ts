import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; n: string }> }
) {
  const { id, n } = await context.params;

  // Sanitize id to prevent path traversal
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) return new NextResponse(null, { status: 400 });

  const thumbnailDir = path.join(
    process.cwd(),
    "outputs",
    "presentations",
    "thumbnails",
    safeId
  );

  // Special case: ?count=1 returns the total slide count for this deck
  if (n === "count") {
    if (!existsSync(thumbnailDir)) {
      return NextResponse.json({ count: 0 });
    }
    const files = readdirSync(thumbnailDir).filter((f) => f.endsWith(".jpg"));
    return NextResponse.json({ count: files.length });
  }

  const slideIndex = parseInt(n, 10);
  if (isNaN(slideIndex) || slideIndex < 1) {
    return new NextResponse(null, { status: 400 });
  }

  const filePath = path.join(thumbnailDir, `slide-${slideIndex}.jpg`);
  if (!existsSync(filePath)) {
    return new NextResponse(null, { status: 404 });
  }

  const file = readFileSync(filePath);
  return new NextResponse(file, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

import { notFound } from "next/navigation";
import { existsSync, readdirSync } from "fs";
import path from "path";
import { loadPresentations } from "@/lib/abivaxData";
import SlideViewerClient from "./SlideViewerClient";

export const dynamic = "force-dynamic";

function getSlideCount(deckId: string): number {
  const dir = path.join(
    process.cwd(),
    "outputs",
    "presentations",
    "thumbnails",
    deckId
  );
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => f.endsWith(".jpg")).length;
}

export default async function PresentationViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { presentations } = loadPresentations();
  const deck = presentations.find((p) => p.id === id);

  if (!deck) notFound();

  const slideCount = getSlideCount(deck.id);
  const openGapCount = deck.dataRequests.filter(
    (d) => d.status.toLowerCase() !== "closed"
  ).length;

  return (
    <SlideViewerClient
      deckTitle={deck.title}
      deckId={deck.id}
      slideCount={slideCount}
      openGapCount={openGapCount}
      meetingDate={deck.meetingDate}
      audience={deck.audience}
    />
  );
}

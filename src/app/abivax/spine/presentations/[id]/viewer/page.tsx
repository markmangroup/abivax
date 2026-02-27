import { notFound } from "next/navigation";
import { loadPresentations } from "@/lib/abivaxData";
import SlideViewerClient from "./SlideViewerClient";

export const dynamic = "force-dynamic";

type ViewerSlide = {
  id: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  visual?: string;
};

function buildSlidesForViewer(deck: ReturnType<typeof loadPresentations>["presentations"][number]): ViewerSlide[] {
  const slides: ViewerSlide[] = [];

  slides.push({
    id: `${deck.id}-cover`,
    title: deck.title,
    subtitle: `${deck.audience} | Meeting ${deck.meetingDate}`,
    bullets: [deck.objective],
    visual: "cover",
  });

  for (const s of deck.slidePlan) {
    slides.push({
      id: s.id,
      title: s.title,
      subtitle: `${s.section} | ${s.status}`,
      bullets: s.content && s.content.length > 0 ? s.content : [s.notes || "Pending content"],
      visual: s.visual || "",
    });
  }

  const openGaps = deck.dataRequests
    .filter((d) => d.status.toLowerCase() !== "closed")
    .map((d) => `${d.topic} | ${d.owner} | ${d.due}`);
  if (openGaps.length > 0) {
    slides.push({
      id: `${deck.id}-gaps`,
      title: "Open Data Gaps",
      bullets: openGaps,
      visual: "backlog",
    });
  }

  slides.push({
    id: `${deck.id}-close`,
    title: "Decision and Next 7 Days",
    bullets:
      deck.audience.toLowerCase().includes("board")
        ? ["Confirm selection direction", "Confirm staffing posture", "Confirm governance cadence"]
        : ["Confirm control owners", "Confirm remediation due dates", "Confirm audit evidence repository"],
    visual: "close",
  });

  return slides;
}

export default async function PresentationViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { presentations } = loadPresentations();
  const deck = presentations.find((p) => p.id === id);

  if (!deck) {
    notFound();
  }

  const slides = buildSlidesForViewer(deck);
  return <SlideViewerClient deckTitle={deck.title} deckId={deck.id} slides={slides} />;
}

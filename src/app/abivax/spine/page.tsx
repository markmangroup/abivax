import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SpinePage() {
  redirect("/abivax/spine/today");
}

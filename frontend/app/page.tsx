import { HomePageClient } from "@/components/home/HomePageClient";
import { requireActiveSession } from "@/lib/auth-server";

export default async function HomePage() {
  await requireActiveSession();

  return <HomePageClient />;
}

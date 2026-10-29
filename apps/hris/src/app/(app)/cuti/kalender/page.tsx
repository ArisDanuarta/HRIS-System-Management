import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface KalenderPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

export default async function KalenderCutiRedirectPage({ searchParams }: KalenderPageProps) {
  const resolved = await searchParams;
  const query = new URLSearchParams();
  if (resolved.year) query.set("year", resolved.year);
  if (resolved.month) query.set("month", resolved.month);
  const qStr = query.toString();
  redirect(qStr ? `/kalender?${qStr}` : "/kalender");
}

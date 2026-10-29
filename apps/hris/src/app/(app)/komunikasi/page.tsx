import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";

export const dynamic = "force-dynamic";

export default async function KomunikasiIndexPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isHrOrAdmin = roleKeys.includes("super_admin") || roleKeys.includes("admin_hr");
  const isManager = roleKeys.includes("manager");

  if (isHrOrAdmin) {
    redirect("/komunikasi/baru");
  } else if (isManager) {
    redirect("/komunikasi/riwayat");
  } else {
    redirect("/forbidden");
  }
}

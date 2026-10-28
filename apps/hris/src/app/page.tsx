import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession, getUserProfile } from "@pspk/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (session && session.user) {
    const userProfile = await getUserProfile(session.user.id);
    if (userProfile?.mustChangePassword) {
      redirect("/ganti-password-wajib");
    }
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}

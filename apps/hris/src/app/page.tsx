import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@pspk/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (session && session.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}


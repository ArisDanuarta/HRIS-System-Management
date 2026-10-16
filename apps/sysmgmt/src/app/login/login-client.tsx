"use client";

import { LoginPage } from "@pspk/ui";
import { signIn } from "@pspk/auth/client";
import { useRouter } from "next/navigation";

export function LoginPageClient() {
  const router = useRouter();

  return (
    <LoginPage
      currentApp="sysmgmt"
      hrisUrl={process.env.NEXT_PUBLIC_HRIS_URL || "http://localhost:3001"}
      sysmgmtUrl={process.env.NEXT_PUBLIC_SYSMGMT_URL || "http://localhost:3002"}
      onSubmit={async ({ email, password, remember }) => {
        const res = await signIn.email({
          email,
          password,
          rememberMe: remember,
        });

        if (res.error) {
          return {
            error:
              res.error.message ||
              "Email atau password salah. Pastikan alamat surel instansi @pspk.id dan kata sandi diketik dengan benar.",
          };
        }

        router.push("/");
        router.refresh();
      }}
    />
  );
}

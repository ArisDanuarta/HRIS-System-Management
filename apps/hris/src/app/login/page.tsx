"use client";

import { LoginPage } from "@pspk/ui";
import { signIn } from "@pspk/auth/client";
import { useRouter } from "next/navigation";

export default function HrisLoginPage() {
  const router = useRouter();

  return (
    <LoginPage
      appName="HRIS"
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
              "Email atau password salah. Pastikan alamat surel instansi @pspk.or.id dan kata sandi diketik dengan benar.",
          };
        }

        router.push("/");
      }}
    />
  );
}

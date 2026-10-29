"use client";

import { LoginPage } from "@pspk/ui";
import { signIn } from "@pspk/auth/client";

export function LoginPageClient() {

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

        // Prioritaskan pengarahan langsung jika akun diwajibkan ganti password saat login pertama kali
        const userObj =
          res.data && typeof res.data === "object" && "user" in res.data
            ? (res.data.user as { mustChangePassword?: boolean })
            : null;

        const targetPath = userObj?.mustChangePassword ? "/ganti-password-wajib" : "/";
        // Menggunakan hard navigation pasca login agar sesi dan cookie Better Auth sinkron sempurna
        window.location.href = targetPath;
      }}
    />
  );
}

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma, writeAudit } from "@pspk/db";
import { getSession, getAuthContext, hashPassword } from "@pspk/auth";
import { generateSecureTemporaryPassword } from "../services/employee.service";
import { sendEmployeeCredentialsEmail } from "../services/email.service";

async function getActorInfo() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Pengguna tidak aktif atau hak akses tidak valid.");
  }

  const isSuperAdmin = authCtx.roles.includes("super_admin");
  const isAdminIt = authCtx.roles.includes("admin_it");
  const isAdminHr = authCtx.roles.includes("admin_hr");

  const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  return {
    userId: session.user.id,
    email: session.user.email,
    authCtx,
    isSuperAdmin,
    isAdminIt,
    isAdminHr,
    ip,
    userAgent,
  };
}

/**
 * Server Action: Update Employee Roles (RBAC)
 */
export async function updateEmployeeRolesAction(input: {
  employeeId: string;
  roleKeys: string[];
}) {
  try {
    const actor = await getActorInfo();

    // Only Super Admin or Admin IT can manage user roles
    if (!actor.isSuperAdmin && !actor.isAdminIt) {
      return {
        ok: false as const,
        error: "Hanya Super Admin atau Administrator IT yang memiliki wewenang untuk mengubah peran pengguna.",
      };
    }

    // Admin IT cannot assign or revoke super_admin or admin_hr
    if (!actor.isSuperAdmin) {
      if (input.roleKeys.includes("super_admin")) {
        return {
          ok: false as const,
          error: "Hanya Super Admin yang berhak menugaskan peran Super Admin.",
        };
      }
    }

    if (!input.roleKeys || input.roleKeys.length === 0) {
      return {
        ok: false as const,
        error: "Pengguna wajib memiliki minimal satu peran aktif.",
      };
    }

    const employee = await prisma.employee.findUnique({
      where: { id: input.employeeId },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!employee || employee.deletedAt) {
      return { ok: false as const, error: "Data pegawai tidak ditemukan." };
    }

    if (!employee.user) {
      return {
        ok: false as const,
        error: "Pegawai ini belum memiliki akun login terhubung. Buatkan akun terlebih dahulu.",
      };
    }

    const targetUserId = employee.user.id;
    const currentRoleKeys = employee.user.roles.map((r) => r.role.key);

    // Proteksi: Tidak boleh mencabut role super_admin dari super admin terakhir
    if (currentRoleKeys.includes("super_admin") && !input.roleKeys.includes("super_admin")) {
      const activeSuperAdminCount = await prisma.userRole.count({
        where: {
          role: { key: "super_admin" },
          user: { isActive: true },
        },
      });

      if (activeSuperAdminCount <= 1) {
        return {
          ok: false as const,
          error: "Tidak dapat mencabut peran Super Admin. Sistem wajib memiliki minimal satu Super Admin aktif.",
        };
      }
    }

    // Ambil record Role dari database berdasarkan keys
    const validRoles = await prisma.role.findMany({
      where: { key: { in: input.roleKeys } },
    });

    if (validRoles.length === 0) {
      return { ok: false as const, error: "Daftar peran yang dipilih tidak valid." };
    }

    await prisma.$transaction(async (tx) => {
      // Hapus roles lama
      await tx.userRole.deleteMany({
        where: { userId: targetUserId },
      });

      // Tambahkan roles baru
      await tx.userRole.createMany({
        data: validRoles.map((r) => ({
          userId: targetUserId,
          roleId: r.id,
        })),
      });

      // Audit Log
      await writeAudit(
        {
          actorUserId: actor.userId,
          actorEmail: actor.email,
          app: "hris",
          action: "UPDATE",
          entityType: "UserRole",
          entityId: targetUserId,
          before: { roles: currentRoleKeys, employeeId: employee.id },
          after: { roles: validRoles.map((r) => r.key), employeeId: employee.id },
          ip: actor.ip,
          userAgent: actor.userAgent,
        },
        tx,
      );
    });

    revalidatePath("/karyawan");
    revalidatePath(`/karyawan/${employee.id}`);

    return {
      ok: true as const,
      message: `Peran untuk ${employee.fullName} berhasil diperbarui menjadi: ${validRoles.map((r) => r.name).join(", ")}.`,
    };
  } catch (err: unknown) {
    console.error("updateEmployeeRolesAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal memperbarui peran pegawai.",
    };
  }
}

/**
 * Server Action: Create User Account for Existing Employee
 */
export async function createEmployeeLoginAccountAction(input: {
  employeeId: string;
  roleKey: string;
}) {
  try {
    const actor = await getActorInfo();

    // Admin HR or Super Admin
    if (!actor.isAdminHr && !actor.isSuperAdmin && !actor.isAdminIt) {
      return {
        ok: false as const,
        error: "Anda tidak memiliki wewenang untuk membuat akun login pegawai.",
      };
    }

    // If actor is Admin HR (not super_admin), they can only assign 'staff' or 'manager'
    if (!actor.isSuperAdmin) {
      if (input.roleKey !== "staff" && input.roleKey !== "manager") {
        return {
          ok: false as const,
          error: "Admin HR hanya berwenang membuat akun dengan peran Karyawan (Staff) atau Manajer.",
        };
      }
    }

    const employee = await prisma.employee.findUnique({
      where: { id: input.employeeId },
      include: { user: true },
    });

    if (!employee || employee.deletedAt) {
      return { ok: false as const, error: "Data pegawai tidak ditemukan." };
    }

    if (employee.userId || employee.user) {
      return {
        ok: false as const,
        error: "Pegawai ini sudah memiliki akun login aktif.",
      };
    }

    if (!employee.workEmail) {
      return {
        ok: false as const,
        error: "Pegawai belum memiliki alamat email kantor (@pspk.id). Harap lengkapi email kantor terlebih dahulu.",
      };
    }

    const workEmail = employee.workEmail.toLowerCase().trim();
    const temporaryPassword = generateSecureTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    const targetRole = await prisma.role.findUnique({
      where: { key: input.roleKey },
    });

    if (!targetRole) {
      return { ok: false as const, error: "Peran yang dipilih tidak ditemukan dalam sistem." };
    }

    await prisma.$transaction(async (tx) => {
      // Periksa apakah user dengan email ini sudah ada di skema core
      let user = await tx.user.findUnique({
        where: { email: workEmail },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: workEmail,
            name: employee.fullName,
            isActive: true,
            emailVerified: true,
          },
        });
      }

      // Upsert Better Auth account credential
      const existingAcc = await tx.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
      });

      if (!existingAcc) {
        await tx.account.create({
          data: {
            userId: user.id,
            accountId: user.id,
            providerId: "credential",
            password: hashedPassword,
          },
        });
      } else {
        await tx.account.update({
          where: { id: existingAcc.id },
          data: { password: hashedPassword },
        });
      }

      // Pasang role
      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: targetRole.id,
          },
        },
        create: {
          userId: user.id,
          roleId: targetRole.id,
        },
        update: {},
      });

      // Tautkan user ke employee
      const updatedEmp = await tx.employee.update({
        where: { id: employee.id },
        data: { userId: user.id },
      });

      // Audit Log
      await writeAudit(
        {
          actorUserId: actor.userId,
          actorEmail: actor.email,
          app: "hris",
          action: "CREATE",
          entityType: "UserAccount",
          entityId: user.id,
          after: {
            employeeId: employee.id,
            workEmail,
            roleKey: targetRole.key,
            roleName: targetRole.name,
          },
          ip: actor.ip,
          userAgent: actor.userAgent,
        },
        tx,
      );

      return { user, updatedEmp };
    });

    // Kirim email kredensial ke email pribadi staf jika ada
    let emailSent = false;
    let emailMessage = "Email pribadi tidak tersedia.";

    if (employee.personalEmail) {
      try {
        const mailRes = await sendEmployeeCredentialsEmail({
          to: employee.personalEmail.trim(),
          fullName: employee.fullName,
          workEmail,
          temporaryPassword,
          roleName: targetRole.name,
        });
        emailSent = mailRes.success;
        emailMessage = mailRes.message;
      } catch (mailErr) {
        console.error("Gagal mengirim email kredensial:", mailErr);
        emailMessage = "Gagal mengirim email notifikasi ke surel pribadi.";
      }
    }

    revalidatePath("/karyawan");
    revalidatePath(`/karyawan/${employee.id}`);

    return {
      ok: true as const,
      message: `Akun login untuk ${employee.fullName} berhasil dibuat!`,
      credentials: {
        workEmail,
        temporaryPassword,
        roleName: targetRole.name,
        roleKey: targetRole.key,
        personalEmail: employee.personalEmail,
        emailSent,
        emailMessage,
      },
    };
  } catch (err: unknown) {
    console.error("createEmployeeLoginAccountAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal membuat akun login pegawai.",
    };
  }
}

/**
 * Server Action: Ambil Seluruh Role Sistem
 */
export async function getSystemRolesAction() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        isSystem: true,
      },
    });
    return { ok: true as const, data: roles };
  } catch (err: unknown) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal mengambil daftar peran.",
    };
  }
}

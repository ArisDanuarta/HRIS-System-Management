import { PrismaClient } from "@prisma/client";
import { PERMISSIONS, SYSTEM_ROLES } from "@pspk/rbac";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Memulai pembersihan total database (menyisakan Superadmin & Role/Permission)...");

  // 1. Pastikan permissions & roles sistem ter-sync
  console.log("🛡️ Memastikan sistem role & permission lengkap...");
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        module: perm.module,
        description: perm.description,
      },
      create: {
        key: perm.key,
        module: perm.module,
        description: perm.description,
      },
    });
  }

  for (const roleDef of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { key: roleDef.key },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
      create: {
        key: roleDef.key,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
    });

    for (const permKey of roleDef.permissions) {
      const permission = await prisma.permission.findUnique({ where: { key: permKey } });
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }

  // 2. Buat atau pertahankan akun Superadmin
  console.log("👑 Mempersiapkan akun Superadmin murni (superadmin@pspk.id)...");
  const superadminEmail = "superadmin@pspk.id";
  const superadminPassword = "Superadmin321!";

  const superadminUser = await prisma.user.upsert({
    where: { email: superadminEmail },
    update: {
      name: "Super Administrator PSPK",
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: superadminEmail,
      name: "Super Administrator PSPK",
      isActive: true,
      emailVerified: true,
    },
  });

  const hashedPassword = await hashPassword(superadminPassword);
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: superadminUser.id,
      providerId: "credential",
    },
  });

  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: superadminUser.id,
        accountId: superadminUser.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });
  } else {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: hashedPassword },
    });
  }

  const superRole = await prisma.role.findUnique({ where: { key: "super_admin" } });
  if (superRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: superadminUser.id,
          roleId: superRole.id,
        },
      },
      update: {},
      create: {
        userId: superadminUser.id,
        roleId: superRole.id,
      },
    });
  }

  // 3. Kosongkan seluruh tabel operasional & master hris dan sysmgmt menggunakan TRUNCATE CASCADE
  console.log("🗑️ Mengosongkan seluruh tabel modul HRIS, System Management, dan data operasional...");

  const tablesToTruncate = [
    // HRIS Payroll & Timesheet
    "hris.payslip_lines",
    "hris.payslips",
    "hris.payroll_periods",
    "hris.employee_salary_components",
    "hris.salary_components",
    "hris.payroll_settings",
    "hris.timesheet_reviewers",
    "hris.timesheet_submissions",

    // HRIS Cuti & Absensi
    "hris.leave_requests",
    "hris.leave_balances",
    "hris.leave_types",
    "hris.attendances",
    "hris.holidays",
    "hris.work_schedule_settings",

    // HRIS Performance & Recruitment
    "hris.performance_reviews",
    "hris.performance_goals",
    "hris.performance_periods",
    "hris.interviews",
    "hris.applications",
    "hris.candidates",
    "hris.job_openings",
    "hris.onboarding_tasks",
    "hris.training_records",

    // Sysmgmt Assets & Documents
    "sysmgmt.asset_assignments",
    "sysmgmt.assets",
    "sysmgmt.software_licenses",
    "sysmgmt.document_versions",
    "sysmgmt.documents",

    // HRIS Data Pokok Kepegawaian & Struktur Organisasi
    "hris.employment_histories",
    "hris.employment_contracts",
    "hris.employment_types",
    "hris.employees",
    "hris.positions",
    "hris.departments",

    // Core Log & Sesi
    "core.audit_logs",
    "core.notifications",
    "core.sessions",
  ];

  for (const table of tablesToTruncate) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table} CASCADE;`);
      console.log(`   ✓ Truncated: ${table}`);
    } catch (err: unknown) {
      console.warn(`   ⚠️ Warning saat truncate ${table}:`, err instanceof Error ? err.message : err);
    }
  }

  // 4. Hapus seluruh akun pengguna dummy lain, hanya sisakan superadmin
  console.log("👥 Menghapus akun-akun pengguna non-superadmin...");
  await prisma.userRole.deleteMany({
    where: { userId: { not: superadminUser.id } },
  });
  await prisma.account.deleteMany({
    where: { userId: { not: superadminUser.id } },
  });
  await prisma.session.deleteMany({});
  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { not: superadminUser.id } },
  });
  console.log(`   ✓ ${deletedUsers.count} akun pengguna non-superadmin berhasil dihapus.`);

  console.log("\n==========================================================");
  console.log("✅ DATABASE BERHASIL DIKOSONGKAN SECARA TOTAL!");
  console.log("==========================================================");
  console.log("👤 Akun Superadmin Aktif:");
  console.log(`   - Email    : ${superadminEmail}`);
  console.log(`   - Password : ${superadminPassword}`);
  console.log(`   - Role     : super_admin`);
  console.log("Semua data master (Departemen, Jabatan, Karyawan, Cuti, dsb.) sekarang kosong.");
  console.log("Anda dapat mulai menginput manual satu per satu dari antarmuka web.");
  console.log("==========================================================");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat pengosongan database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

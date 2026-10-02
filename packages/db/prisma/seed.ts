import { PrismaClient } from "@prisma/client";
import { PERMISSIONS, SYSTEM_ROLES } from "@pspk/rbac";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Menyiapkan data awal sistem PSPK Platform...");

  // 1. Seed Permissions
  console.log(`📦 Seeding ${PERMISSIONS.length} system permissions...`);
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

  // 2. Seed Roles & RolePermissions
  console.log(`🛡️ Seeding ${SYSTEM_ROLES.length} system roles...`);
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

    // Sinkronisasi permission untuk role
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

  // 3. Seed Akun Utama Superadmin
  console.log("👤 Seeding superadmin account...");
  const superAdminEmail = "superadmin@pspk.id";
  const superAdminName = "Super Administrator PSPK";
  const superAdminPass = "Superadmin321!";

  const superAdminUser = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      name: superAdminName,
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: superAdminEmail,
      name: superAdminName,
      isActive: true,
      emailVerified: true,
    },
  });

  const hashedPassword = await hashPassword(superAdminPass);
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: superAdminUser.id,
      providerId: "credential",
    },
  });

  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: superAdminUser.id,
        accountId: superAdminUser.id,
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

  // Hubungkan role super_admin
  const superAdminRole = await prisma.role.findUnique({ where: { key: "super_admin" } });
  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: superAdminUser.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    });
  }
  console.log(`   ✓ Akun siap: ${superAdminEmail} (super_admin)`);

  // 4. Seed Tipe Cuti Master (Default)
  console.log("🏖️ Menyiapkan master tipe cuti...");
  const defaultLeaveTypes = [
    { name: "Cuti Tahunan", defaultQuotaDays: 12, isPaid: true, requiresAttachment: false },
    { name: "Cuti Sakit", defaultQuotaDays: 14, isPaid: true, requiresAttachment: true },
    { name: "Cuti Melahirkan", defaultQuotaDays: 90, isPaid: true, requiresAttachment: true },
    { name: "Cuti Penting", defaultQuotaDays: 5, isPaid: true, requiresAttachment: false },
  ];

  for (const lt of defaultLeaveTypes) {
    const existing = await prisma.leaveType.findFirst({ where: { name: lt.name } });
    if (!existing) {
      await prisma.leaveType.create({ data: lt });
    }
  }

  // 5. Seed Tipe Ikatan Kerja Master (Default)
  console.log("📋 Menyiapkan master tipe ikatan kerja...");
  const defaultEmploymentTypes = [
    {
      code: "PERMANENT",
      name: "Pegawai Tetap (Permanent)",
      category: "PERMANENT" as const,
      wageType: "MONTHLY" as const,
      defaultHourlyRate: null,
      description: "Pegawai tetap lembaga dengan skema gaji bulanan penuh, tunjangan, dan benefit organisasi.",
    },
    {
      code: "PKWT_RISET",
      name: "PKWT Riset Kebijakan (Gaji Bulanan)",
      category: "FIXED_TERM" as const,
      wageType: "MONTHLY" as const,
      defaultHourlyRate: null,
      description: "Perjanjian Kerja Waktu Tertentu (PKWT) untuk proyek riset berjangka dengan skema upah bulanan.",
    },
    {
      code: "PKWT_HOURLY",
      name: "PKWT Freelance / Peneliti Lepas (Upah Per Jam)",
      category: "FIXED_TERM" as const,
      wageType: "HOURLY" as const,
      defaultHourlyRate: 30000,
      description: "Staf PKWT lepas berbasis jam kerja terverifikasi lembar timesheet acc Project Lead (No Work, No Pay).",
    },
    {
      code: "PART_TIME_PROJECT",
      name: "Paruh Waktu / Proyek Ad-Hoc",
      category: "PART_TIME_PROJECT" as const,
      wageType: "MONTHLY" as const,
      defaultHourlyRate: null,
      description: "Penugasan paruh waktu fleksibel per deliverables proyek riset tertentu.",
    },
    {
      code: "INTERNSHIP",
      name: "Program Magang Riset (Internship)",
      category: "PART_TIME_PROJECT" as const,
      wageType: "MONTHLY" as const,
      defaultHourlyRate: null,
      description: "Peserta program magang mahasiswa / fresh graduate dengan uang saku bulanan.",
    },
  ];

  for (const et of defaultEmploymentTypes) {
    await prisma.employmentTypeMaster.upsert({
      where: { code: et.code },
      update: {
        name: et.name,
        category: et.category,
        wageType: et.wageType,
        defaultHourlyRate: et.defaultHourlyRate,
        description: et.description,
      },
      create: et,
    });
  }

  // 6. Seed Jadwal Kerja Default
  console.log("⏰ Menyiapkan pengaturan jadwal kerja standar...");
  const defaultSchedule = await prisma.workScheduleSetting.findFirst({
    where: { isDefault: true },
  });
  if (!defaultSchedule) {
    await prisma.workScheduleSetting.create({
      data: {
        name: "Jadwal Kerja Reguler PSPK",
        workStartTime: "09:00",
        workEndTime: "17:00",
        gracePeriodMins: 15,
        workingDays: [1, 2, 3, 4, 5],
        isFlexible: false,
        isDefault: true,
      },
    });
  }

  // 7. Seed Pengaturan Payroll & Kop Surat Default
  console.log("🏛️ Menyiapkan pengaturan kop surat payroll...");
  const defaultPayrollSetting = await prisma.payrollSetting.findFirst({
    where: { isDefault: true },
  });
  if (!defaultPayrollSetting) {
    await prisma.payrollSetting.create({
      data: {
        institutionName: "Pusat Studi Pendidikan & Kebijakan",
        subHeader: "HR & Finance Division • Sistem Penggajian Elektronik",
        addressLine: "Gedung Edukasi Lt. 3, Jl. Kebijakan No. 45, Jakarta Selatan",
        borderStyle: "NAVY_SOLID",
        disclaimerText:
          "Dokumen ini diterbitkan secara elektronik oleh Divisi SDM & Keuangan Pusat Studi Pendidikan dan Kebijakan (PSPK). Sah tanpa tanda tangan basah.",
        senderBankName: "Bank Central Asia (BCA)",
        senderAccountName: "Pusat Studi Pendidikan dan Kebijakan",
        senderBranch: "KCU Jakarta Rasuna Said",
        payrollTransferNote: "Payroll Gaji Pegawai PSPK",
        isDefault: true,
      },
    });
  }

  console.log("✅ Inisialisasi data sistem selesai tanpa data dummy!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
import { PERMISSIONS, SYSTEM_ROLES } from "@pspk/rbac";
import { hashPassword } from "better-auth/crypto";
import { SYSTEM_MODULE_DEFINITIONS } from "../src/modules";

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

  // 8. Seed Hari Libur Nasional & Cuti Bersama
  console.log("🇮🇩 Menyiapkan data hari libur nasional & cuti bersama...");
  const baselineHolidays: Array<{ date: string; name: string; isCollectiveLeave: boolean }> = [
    // 2025
    { date: "2025-01-01", name: "Tahun Baru 2025 Masehi", isCollectiveLeave: false },
    { date: "2025-01-27", name: "Isra Mi'raj Nabi Muhammad SAW", isCollectiveLeave: false },
    { date: "2025-01-28", name: "Cuti Bersama Tahun Baru Imlek 2576 Kongzili", isCollectiveLeave: true },
    { date: "2025-01-29", name: "Tahun Baru Imlek 2576 Kongzili", isCollectiveLeave: false },
    { date: "2025-03-28", name: "Cuti Bersama Hari Suci Nyepi", isCollectiveLeave: true },
    { date: "2025-03-29", name: "Hari Suci Nyepi (Tahun Baru Saka 1947)", isCollectiveLeave: false },
    { date: "2025-03-31", name: "Hari Raya Idul Fitri 1446 H", isCollectiveLeave: false },
    { date: "2025-04-01", name: "Hari Raya Idul Fitri 1446 H", isCollectiveLeave: false },
    { date: "2025-04-02", name: "Cuti Bersama Idul Fitri 1446 H", isCollectiveLeave: true },
    { date: "2025-04-03", name: "Cuti Bersama Idul Fitri 1446 H", isCollectiveLeave: true },
    { date: "2025-04-04", name: "Cuti Bersama Idul Fitri 1446 H", isCollectiveLeave: true },
    { date: "2025-04-07", name: "Cuti Bersama Idul Fitri 1446 H", isCollectiveLeave: true },
    { date: "2025-04-18", name: "Wafat Yesus Kristus", isCollectiveLeave: false },
    { date: "2025-04-20", name: "Kebangkitan Yesus Kristus (Paskah)", isCollectiveLeave: false },
    { date: "2025-05-01", name: "Hari Buruh Internasional", isCollectiveLeave: false },
    { date: "2025-05-12", name: "Hari Raya Waisak 2569 BE", isCollectiveLeave: false },
    { date: "2025-05-13", name: "Cuti Bersama Hari Raya Waisak 2569 BE", isCollectiveLeave: true },
    { date: "2025-05-29", name: "Kenaikan Yesus Kristus", isCollectiveLeave: false },
    { date: "2025-05-30", name: "Cuti Bersama Kenaikan Yesus Kristus", isCollectiveLeave: true },
    { date: "2025-06-01", name: "Hari Lahir Pancasila", isCollectiveLeave: false },
    { date: "2025-06-06", name: "Hari Raya Idul Adha 1446 H", isCollectiveLeave: false },
    { date: "2025-06-09", name: "Cuti Bersama Hari Raya Idul Adha 1446 H", isCollectiveLeave: true },
    { date: "2025-06-27", name: "1 Muharram / Tahun Baru Islam 1447 H", isCollectiveLeave: false },
    { date: "2025-08-17", name: "Proklamasi Kemerdekaan RI Ke-80", isCollectiveLeave: false },
    { date: "2025-09-05", name: "Maulid Nabi Muhammad SAW", isCollectiveLeave: false },
    { date: "2025-12-25", name: "Hari Raya Natal", isCollectiveLeave: false },
    { date: "2025-12-26", name: "Cuti Bersama Natal", isCollectiveLeave: true },
    // 2026
    { date: "2026-01-01", name: "Tahun Baru 2026 Masehi", isCollectiveLeave: false },
    { date: "2026-01-16", name: "Isra Mi'raj Nabi Muhammad SAW", isCollectiveLeave: false },
    { date: "2026-02-16", name: "Cuti Bersama Tahun Baru Imlek 2577 Kongzili", isCollectiveLeave: true },
    { date: "2026-02-17", name: "Tahun Baru Imlek 2577 Kongzili", isCollectiveLeave: false },
    { date: "2026-03-19", name: "Hari Suci Nyepi (Tahun Baru Saka 1948)", isCollectiveLeave: false },
    { date: "2026-03-20", name: "Hari Raya Idul Fitri 1447 H", isCollectiveLeave: false },
    { date: "2026-03-21", name: "Hari Raya Idul Fitri 1447 H", isCollectiveLeave: false },
    { date: "2026-03-23", name: "Cuti Bersama Hari Raya Idul Fitri 1447 H", isCollectiveLeave: true },
    { date: "2026-03-24", name: "Cuti Bersama Hari Raya Idul Fitri 1447 H", isCollectiveLeave: true },
    { date: "2026-04-03", name: "Wafat Yesus Kristus", isCollectiveLeave: false },
    { date: "2026-04-05", name: "Kebangkitan Yesus Kristus (Paskah)", isCollectiveLeave: false },
    { date: "2026-05-01", name: "Hari Buruh Internasional", isCollectiveLeave: false },
    { date: "2026-05-14", name: "Kenaikan Yesus Kristus", isCollectiveLeave: false },
    { date: "2026-05-27", name: "Hari Raya Idul Adha 1447 H", isCollectiveLeave: false },
    { date: "2026-05-31", name: "Hari Raya Waisak 2570 BE", isCollectiveLeave: false },
    { date: "2026-06-01", name: "Hari Lahir Pancasila", isCollectiveLeave: false },
    { date: "2026-06-16", name: "Tahun Baru Islam 1448 H", isCollectiveLeave: false },
    { date: "2026-08-17", name: "Proklamasi Kemerdekaan RI Ke-81", isCollectiveLeave: false },
    { date: "2026-08-25", name: "Maulid Nabi Muhammad SAW", isCollectiveLeave: false },
    { date: "2026-12-25", name: "Hari Raya Natal", isCollectiveLeave: false },
    { date: "2026-12-26", name: "Cuti Bersama Hari Raya Natal", isCollectiveLeave: true },
  ];

  for (const h of baselineHolidays) {
    const [yStr, mStr, dStr] = h.date.split("-");
    const holidayDate = new Date(Date.UTC(Number(yStr), Number(mStr) - 1, Number(dStr), 0, 0, 0, 0));
    await prisma.holiday.upsert({
      where: { date: holidayDate },
      update: {
        name: h.name,
        isCollectiveLeave: h.isCollectiveLeave,
      },
      create: {
        date: holidayDate,
        name: h.name,
        isCollectiveLeave: h.isCollectiveLeave,
      },
    });
  }
  console.log(`   ✓ ${baselineHolidays.length} hari libur nasional & cuti bersama (2025-2026) siap.`);

  // 9. Seed Pengaturan Modul Sistem (System Settings & Module Flags)
  console.log("⚙️ Menyiapkan pengaturan modul sistem (system settings)...");
  for (const mod of SYSTEM_MODULE_DEFINITIONS) {
    await prisma.systemSetting.upsert({
      where: { key: mod.key },
      update: {
        description: mod.description,
      },
      create: {
        key: mod.key,
        value: String(mod.defaultEnabled),
        category: "MODULE",
        description: mod.description,
        updatedBy: "system_seed",
      },
    });
  }
  console.log(`   ✓ ${SYSTEM_MODULE_DEFINITIONS.length} modul konfigurasi sistem berhasil disiapkan.`);

  const gCalApiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  if (gCalApiKey) {
    console.log("   🔄 Mengambil update libur nasional langsung dari Google Calendar API...");
    try {
      const currentYear = new Date().getFullYear();
      const calId = "id.indonesian#holiday@group.v.calendar.google.com";
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?key=${gCalApiKey}&timeMin=${currentYear}-01-01T00:00:00Z&timeMax=${currentYear}-12-31T23:59:59Z&singleEvents=true`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as { items?: Array<{ summary?: string; start?: { date?: string } }> };
        let gCount = 0;
        if (data.items) {
          for (const item of data.items) {
            if (item.start?.date && item.summary) {
              const [y, m, d] = item.start.date.split("-").map(Number);
              const dateObj = new Date(Date.UTC(y!, m! - 1, d!, 0, 0, 0, 0));
              const isColl = item.summary.toLowerCase().includes("cuti bersama");
              await prisma.holiday.upsert({
                where: { date: dateObj },
                update: { name: item.summary, isCollectiveLeave: isColl },
                create: { date: dateObj, name: item.summary, isCollectiveLeave: isColl },
              });
              gCount++;
            }
          }
        }
        console.log(`   ✓ Berhasil menyinkronkan ${gCount} event dari Google Calendar.`);
      } else {
        console.log(`   ⚠️ Google Calendar API mengembalikan status ${res.status}.`);
      }
    } catch (err) {
      console.log("   ⚠️ Gagal memanggil Google Calendar API:", err);
    }
  } else {
    console.log("   ℹ️ GOOGLE_CALENDAR_API_KEY tidak diatur, melewati sinkronisasi live Google Calendar.");
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

import { PrismaClient } from "@prisma/client";
import { PERMISSIONS, SYSTEM_ROLES } from "@pspk/rbac";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai proses seeding database PSPK Platform...");

  // 1. Seed Permissions
  console.log(`📦 Seeding ${PERMISSIONS.length} permissions...`);
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

    // Sync permissions for this role
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

  // 3. Seed Core User Accounts (@pspk.id)
  console.log("👤 Seeding core user accounts with @pspk.id domain...");
  const accountsToSeed = [
    {
      email: "superadmin@pspk.id",
      name: "Super Administrator PSPK",
      password: "Superadmin321!",
      roleKey: "super_admin",
    },
    {
      email: "hr@pspk.id",
      name: "Admin HR PSPK",
      password: "Humanresource321!",
      roleKey: "admin_hr",
    },
    {
      email: "manajer@pspk.id",
      name: "Dr. Budi Rahardjo, M.Ed.",
      password: "Manajerpspk321!",
      roleKey: "manager",
    },
    {
      email: "aris@pspk.id",
      name: "I Made Aris Danuarta",
      password: "arisdanuarta321!",
      roleKey: "staff",
    },
  ];

  const userMap = new Map<string, string>(); // email -> userId

  for (const acc of accountsToSeed) {
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        name: acc.name,
        isActive: true,
        emailVerified: true,
      },
      create: {
        email: acc.email,
        name: acc.name,
        isActive: true,
        emailVerified: true,
      },
    });

    userMap.set(acc.email, user.id);

    // Create or update credential account
    const hashedPassword = await hashPassword(acc.password);
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: "credential",
      },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
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

    // Assign role
    const role = await prisma.role.findUnique({ where: { key: acc.roleKey } });
    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }
    console.log(`   ✓ Akun siap: ${acc.email} (${acc.roleKey})`);
  }

  // 4. Seed Default Leave Types
  console.log("🏖️ Seeding default leave types...");
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

  // 5. Seed PSPK Departments & Positions
  console.log("🏛️ Seeding PSPK departments and positions...");
  const orgStructure = [
    {
      name: "Divisi Kebijakan Kurikulum & Pembelajaran",
      positions: [
        "Kepala Divisi Kebijakan Kurikulum",
        "Peneliti Kebijakan Kurikulum Utama",
        "Peneliti Kebijakan Kurikulum Muda",
      ],
    },
    {
      name: "Divisi Tata Kelola & Advokasi Pendidikan",
      positions: [
        "Kepala Divisi Tata Kelola Pendidikan",
        "Analis Kebijakan Tata Kelola",
        "Asisten Riset Kebijakan",
      ],
    },
    {
      name: "Divisi Asesmen & Standar Pendidikan",
      positions: [
        "Kepala Divisi Asesmen Pendidikan",
        "Spesialis Asesmen & Evaluasi",
      ],
    },
    {
      name: "Divisi Kemitraan & Komunikasi Publik",
      positions: [
        "Kepala Divisi Kemitraan",
        "Spesialis Komunikasi & Advokasi",
      ],
    },
    {
      name: "Divisi Operasional & Sumber Daya Manusia",
      positions: [
        "Kepala Divisi Operasional & SDM",
        "Staf Administrasi & HR",
        "Staf Keuangan & Akuntansi",
      ],
    },
  ];

  const departmentMap = new Map<string, string>();
  const positionMap = new Map<string, string>();

  for (const dept of orgStructure) {
    let department = await prisma.department.findFirst({ where: { name: dept.name } });
    if (!department) {
      department = await prisma.department.create({
        data: { name: dept.name },
      });
    }
    departmentMap.set(dept.name, department.id);

    for (const posTitle of dept.positions) {
      let position = await prisma.position.findFirst({
        where: { title: posTitle, departmentId: department.id },
      });
      if (!position) {
        position = await prisma.position.create({
          data: {
            title: posTitle,
            departmentId: department.id,
          },
        });
      }
      positionMap.set(posTitle, position.id);
    }
  }

  // 6. Seed Sample Employees with Encrypted Sensitive Fields & Contracts
  console.log("👥 Seeding sample employees with contracts and encrypted sensitive fields...");
  const { encryptField } = await import("@pspk/shared");

  const deptKurikulumId = departmentMap.get("Divisi Kebijakan Kurikulum & Pembelajaran")!;
  const posKepalaKurikulumId = positionMap.get("Kepala Divisi Kebijakan Kurikulum")!;
  const posPenelitiMudaId = positionMap.get("Peneliti Kebijakan Kurikulum Muda")!;

  const deptTataKelolaId = departmentMap.get("Divisi Tata Kelola & Advokasi Pendidikan")!;
  const posAsistenRisetId = positionMap.get("Asisten Riset Kebijakan")!;

  const deptOpsId = departmentMap.get("Divisi Operasional & Sumber Daya Manusia")!;
  const posStafKeuanganId = positionMap.get("Staf Keuangan & Akuntansi")!;
  const posStafHRId = positionMap.get("Staf Administrasi & HR")!;

  // Employee 1: Director / Manager (manajer@pspk.id)
  let emp1 = await prisma.employee.findUnique({ where: { employeeNo: "PSPK-202401-001" } });
  if (!emp1) {
    emp1 = await prisma.employee.create({
      data: {
        employeeNo: "PSPK-202401-001",
        fullName: "Dr. Budi Rahardjo, M.Ed.",
        nickname: "Budi",
        workEmail: "manajer@pspk.id",
        userId: userMap.get("manajer@pspk.id"),
        personalEmail: "budi.rahardjo.personal@example.com",
        phone: "+6281234567890",
        birthDate: new Date("1978-04-12"),
        birthPlace: "Jakarta",
        gender: "MALE",
        maritalStatus: "MARRIED",
        address: "Jl. Wijaya Timur No. 14, Kebayoran Baru, Jakarta Selatan",
        emergencyContactName: "Ratna Sari",
        emergencyContactPhone: "+6281234567899",
        nikEnc: encryptField("3171012304780001"),
        npwpEnc: encryptField("09.123.456.7-012.000"),
        bankName: "Bank Mandiri",
        bankAccountEnc: encryptField("1270009876543"),
        bankAccountName: "Budi Rahardjo",
        joinDate: new Date("2024-01-01"),
        status: "ACTIVE",
        currentDepartmentId: deptKurikulumId,
        currentPositionId: posKepalaKurikulumId,
        contracts: {
          create: {
            type: "PERMANENT",
            startDate: new Date("2024-01-01"),
            baseSalary: 25000000,
            status: "ACTIVE",
            notes: "Kontrak Pegawai Tetap Peneliti Utama & Manajer",
          },
        },
      },
    });
  } else {
    await prisma.employee.update({
      where: { id: emp1.id },
      data: {
        workEmail: "manajer@pspk.id",
        userId: userMap.get("manajer@pspk.id"),
      },
    });
  }

  // Employee 2: Researcher (siti.aminah@pspk.id)
  let emp2 = await prisma.employee.findUnique({ where: { employeeNo: "PSPK-202510-015" } });
  if (!emp2) {
    emp2 = await prisma.employee.create({
      data: {
        employeeNo: "PSPK-202510-015",
        fullName: "Siti Aminah, S.Sos., M.Si.",
        nickname: "Siti",
        workEmail: "siti.aminah@pspk.id",
        personalEmail: "siti.aminah@example.com",
        phone: "+6281398765432",
        birthDate: new Date("1992-08-25"),
        birthPlace: "Bandung",
        gender: "FEMALE",
        maritalStatus: "SINGLE",
        address: "Jl. Tebet Barat Dalam VII No. 8, Jakarta Selatan",
        emergencyContactName: "Ahmad Sobari",
        emergencyContactPhone: "+6281398765400",
        nikEnc: encryptField("3201026508920003"),
        npwpEnc: encryptField("15.789.012.3-045.000"),
        bankName: "Bank BCA",
        bankAccountEnc: encryptField("8690123456"),
        bankAccountName: "Siti Aminah",
        joinDate: new Date("2025-10-15"),
        endDate: new Date("2026-10-15"),
        status: "ACTIVE",
        managerId: emp1.id,
        currentDepartmentId: deptKurikulumId,
        currentPositionId: posPenelitiMudaId,
        contracts: {
          create: {
            type: "FIXED_TERM",
            startDate: new Date("2025-10-15"),
            endDate: new Date("2026-10-15"),
            baseSalary: 12500000,
            status: "ACTIVE",
            notes: "PKWT Riset Kebijakan Asesmen Daerah",
          },
        },
      },
    });
  } else {
    await prisma.employee.update({
      where: { id: emp2.id },
      data: { workEmail: "siti.aminah@pspk.id" },
    });
  }

  // Employee 3: Junior Researcher (made.wirawan@pspk.id)
  let emp3 = await prisma.employee.findUnique({ where: { employeeNo: "PSPK-202503-008" } });
  if (!emp3) {
    emp3 = await prisma.employee.create({
      data: {
        employeeNo: "PSPK-202503-008",
        fullName: "I Made Wirawan, M.Pd.",
        nickname: "Made",
        workEmail: "made.wirawan@pspk.id",
        personalEmail: "made.wirawan@example.com",
        phone: "+6281122334455",
        birthDate: new Date("1990-05-14"),
        birthPlace: "Denpasar",
        gender: "MALE",
        maritalStatus: "MARRIED",
        address: "Jl. Fatmawati Raya No. 45, Cilandak, Jakarta Selatan",
        emergencyContactName: "Ni Putu Ayu",
        emergencyContactPhone: "+6281122334466",
        nikEnc: encryptField("5171031405900002"),
        npwpEnc: encryptField("22.345.678.9-901.000"),
        bankName: "Bank BNI",
        bankAccountEnc: encryptField("0456789012"),
        bankAccountName: "I Made Wirawan",
        joinDate: new Date("2025-03-01"),
        endDate: new Date("2027-02-28"),
        status: "ACTIVE",
        managerId: emp1.id,
        currentDepartmentId: deptTataKelolaId,
        currentPositionId: posAsistenRisetId,
        contracts: {
          create: {
            type: "FIXED_TERM",
            startDate: new Date("2025-03-01"),
            endDate: new Date("2027-02-28"),
            baseSalary: 10000000,
            status: "ACTIVE",
            notes: "PKWT Riset Tata Kelola Guru 2 Tahun",
          },
        },
      },
    });
  } else {
    await prisma.employee.update({
      where: { id: emp3.id },
      data: { workEmail: "made.wirawan@pspk.id" },
    });
  }

  // Employee 4: Probation Staff (anisa.larasati@pspk.id)
  let emp4 = await prisma.employee.findUnique({ where: { employeeNo: "PSPK-202607-021" } });
  if (!emp4) {
    emp4 = await prisma.employee.create({
      data: {
        employeeNo: "PSPK-202607-021",
        fullName: "Anisa Larasati, S.E.",
        nickname: "Anisa",
        workEmail: "anisa.larasati@pspk.id",
        phone: "+6281987654321",
        birthDate: new Date("1996-12-15"),
        birthPlace: "Surabaya",
        gender: "FEMALE",
        maritalStatus: "SINGLE",
        address: "Jl. Panglima Polim IV No. 20, Kebayoran Baru, Jakarta Selatan",
        nikEnc: encryptField("3174095512960004"),
        npwpEnc: encryptField("33.456.789.0-123.000"),
        bankName: "Bank Mandiri",
        bankAccountEnc: encryptField("1330012345678"),
        bankAccountName: "Anisa Larasati",
        joinDate: new Date("2026-07-01"),
        status: "PROBATION",
        currentDepartmentId: deptOpsId,
        currentPositionId: posStafKeuanganId,
        contracts: {
          create: {
            type: "FIXED_TERM",
            startDate: new Date("2026-07-01"),
            endDate: new Date("2026-12-31"),
            baseSalary: 8500000,
            status: "ACTIVE",
            notes: "Masa Percobaan 6 Bulan Staf Keuangan",
          },
        },
      },
    });
  } else {
    await prisma.employee.update({
      where: { id: emp4.id },
      data: { workEmail: "anisa.larasati@pspk.id" },
    });
  }

  // Employee 5: Admin HR (hr@pspk.id)
  let emp5 = await prisma.employee.findUnique({ where: { employeeNo: "PSPK-202405-004" } });
  if (!emp5) {
    emp5 = await prisma.employee.create({
      data: {
        employeeNo: "PSPK-202405-004",
        fullName: "Dewi Permata, S.Psi.",
        nickname: "Dewi",
        workEmail: "hr@pspk.id",
        userId: userMap.get("hr@pspk.id"),
        phone: "+6285211223344",
        birthDate: new Date("1989-09-24"),
        birthPlace: "Yogyakarta",
        gender: "FEMALE",
        maritalStatus: "MARRIED",
        address: "Jl. Ampera Raya No. 12, Pasar Minggu, Jakarta Selatan",
        nikEnc: encryptField("3175024409890005"),
        npwpEnc: encryptField("44.567.890.1-234.000"),
        bankName: "Bank BCA",
        bankAccountEnc: encryptField("7120987654"),
        bankAccountName: "Dewi Permata",
        joinDate: new Date("2024-05-01"),
        status: "ACTIVE",
        currentDepartmentId: deptOpsId,
        currentPositionId: posStafHRId,
        contracts: {
          create: {
            type: "PERMANENT",
            startDate: new Date("2024-05-01"),
            baseSalary: 11000000,
            status: "ACTIVE",
            notes: "Staf HR Lembaga",
          },
        },
      },
    });
  } else {
    await prisma.employee.update({
      where: { id: emp5.id },
      data: {
        workEmail: "hr@pspk.id",
        userId: userMap.get("hr@pspk.id"),
      },
    });
  }

  // Employee 6: Super Administrator (superadmin@pspk.id)
  let empSuperAdmin = await prisma.employee.findUnique({ where: { employeeNo: "PSPK-202401-000" } });
  if (!empSuperAdmin) {
    empSuperAdmin = await prisma.employee.create({
      data: {
        employeeNo: "PSPK-202401-000",
        fullName: "Super Administrator PSPK",
        nickname: "Superadmin",
        workEmail: "superadmin@pspk.id",
        userId: userMap.get("superadmin@pspk.id"),
        phone: "+6281100001111",
        birthDate: new Date("1985-01-01"),
        birthPlace: "Jakarta",
        gender: "MALE",
        maritalStatus: "MARRIED",
        address: "Gedung PSPK Lt. 3, Jakarta Selatan",
        nikEnc: encryptField("3171010101850001"),
        npwpEnc: encryptField("01.000.000.0-001.000"),
        bankName: "Bank Mandiri",
        bankAccountEnc: encryptField("1270001112223"),
        bankAccountName: "Super Administrator PSPK",
        joinDate: new Date("2024-01-01"),
        status: "ACTIVE",
        currentDepartmentId: deptOpsId,
        currentPositionId: posStafHRId,
        contracts: {
          create: {
            type: "PERMANENT",
            startDate: new Date("2024-01-01"),
            baseSalary: 35000000,
            status: "ACTIVE",
            notes: "Super Administrator & IT Lead",
          },
        },
      },
    });
  } else {
    await prisma.employee.update({
      where: { id: empSuperAdmin.id },
      data: {
        workEmail: "superadmin@pspk.id",
        userId: userMap.get("superadmin@pspk.id"),
      },
    });
  }

  // Employee 7: Karyawan Staff (aris@pspk.id)
  let empAris = await prisma.employee.findUnique({ where: { employeeNo: "PSPK-202401-006" } });
  if (!empAris) {
    empAris = await prisma.employee.create({
      data: {
        employeeNo: "PSPK-202401-006",
        fullName: "I Made Aris Danuarta",
        nickname: "Aris",
        workEmail: "aris@pspk.id",
        userId: userMap.get("aris@pspk.id"),
        personalEmail: "arisdanuarta@example.com",
        phone: "+6281234567891",
        birthDate: new Date("1995-08-17"),
        birthPlace: "Denpasar",
        gender: "MALE",
        maritalStatus: "SINGLE",
        address: "Jl. Sudirman No. 88, Jakarta Pusat",
        emergencyContactName: "I Wayan Danu",
        emergencyContactPhone: "+6281234567898",
        nikEnc: encryptField("5171021708950001"),
        npwpEnc: encryptField("21.987.654.3-210.000"),
        bankName: "Bank BCA",
        bankAccountEnc: encryptField("8690987654"),
        bankAccountName: "I Made Aris Danuarta",
        joinDate: new Date("2024-01-01"),
        status: "ACTIVE",
        managerId: emp1.id,
        currentDepartmentId: deptOpsId,
        currentPositionId: posStafHRId,
        contracts: {
          create: {
            type: "PERMANENT",
            startDate: new Date("2024-01-01"),
            baseSalary: 18000000,
            status: "ACTIVE",
            notes: "Pegawai Tetap IT Administrator PSPK",
          },
        },
      },
    });
  } else {
    await prisma.employee.update({
      where: { id: empAris.id },
      data: {
        workEmail: "aris@pspk.id",
        userId: userMap.get("aris@pspk.id"),
      },
    });
  }

  // 8. Seed Holidays for 2026 (Hari Libur Nasional & Cuti Bersama)
  console.log("📅 Seeding kalender hari libur 2026...");
  const holidays2026 = [
    { date: new Date("2026-01-01"), name: "Tahun Baru 2026 Masehi", isCollectiveLeave: false },
    { date: new Date("2026-01-16"), name: "Isra Mikraj Nabi Muhammad SAW", isCollectiveLeave: false },
    { date: new Date("2026-02-17"), name: "Tahun Baru Imlek 2577 Kongzili", isCollectiveLeave: false },
    { date: new Date("2026-03-19"), name: "Hari Suci Nyepi Tahun Baru Saka 1948", isCollectiveLeave: false },
    { date: new Date("2026-03-20"), name: "Hari Raya Idul Fitri 1447 Hijriah (Hari Pertama)", isCollectiveLeave: false },
    { date: new Date("2026-03-21"), name: "Hari Raya Idul Fitri 1447 Hijriah (Hari Kedua)", isCollectiveLeave: false },
    { date: new Date("2026-03-23"), name: "Cuti Bersama Hari Raya Idul Fitri 1447 H", isCollectiveLeave: true },
    { date: new Date("2026-03-24"), name: "Cuti Bersama Hari Raya Idul Fitri 1447 H", isCollectiveLeave: true },
    { date: new Date("2026-04-03"), name: "Wafat Yesus Kristus (Jumat Agung)", isCollectiveLeave: false },
    { date: new Date("2026-05-01"), name: "Hari Buruh Internasional", isCollectiveLeave: false },
    { date: new Date("2026-05-14"), name: "Kenaikan Yesus Kristus", isCollectiveLeave: false },
    { date: new Date("2026-05-27"), name: "Hari Raya Idul Adha 1447 Hijriah", isCollectiveLeave: false },
    { date: new Date("2026-05-31"), name: "Hari Raya Waisak 2570 BE", isCollectiveLeave: false },
    { date: new Date("2026-06-01"), name: "Hari Lahir Pancasila", isCollectiveLeave: false },
    { date: new Date("2026-06-16"), name: "Tahun Baru Islam 1448 Hijriah", isCollectiveLeave: false },
    { date: new Date("2026-08-17"), name: "Hari Kemerdekaan Republik Indonesia ke-81", isCollectiveLeave: false },
    { date: new Date("2026-08-25"), name: "Maulid Nabi Muhammad SAW", isCollectiveLeave: false },
    { date: new Date("2026-12-25"), name: "Hari Raya Natal", isCollectiveLeave: false },
    { date: new Date("2026-12-26"), name: "Cuti Bersama Hari Raya Natal", isCollectiveLeave: true },
  ];

  for (const h of holidays2026) {
    await prisma.holiday.upsert({
      where: { date: h.date },
      update: { name: h.name, isCollectiveLeave: h.isCollectiveLeave },
      create: h,
    });
  }

  // 9. Seed Leave Balances for 2026
  console.log("🏖️ Seeding saldo cuti karyawan tahun 2026...");
  const allEmployees = await prisma.employee.findMany({ where: { deletedAt: null } });
  const allLeaveTypes = await prisma.leaveType.findMany({ where: { isActive: true } });

  for (const emp of allEmployees) {
    for (const lt of allLeaveTypes) {
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: emp.id,
            leaveTypeId: lt.id,
            year: 2026,
          },
        },
        update: {
          quotaDays: lt.defaultQuotaDays,
        },
        create: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          year: 2026,
          quotaDays: lt.defaultQuotaDays,
          usedDays: 0,
        },
      });
    }
  }

  // 10. Seed Sample Attendance Records (September 2026)
  console.log("⏰ Seeding catatan presensi September 2026...");
  const septDates = [
    { date: new Date("2026-09-18"), inHour: 8, inMin: 45, outHour: 17, outMin: 15, status: "PRESENT" as const },
    { date: new Date("2026-09-21"), inHour: 8, inMin: 50, outHour: 17, outMin: 30, status: "PRESENT" as const },
    { date: new Date("2026-09-22"), inHour: 9, inMin: 12, outHour: 18, outMin: 0, status: "LATE" as const },
  ];

  for (const emp of allEmployees) {
    for (const d of septDates) {
      const checkIn = new Date(d.date);
      checkIn.setHours(d.inHour, d.inMin, 0);

      const checkOut = new Date(d.date);
      checkOut.setHours(d.outHour, d.outMin, 0);

      await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: emp.id,
            date: d.date,
          },
        },
        update: {
          checkInAt: checkIn,
          checkOutAt: checkOut,
          status: d.status,
        },
        create: {
          employeeId: emp.id,
          date: d.date,
          checkInAt: checkIn,
          checkOutAt: checkOut,
          status: d.status,
          source: "WEB",
        },
      });
    }
  }

  // 11. Seed Sample Leave Request (1 PENDING for testing approval flow)
  console.log("📝 Seeding permohonan cuti contoh...");
  const anita = allEmployees.find((e) => e.employeeNo === "PSPK-202501-015");
  const cutiTahunan = allLeaveTypes.find((lt) => lt.name === "Cuti Tahunan");

  if (anita && cutiTahunan) {
    const existingPending = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: anita.id,
        status: "PENDING",
      },
    });

    if (!existingPending) {
      await prisma.leaveRequest.create({
        data: {
          employeeId: anita.id,
          leaveTypeId: cutiTahunan.id,
          startDate: new Date("2026-09-24"),
          endDate: new Date("2026-09-25"),
          days: 2,
          reason: "Urusan keluarga dan pendampingan riset lapang mandiri di Jawa Barat",
          status: "PENDING",
        },
      });
    }
  }

  // 12. Seed Master Komponen Gaji (Salary Components)
  console.log("💰 Seeding master komponen gaji (tunjangan & potongan)...");
  const salaryComponentsData = [
    {
      code: "TUNJ_TRANSPORT",
      name: "Tunjangan Transportasi",
      type: "EARNING" as const,
      calcType: "FIXED" as const,
      defaultValue: 1000000,
      isActive: true,
    },
    {
      code: "TUNJ_KOMUNIKASI",
      name: "Tunjangan Komunikasi & Pulsa",
      type: "EARNING" as const,
      calcType: "FIXED" as const,
      defaultValue: 500000,
      isActive: true,
    },
    {
      code: "TUNJ_JABATAN",
      name: "Tunjangan Jabatan & Formasi Riset",
      type: "EARNING" as const,
      calcType: "FIXED" as const,
      defaultValue: 2500000,
      isActive: true,
    },
    {
      code: "BPJS_KES",
      name: "Iuran BPJS Kesehatan (Pekerja 1%)",
      type: "DEDUCTION" as const,
      calcType: "PERCENT_OF_BASE" as const,
      defaultValue: 1.0,
      isActive: true,
    },
    {
      code: "BPJS_TK_JHT",
      name: "Iuran BPJS Ketenagakerjaan JHT (Pekerja 2%)",
      type: "DEDUCTION" as const,
      calcType: "PERCENT_OF_BASE" as const,
      defaultValue: 2.0,
      isActive: true,
    },
    {
      code: "BPJS_TK_JP",
      name: "Iuran BPJS Ketenagakerjaan Jaminan Pensiun (Pekerja 1%)",
      type: "DEDUCTION" as const,
      calcType: "PERCENT_OF_BASE" as const,
      defaultValue: 1.0,
      isActive: true,
    },
    {
      code: "PPH21_EST",
      name: "Estimasi Pemotongan Pajak PPh 21",
      type: "DEDUCTION" as const,
      calcType: "MANUAL" as const,
      defaultValue: 0,
      isActive: true,
    },
  ];

  for (const comp of salaryComponentsData) {
    await prisma.salaryComponent.upsert({
      where: { code: comp.code },
      update: {
        name: comp.name,
        type: comp.type,
        calcType: comp.calcType,
        defaultValue: comp.defaultValue,
        isActive: comp.isActive,
      },
      create: {
        code: comp.code,
        name: comp.name,
        type: comp.type,
        calcType: comp.calcType,
        defaultValue: comp.defaultValue,
        isActive: comp.isActive,
      },
    });
  }

  // 13. Seed Periode Payroll Contoh (Bulan Berjalan: September 2026)
  console.log("📅 Seeding periode payroll contoh (September 2026)...");
  await prisma.payrollPeriod.upsert({
    where: {
      year_month_kind: {
        year: 2026,
        month: 9,
        kind: "REGULAR",
      },
    },
    update: {},
    create: {
      year: 2026,
      month: 9,
      kind: "REGULAR",
      status: "DRAFT",
      cutoffDate: new Date("2026-09-25"),
    },
  });

  console.log("✅ Seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

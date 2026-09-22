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

  // 3. Seed Super Admin User
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@pspk.example";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "AdminPSPK2026!#";

  console.log(`👤 Seeding super admin: ${adminEmail}...`);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Super Administrator PSPK",
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: adminEmail,
      name: "Super Administrator PSPK",
      isActive: true,
      emailVerified: true,
    },
  });

  // Create or update password credential account
  const hashedPassword = await hashPassword(adminPassword);
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: adminUser.id,
      providerId: "credential",
    },
  });

  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: adminUser.id,
        accountId: adminUser.id,
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

  // Assign super_admin role
  const superAdminRole = await prisma.role.findUnique({ where: { key: "super_admin" } });
  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    });
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

  // Employee 1: Director / Manager
  let emp1 = await prisma.employee.findUnique({ where: { employeeNo: "PSPK-202401-001" } });
  if (!emp1) {
    emp1 = await prisma.employee.create({
      data: {
        employeeNo: "PSPK-202401-001",
        fullName: "Dr. Budi Rahardjo, M.Ed.",
        nickname: "Budi",
        workEmail: "budi.rahardjo@pspk.example",
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
            notes: "Kontrak Pegawai Tetap Peneliti Utama",
          },
        },
      },
    });
  }

  // Employee 2: Researcher with PKWT Contract EXPIRING SOON (within 23 days from 2026-09-22)
  let emp2 = await prisma.employee.findUnique({ where: { employeeNo: "PSPK-202510-015" } });
  if (!emp2) {
    emp2 = await prisma.employee.create({
      data: {
        employeeNo: "PSPK-202510-015",
        fullName: "Siti Aminah, S.Sos., M.Si.",
        nickname: "Siti",
        workEmail: "siti.aminah@pspk.example",
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
            notes: "PKWT Riset Kebijakan Asesmen Daerah - Perlu Peninjauan Perpanjangan",
          },
        },
      },
    });
  }

  // Employee 3: Active Junior Researcher
  let emp3 = await prisma.employee.findUnique({ where: { employeeNo: "PSPK-202503-008" } });
  if (!emp3) {
    emp3 = await prisma.employee.create({
      data: {
        employeeNo: "PSPK-202503-008",
        fullName: "I Made Wirawan, M.Pd.",
        nickname: "Made",
        workEmail: "made.wirawan@pspk.example",
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
  }

  // Employee 4: Probation Staff
  let emp4 = await prisma.employee.findUnique({ where: { employeeNo: "PSPK-202607-021" } });
  if (!emp4) {
    emp4 = await prisma.employee.create({
      data: {
        employeeNo: "PSPK-202607-021",
        fullName: "Anisa Larasati, S.E.",
        nickname: "Anisa",
        workEmail: "anisa.larasati@pspk.example",
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
  }

  // Employee 5: HR Admin Officer
  let emp5 = await prisma.employee.findUnique({ where: { employeeNo: "PSPK-202405-004" } });
  if (!emp5) {
    emp5 = await prisma.employee.create({
      data: {
        employeeNo: "PSPK-202405-004",
        fullName: "Dewi Permata, S.Psi.",
        nickname: "Dewi",
        workEmail: "dewi.permata@pspk.example",
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
  }

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

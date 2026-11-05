import {
  PrismaClient,
  AssetCategory,
  AssetStatus,
  DocumentVisibility,
  DocumentStatus,
  AttendanceStatus,
  AttendanceSource,
  LeaveStatus,
  PayrollKind,
  PayrollStatus,
  SalaryComponentType,
  SalaryCalcType,
  WageType,
  EmploymentType,
  ContractStatus,
  ReviewStatus,
  TimesheetStatus,
  ReviewerStatus,
  CalendarEventType,
  CalendarEventSource,
  BroadcastScope,
  BroadcastStatus,
  BroadcastDeliveryStatus,
  CredentialCategory,
  TwoFactorType,
} from "@prisma/client";
import { encryptField } from "@pspk/shared";
import { hashPassword } from "better-auth/crypto";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

function createSamplePdfBuffer(title: string): Buffer {
  return Buffer.from(
    `%PDF-1.4\n1 0 obj\n<< /Title (${title}) /Creator (PSPK Platform Seed) /CreationDate (D:20261105000000Z) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000090 00000 n \n0000000135 00000 n \n0000000186 00000 n \ntrailer\n<< /Size 5 /Root 2 0 R >>\nstartxref\n255\n%%EOF\n`,
  );
}

async function writeStorageFile(relKey: string, title: string) {
  const uploadsDir = path.resolve(process.cwd(), "../../.data/uploads");
  const fullPath = path.join(uploadsDir, relKey);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  const buf = createSamplePdfBuffer(title);
  await fs.writeFile(fullPath, buf);

  const metaPath = `${fullPath}.meta.json`;
  await fs.writeFile(
    metaPath,
    JSON.stringify({
      contentType: "application/pdf",
      size: buf.length,
      updatedAt: new Date().toISOString(),
    }),
  );

  const hash = crypto.createHash("sha256").update(buf).digest("hex");
  return { size: buf.length, sha256: hash };
}

export async function seedDummyData(prisma: PrismaClient) {
  console.log("🚀 Memulai penyiapan data dummy komprehensif HRIS & System Management (~250+ data entitas)...");

  const defaultPasswordHash = await hashPassword("PspkPlatform2026!");
  const staffRole = await prisma.role.findUnique({ where: { key: "staff" } });
  const managerRole = await prisma.role.findUnique({ where: { key: "manager" } });
  const superAdminUser = await prisma.user.findFirst({ where: { email: "superadmin@pspk.id" } });
  const superAdminId = superAdminUser?.id || "system";

  // Ambil referensi departemen yang ada
  const katalisDept = await prisma.department.findFirst({ where: { name: { contains: "KATALIS" } } });
  const ldbDept = await prisma.department.findFirst({ where: { name: { contains: "LDB" } } });
  const lskpDept = await prisma.department.findFirst({ where: { name: { contains: "LSKP" } } });
  const pemantikDept = await prisma.department.findFirst({ where: { name: { contains: "PEMANTIK" } } });
  const lintasDept = await prisma.department.findFirst({ where: { name: { contains: "lintas" } } });
  const direksiDept = await prisma.department.findFirst({ where: { name: { contains: "Direksi" } } });

  // Ambil posisi yang ada
  const lskpPenelitiPos = await prisma.position.findFirst({ where: { departmentId: lskpDept?.id, title: "Peneliti" } });
  const lskpStafPos = await prisma.position.findFirst({ where: { departmentId: lskpDept?.id, title: "Staf" } });
  const ldbPenelitiPos = await prisma.position.findFirst({ where: { departmentId: ldbDept?.id, title: "Peneliti" } });
  const ldbStafPos = await prisma.position.findFirst({ where: { departmentId: ldbDept?.id, title: "Staf" } });
  const pemantikPenelitiPos = await prisma.position.findFirst({ where: { departmentId: pemantikDept?.id, title: "Peneliti" } });
  const pemantikStafPos = await prisma.position.findFirst({ where: { departmentId: pemantikDept?.id, title: "Staf" } });
  const katalisLeadPos = await prisma.position.findFirst({ where: { departmentId: katalisDept?.id, title: "Lead" } });
  const katalisPenelitiPos = await prisma.position.findFirst({ where: { departmentId: katalisDept?.id, title: "Peneliti" } });

  const pmoPos = await prisma.position.findFirst({ where: { departmentId: lintasDept?.id, title: { contains: "Operasi" } } });
  const hrPos = await prisma.position.findFirst({ where: { departmentId: lintasDept?.id, title: { contains: "Human Resources" } } });
  const keuanganPos = await prisma.position.findFirst({ where: { departmentId: lintasDept?.id, title: { contains: "Keuangan" } } });
  const komunikasiPos = await prisma.position.findFirst({ where: { departmentId: lintasDept?.id, title: { contains: "Komunikasi" } } });

  // Existing key staff
  const jodyEmp = await prisma.employee.findFirst({ where: { workEmail: "jody@pspk.id" } });
  const vindaEmp = await prisma.employee.findFirst({ where: { workEmail: "hr@pspk.id" } });
  const budiEmp = await prisma.employee.findFirst({ where: { workEmail: "it.admin@pspk.id" } });
  const arisEmp = await prisma.employee.findFirst({ where: { workEmail: "aris@pspk.id" } });

  // ---------------------------------------------------------------------------
  // 1. DATA PENGGUNA & PEGAWAI TAMBAHAN (14 Pegawai Baru Lintas Divisi)
  // ---------------------------------------------------------------------------
  console.log("👥 [1/16] Menyiapkan data 14 pegawai & akun pengguna baru lintas divisi...");

  const newEmployeesData = [
    {
      employeeNo: "PSPK-202611-013",
      email: "rian.hidayat@pspk.id",
      name: "Rian Hidayat, M.Ed.",
      nickname: "Rian",
      personalEmail: "rian.hidayat.edu@gmail.com",
      phone: "081234567813",
      birthDate: new Date("1990-05-14"),
      birthPlace: "Bandung",
      gender: "MALE" as const,
      maritalStatus: "MARRIED" as const,
      address: "Jl. Dago Asri No. 45, Bandung, Jawa Barat",
      deptId: lskpDept?.id,
      posId: lskpPenelitiPos?.id,
      managerId: jodyEmp?.id,
      employmentType: "PERMANENT" as const,
      wageType: "MONTHLY" as const,
      baseSalary: 11500000,
      hourlyRate: null,
      joinDate: new Date("2024-03-01"),
      bankName: "Bank Central Asia (BCA)",
      bankAccount: "4520987113",
      nik: "3273041405900003",
      npwp: "812345678901000",
      role: staffRole,
    },
    {
      employeeNo: "PSPK-202611-014",
      email: "siti.nurhaliza@pspk.id",
      name: "Siti Nurhaliza, S.Sos.",
      nickname: "Siti",
      personalEmail: "siti.comm.pspk@gmail.com",
      phone: "081234567814",
      birthDate: new Date("1994-08-22"),
      birthPlace: "Yogyakarta",
      gender: "FEMALE" as const,
      maritalStatus: "SINGLE" as const,
      address: "Jl. Kaliurang KM 7, Sleman, DI Yogyakarta",
      deptId: lintasDept?.id,
      posId: komunikasiPos?.id,
      managerId: jodyEmp?.id,
      employmentType: "PERMANENT" as const,
      wageType: "MONTHLY" as const,
      baseSalary: 9000000,
      hourlyRate: null,
      joinDate: new Date("2024-06-15"),
      bankName: "Bank Mandiri",
      bankAccount: "1370012345614",
      nik: "3404076208940004",
      npwp: "823456789012000",
      role: staffRole,
    },
    {
      employeeNo: "PSPK-202611-015",
      email: "ahmad.fauzi@pspk.id",
      name: "Ahmad Fauzi, S.Kom.",
      nickname: "Fauzi",
      personalEmail: "ahmad.fauzi.tech@gmail.com",
      phone: "081234567815",
      birthDate: new Date("1992-11-03"),
      birthPlace: "Jakarta",
      gender: "MALE" as const,
      maritalStatus: "MARRIED" as const,
      address: "Jl. Tebet Timur Dalam No. 8, Jakarta Selatan",
      deptId: lintasDept?.id,
      posId: pmoPos?.id,
      managerId: jodyEmp?.id,
      employmentType: "PERMANENT" as const,
      wageType: "MONTHLY" as const,
      baseSalary: 10500000,
      hourlyRate: null,
      joinDate: new Date("2023-10-01"),
      bankName: "Bank Negara Indonesia (BNI)",
      bankAccount: "0987654315",
      nik: "3174020311920005",
      npwp: "834567890123000",
      role: staffRole,
    },
    {
      employeeNo: "PSPK-202611-016",
      email: "anisa.rahmawati@pspk.id",
      name: "Anisa Rahmawati, S.E.",
      nickname: "Anisa",
      personalEmail: "anisa.rahma.acc@gmail.com",
      phone: "081234567816",
      birthDate: new Date("1993-02-18"),
      birthPlace: "Surabaya",
      gender: "FEMALE" as const,
      maritalStatus: "MARRIED" as const,
      address: "Jl. Margonda Raya No. 112, Depok, Jawa Barat",
      deptId: lintasDept?.id,
      posId: keuanganPos?.id,
      managerId: vindaEmp?.id,
      employmentType: "PERMANENT" as const,
      wageType: "MONTHLY" as const,
      baseSalary: 9500000,
      hourlyRate: null,
      joinDate: new Date("2024-01-10"),
      bankName: "Bank Central Asia (BCA)",
      bankAccount: "5420987116",
      nik: "3276015802930006",
      npwp: "845678901234000",
      role: staffRole,
    },
    {
      employeeNo: "PSPK-202611-017",
      email: "bayu.wicaksono@pspk.id",
      name: "Bayu Wicaksono, M.Pd.",
      nickname: "Bayu",
      personalEmail: "bayu.wicak.riset@gmail.com",
      phone: "081234567817",
      birthDate: new Date("1991-09-09"),
      birthPlace: "Semarang",
      gender: "MALE" as const,
      maritalStatus: "SINGLE" as const,
      address: "Jl. Cempaka Putih Tengah No. 20, Jakarta Pusat",
      deptId: katalisDept?.id,
      posId: katalisPenelitiPos?.id,
      managerId: jodyEmp?.id,
      employmentType: "FIXED_TERM" as const,
      wageType: "MONTHLY" as const,
      baseSalary: 8500000,
      hourlyRate: null,
      joinDate: new Date("2025-02-01"),
      bankName: "Bank Syariah Indonesia (BSI)",
      bankAccount: "7123456717",
      nik: "3171030909910007",
      npwp: "856789012345000",
      role: staffRole,
    },
    {
      employeeNo: "PSPK-202611-018",
      email: "clara.devina@pspk.id",
      name: "Clara Devina, S.Psi.",
      nickname: "Clara",
      personalEmail: "clara.devina.hr@gmail.com",
      phone: "081234567818",
      birthDate: new Date("1996-04-30"),
      birthPlace: "Bogor",
      gender: "FEMALE" as const,
      maritalStatus: "SINGLE" as const,
      address: "Jl. Pajajaran No. 88, Bogor, Jawa Barat",
      deptId: lintasDept?.id,
      posId: hrPos?.id,
      managerId: vindaEmp?.id,
      employmentType: "PERMANENT" as const,
      wageType: "MONTHLY" as const,
      baseSalary: 8000000,
      hourlyRate: null,
      joinDate: new Date("2025-05-01"),
      bankName: "Bank Central Asia (BCA)",
      bankAccount: "5420987118",
      nik: "3271027004960008",
      npwp: "867890123456000",
      role: staffRole,
    },
    {
      employeeNo: "PSPK-202611-019",
      email: "dedi.pratama@pspk.id",
      name: "Dedi Pratama, S.Stat.",
      nickname: "Dedi",
      personalEmail: "dedi.data.analyst@gmail.com",
      phone: "081234567819",
      birthDate: new Date("1993-12-11"),
      birthPlace: "Malang",
      gender: "MALE" as const,
      maritalStatus: "MARRIED" as const,
      address: "Jl. Kebagusan Raya No. 34, Jakarta Selatan",
      deptId: ldbDept?.id,
      posId: ldbPenelitiPos?.id,
      managerId: jodyEmp?.id,
      employmentType: "PERMANENT" as const,
      wageType: "MONTHLY" as const,
      baseSalary: 9200000,
      hourlyRate: null,
      joinDate: new Date("2024-08-01"),
      bankName: "Bank Mandiri",
      bankAccount: "1370012345619",
      nik: "3174091112930009",
      npwp: "878901234567000",
      role: staffRole,
    },
    {
      employeeNo: "PSPK-202611-020",
      email: "eko.santoso@pspk.id",
      name: "Eko Santoso, S.Pd.",
      nickname: "Eko",
      personalEmail: "eko.ldb.field@gmail.com",
      phone: "081234567820",
      birthDate: new Date("1995-07-07"),
      birthPlace: "Surakarta",
      gender: "MALE" as const,
      maritalStatus: "SINGLE" as const,
      address: "Jl. Percetakan Negara No. 15, Jakarta Pusat",
      deptId: ldbDept?.id,
      posId: ldbStafPos?.id,
      managerId: jodyEmp?.id,
      employmentType: "FIXED_TERM" as const,
      wageType: "MONTHLY" as const,
      baseSalary: 6800000,
      hourlyRate: null,
      joinDate: new Date("2025-03-15"),
      bankName: "Bank Rakyat Indonesia (BRI)",
      bankAccount: "034101000120",
      nik: "3171050707950010",
      npwp: "889012345678000",
      role: staffRole,
    },
    {
      employeeNo: "PSPK-202611-021",
      email: "fitri.handayani@pspk.id",
      name: "Fitri Handayani, S.I.Kom.",
      nickname: "Fitri",
      personalEmail: "fitri.media.cre@gmail.com",
      phone: "081234567821",
      birthDate: new Date("1997-03-19"),
      birthPlace: "Medan",
      gender: "FEMALE" as const,
      maritalStatus: "SINGLE" as const,
      address: "Jl. Gandaria Tengah III No. 5, Jakarta Selatan",
      deptId: lintasDept?.id,
      posId: komunikasiPos?.id,
      managerId: jodyEmp?.id,
      employmentType: "PERMANENT" as const,
      wageType: "MONTHLY" as const,
      baseSalary: 7500000,
      hourlyRate: null,
      joinDate: new Date("2025-06-01"),
      bankName: "Bank Central Asia (BCA)",
      bankAccount: "5420987121",
      nik: "3174065903970011",
      npwp: "890123456789000",
      role: staffRole,
    },
    {
      employeeNo: "PSPK-202611-022",
      email: "gilang.ramadhan@pspk.id",
      name: "Gilang Ramadhan, S.Sn.",
      nickname: "Gilang",
      personalEmail: "gilang.design.freelance@gmail.com",
      phone: "081234567822",
      birthDate: new Date("1998-10-10"),
      birthPlace: "Tangerang",
      gender: "MALE" as const,
      maritalStatus: "SINGLE" as const,
      address: "Jl. Bintaro Utama Sektor 3A, Tangerang Selatan",
      deptId: pemantikDept?.id,
      posId: pemantikStafPos?.id,
      managerId: arisEmp?.id,
      employmentType: "FIXED_TERM" as const,
      wageType: "HOURLY" as const,
      baseSalary: 0,
      hourlyRate: 45000,
      joinDate: new Date("2026-07-01"),
      bankName: "Bank Mandiri",
      bankAccount: "1370012345622",
      nik: "3674031010980012",
      npwp: "901234567890000",
      role: staffRole,
    },
    {
      employeeNo: "PSPK-202611-023",
      email: "hesti.wulandari@pspk.id",
      name: "Hesti Wulandari, S.Si.",
      nickname: "Hesti",
      personalEmail: "hesti.stat.kurikulum@gmail.com",
      phone: "081234567823",
      birthDate: new Date("1994-01-25"),
      birthPlace: "Semarang",
      gender: "FEMALE" as const,
      maritalStatus: "SINGLE" as const,
      address: "Jl. Fatmawati Raya No. 40, Jakarta Selatan",
      deptId: pemantikDept?.id,
      posId: pemantikPenelitiPos?.id,
      managerId: arisEmp?.id,
      employmentType: "PERMANENT" as const,
      wageType: "MONTHLY" as const,
      baseSalary: 8800000,
      hourlyRate: null,
      joinDate: new Date("2024-11-01"),
      bankName: "Bank Central Asia (BCA)",
      bankAccount: "5420987123",
      nik: "3174076501940013",
      npwp: "912345678901000",
      role: staffRole,
    },
    {
      employeeNo: "PSPK-202611-024",
      email: "indra.lesmana@pspk.id",
      name: "Indra Lesmana, M.Sc.",
      nickname: "Indra",
      personalEmail: "indra.lesmana.lead@gmail.com",
      phone: "081234567824",
      birthDate: new Date("1988-06-16"),
      birthPlace: "Surabaya",
      gender: "MALE" as const,
      maritalStatus: "MARRIED" as const,
      address: "Jl. Kemang Timur No. 18, Jakarta Selatan",
      deptId: katalisDept?.id,
      posId: katalisLeadPos?.id,
      managerId: jodyEmp?.id,
      employmentType: "PERMANENT" as const,
      wageType: "MONTHLY" as const,
      baseSalary: 16000000,
      hourlyRate: null,
      joinDate: new Date("2022-04-01"),
      bankName: "Bank Mandiri",
      bankAccount: "1370012345624",
      nik: "3174081606880014",
      npwp: "923456789012000",
      role: managerRole || staffRole,
    },
    {
      employeeNo: "PSPK-202611-025",
      email: "maya.saputri@pspk.id",
      name: "Maya Saputri, S.Kom.",
      nickname: "Maya",
      personalEmail: "maya.saputri.ops@gmail.com",
      phone: "081234567825",
      birthDate: new Date("1996-11-12"),
      birthPlace: "Bandung",
      gender: "FEMALE" as const,
      maritalStatus: "SINGLE" as const,
      address: "Jl. Kalibata Tengah No. 22, Jakarta Selatan",
      deptId: lintasDept?.id,
      posId: pmoPos?.id,
      managerId: jodyEmp?.id,
      employmentType: "FIXED_TERM" as const,
      wageType: "MONTHLY" as const,
      baseSalary: 7200000,
      hourlyRate: null,
      joinDate: new Date("2025-07-01"),
      bankName: "Bank Central Asia (BCA)",
      bankAccount: "5420987125",
      nik: "3174055211960015",
      npwp: "934567890123000",
      role: staffRole,
    },
    {
      employeeNo: "PSPK-202611-026",
      email: "yoga.pratama@pspk.id",
      name: "Yoga Pratama, M.Si.",
      nickname: "Yoga",
      personalEmail: "yoga.pratama.survey@gmail.com",
      phone: "081234567826",
      birthDate: new Date("1995-02-05"),
      birthPlace: "Yogyakarta",
      gender: "MALE" as const,
      maritalStatus: "SINGLE" as const,
      address: "Jl. Senopati No. 41, Jakarta Selatan",
      deptId: lskpDept?.id,
      posId: lskpPenelitiPos?.id,
      managerId: jodyEmp?.id,
      employmentType: "FIXED_TERM" as const,
      wageType: "HOURLY" as const,
      baseSalary: 0,
      hourlyRate: 50000,
      joinDate: new Date("2026-08-01"),
      bankName: "Bank Negara Indonesia (BNI)",
      bankAccount: "0987654326",
      nik: "3174010502950016",
      npwp: "945678901234000",
      role: staffRole,
    },
  ];

  const seededEmployees: Array<any> = [];

  for (const empData of newEmployeesData) {
    const user = await prisma.user.upsert({
      where: { email: empData.email },
      update: { name: empData.name, isActive: true, emailVerified: true },
      create: {
        email: empData.email,
        name: empData.name,
        isActive: true,
        emailVerified: true,
      },
    });

    const existingAcc = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (!existingAcc) {
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: defaultPasswordHash,
        },
      });
    }

    if (empData.role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: empData.role.id } },
        update: {},
        create: { userId: user.id, roleId: empData.role.id },
      });
    }

    const employee = await prisma.employee.upsert({
      where: { employeeNo: empData.employeeNo },
      update: {
        userId: user.id,
        fullName: empData.name,
        nickname: empData.nickname,
        workEmail: empData.email,
        personalEmail: empData.personalEmail,
        phone: empData.phone,
        birthDate: empData.birthDate,
        birthPlace: empData.birthPlace,
        gender: empData.gender,
        maritalStatus: empData.maritalStatus,
        address: empData.address,
        currentDepartmentId: empData.deptId,
        currentPositionId: empData.posId,
        managerId: empData.managerId,
        status: "ACTIVE",
        bankName: empData.bankName,
        bankAccountName: empData.name,
        bankAccountEnc: encryptField(empData.bankAccount),
        nikEnc: encryptField(empData.nik),
        npwpEnc: encryptField(empData.npwp),
      },
      create: {
        employeeNo: empData.employeeNo,
        userId: user.id,
        fullName: empData.name,
        nickname: empData.nickname,
        workEmail: empData.email,
        personalEmail: empData.personalEmail,
        phone: empData.phone,
        birthDate: empData.birthDate,
        birthPlace: empData.birthPlace,
        gender: empData.gender,
        maritalStatus: empData.maritalStatus,
        address: empData.address,
        joinDate: empData.joinDate,
        currentDepartmentId: empData.deptId,
        currentPositionId: empData.posId,
        managerId: empData.managerId,
        status: "ACTIVE",
        bankName: empData.bankName,
        bankAccountName: empData.name,
        bankAccountEnc: encryptField(empData.bankAccount),
        nikEnc: encryptField(empData.nik),
        npwpEnc: encryptField(empData.npwp),
      },
    });

    seededEmployees.push(employee);

    // Kontrak Kerja
    const existingContract = await prisma.employmentContract.findFirst({
      where: { employeeId: employee.id, status: "ACTIVE" },
    });
    if (!existingContract) {
      await prisma.employmentContract.create({
        data: {
          employeeId: employee.id,
          type: empData.employmentType,
          wageType: empData.wageType,
          baseSalary: empData.baseSalary,
          hourlyRate: empData.hourlyRate,
          startDate: empData.joinDate,
          endDate: empData.employmentType === "PERMANENT" ? null : new Date("2027-12-31"),
          status: "ACTIVE",
          notes: `Kontrak kerja ${empData.employmentType} ${empData.name}`,
        },
      });
    }

    // Riwayat Jabatan
    if (empData.posId && empData.deptId) {
      const existingHistory = await prisma.employmentHistory.findFirst({
        where: { employeeId: employee.id, positionId: empData.posId },
      });
      if (!existingHistory) {
        await prisma.employmentHistory.create({
          data: {
            employeeId: employee.id,
            positionId: empData.posId,
            departmentId: empData.deptId,
            startDate: empData.joinDate,
            notes: `Pengangkatan posisi ${empData.name} sesuai SK Direksi`,
          },
        });
      }
    }
  }

  // Gabungkan semua pegawai yang ada di DB untuk relasi berikutnya
  const allEmployees = await prisma.employee.findMany();
  console.log(`   ✓ Total pegawai di sistem sekarang: ${allEmployees.length} orang.`);

  // ---------------------------------------------------------------------------
  // 2. SALDO & KUOTA CUTI 2026 UNTUK SELURUH PEGAWAI
  // ---------------------------------------------------------------------------
  console.log("🏖️ [2/16] Menyiapkan kuota dan saldo cuti tahun 2026...");
  const leaveTypes = await prisma.leaveType.findMany();
  for (const emp of allEmployees) {
    for (const lt of leaveTypes) {
      // Lewati cuti melahirkan jika laki-laki
      if (lt.name.toLowerCase().includes("melahirkan") && emp.gender === "MALE") continue;

      const existingBalance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: emp.id,
            leaveTypeId: lt.id,
            year: 2026,
          },
        },
      });

      if (!existingBalance) {
        await prisma.leaveBalance.create({
          data: {
            employeeId: emp.id,
            leaveTypeId: lt.id,
            year: 2026,
            quotaDays: lt.defaultQuotaDays,
            usedDays: 0,
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. PERMOHONAN CUTI BERAGAM STATUS (25 Permohonan Cuti Baru)
  // ---------------------------------------------------------------------------
  console.log("📝 [3/16] Menyiapkan 25 permohonan cuti (Pending, Approved, Rejected, Cancelled)...");
  const annualLeave = leaveTypes.find((lt) => lt.name.includes("Tahunan"));
  const sickLeave = leaveTypes.find((lt) => lt.name.includes("Sakit"));
  const urgentLeave = leaveTypes.find((lt) => lt.name.includes("Penting"));

  const leaveRequestsBatch = [
    // Status PENDING (untuk menguji antrean approval manajer)
    { emp: seededEmployees[0], lt: annualLeave, start: "2026-11-16", end: "2026-11-18", days: 3, reason: "Urusan keluarga di Bandung dan perpanjangan dokumen kependudukan", status: "PENDING" as const },
    { emp: seededEmployees[1], lt: annualLeave, start: "2026-11-20", end: "2026-11-20", days: 1, reason: "Menghadiri wisuda adik kandung di Yogyakarta", status: "PENDING" as const },
    { emp: seededEmployees[2], lt: urgentLeave, start: "2026-11-10", end: "2026-11-11", days: 2, reason: "Renovasi atap rumah darurat pasca hujan lebat", status: "PENDING" as const },
    { emp: seededEmployees[3], lt: annualLeave, start: "2026-11-23", end: "2026-11-25", days: 3, reason: "Cuti tahunan mendampingi orang tua berobat", status: "PENDING" as const },
    { emp: seededEmployees[4], lt: sickLeave, start: "2026-11-06", end: "2026-11-06", days: 1, reason: "Pemeriksaan mata berkala dan terapi fisik", status: "PENDING" as const },
    { emp: seededEmployees[6], lt: annualLeave, start: "2026-12-01", end: "2026-12-04", days: 4, reason: "Cuti tahunan akhir tahun bersama keluarga", status: "PENDING" as const },
    { emp: seededEmployees[8], lt: urgentLeave, start: "2026-11-12", end: "2026-11-13", days: 2, reason: "Menghadiri pernikahan kerabat dekat", status: "PENDING" as const },

    // Status APPROVED (sudah disetujui, masuk ke kalender kerja)
    { emp: seededEmployees[0], lt: sickLeave, start: "2026-09-14", end: "2026-09-15", days: 2, reason: "Radang tenggorokan akut disertai demam (surat dokter terlampir)", status: "APPROVED" as const, approver: jodyEmp },
    { emp: seededEmployees[1], lt: annualLeave, start: "2026-08-10", end: "2026-08-12", days: 3, reason: "Cuti tahunan rekreasi keluarga ke Jawa Timur", status: "APPROVED" as const, approver: jodyEmp },
    { emp: seededEmployees[2], lt: annualLeave, start: "2026-07-20", end: "2026-07-22", days: 3, reason: "Acara keluarga di kampung halaman", status: "APPROVED" as const, approver: jodyEmp },
    { emp: seededEmployees[3], lt: sickLeave, start: "2026-08-25", end: "2026-08-26", days: 2, reason: "Demam berdarah tahap pemulihan", status: "APPROVED" as const, approver: vindaEmp },
    { emp: seededEmployees[4], lt: annualLeave, start: "2026-09-01", end: "2026-09-02", days: 2, reason: "Keperluan keluarga di Semarang", status: "APPROVED" as const, approver: jodyEmp },
    { emp: seededEmployees[5], lt: annualLeave, start: "2026-08-18", end: "2026-08-19", days: 2, reason: "Urusan pribadi mendesak di Bogor", status: "APPROVED" as const, approver: vindaEmp },
    { emp: seededEmployees[6], lt: sickLeave, start: "2026-10-05", end: "2026-10-06", days: 2, reason: "Flu berat dan istirahat dokter", status: "APPROVED" as const, approver: jodyEmp },
    { emp: seededEmployees[7], lt: urgentLeave, start: "2026-09-18", end: "2026-09-18", days: 1, reason: "Duka cita pemakaman kerabat di Solo", status: "APPROVED" as const, approver: jodyEmp },
    { emp: seededEmployees[10], lt: annualLeave, start: "2026-09-28", end: "2026-09-30", days: 3, reason: "Cuti tahunan setelah menyelesaikan laporan analisis", status: "APPROVED" as const, approver: arisEmp },
    { emp: seededEmployees[11], lt: annualLeave, start: "2026-08-03", end: "2026-08-05", days: 3, reason: "Istirahat pasca penutupan riset kemitraan daerah", status: "APPROVED" as const, approver: jodyEmp },

    // Status REJECTED (ditolak dengan alasan resmi)
    { emp: seededEmployees[0], lt: annualLeave, start: "2026-10-12", end: "2026-10-15", days: 4, reason: "Cuti liburan ke Bali", status: "REJECTED" as const, approver: jodyEmp, rejectionReason: "Bentrok dengan agenda peluncuran Policy Brief Nasional LSKP" },
    { emp: seededEmployees[2], lt: annualLeave, start: "2026-09-21", end: "2026-09-25", days: 5, reason: "Cuti luar kota", status: "REJECTED" as const, approver: jodyEmp, rejectionReason: "Sprint migrasi infrastruktur database PSPK sedang berlangsung" },
    { emp: seededEmployees[3], lt: annualLeave, start: "2026-09-28", end: "2026-09-30", days: 3, reason: "Liburan singkat", status: "REJECTED" as const, approver: vindaEmp, rejectionReason: "Periode penutupan pembukuan laporan keuangan Q3 lembaga" },
    { emp: seededEmployees[7], lt: annualLeave, start: "2026-10-20", end: "2026-10-22", days: 3, reason: "Cuti santai", status: "REJECTED" as const, approver: jodyEmp, rejectionReason: "Tim fasilitator daerah sedang melakukan survei tatap muka di lokasi" },

    // Status CANCELLED (dibatalkan pemohon)
    { emp: seededEmployees[1], lt: annualLeave, start: "2026-10-01", end: "2026-10-02", days: 2, reason: "Rencana mudik yang direschedule", status: "CANCELLED" as const },
    { emp: seededEmployees[4], lt: annualLeave, start: "2026-10-19", end: "2026-10-20", days: 2, reason: "Perubahan jadwal kegiatan riset KATALIS", status: "CANCELLED" as const },
    { emp: seededEmployees[8], lt: annualLeave, start: "2026-09-08", end: "2026-09-09", days: 2, reason: "Penugasan dokumentasi dadakan", status: "CANCELLED" as const },
    { emp: seededEmployees[10], lt: urgentLeave, start: "2026-10-27", end: "2026-10-27", days: 1, reason: "Urusan perbankan yang selesai lebih cepat", status: "CANCELLED" as const },
  ];

  for (const lr of leaveRequestsBatch) {
    if (!lr.emp || !lr.lt) continue;
    const startDateObj = new Date(`${lr.start}T00:00:00.000Z`);
    const endDateObj = new Date(`${lr.end}T23:59:59.000Z`);

    const existingReq = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: lr.emp.id,
        leaveTypeId: lr.lt.id,
        startDate: startDateObj,
      },
    });

    if (!existingReq) {
      await prisma.leaveRequest.create({
        data: {
          employeeId: lr.emp.id,
          leaveTypeId: lr.lt.id,
          startDate: startDateObj,
          endDate: endDateObj,
          days: lr.days,
          reason: lr.reason,
          status: lr.status,
          approverId: lr.status === "APPROVED" || lr.status === "REJECTED" ? lr.approver?.id : null,
          decidedAt: lr.status === "APPROVED" || lr.status === "REJECTED" ? new Date(`${lr.start}T08:00:00.000Z`) : null,
          decisionNote: (lr as any).rejectionReason || null,
        },
      });

      // Update used days jika approved
      if (lr.status === "APPROVED") {
        await prisma.leaveBalance.updateMany({
          where: {
            employeeId: lr.emp.id,
            leaveTypeId: lr.lt.id,
            year: 2026,
          },
          data: {
            usedDays: { increment: lr.days },
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. LOG KEHADIRAN & PRESENSI MASIF (~90 Baris Baru, 35 Hari Kerja Terakhir)
  // ---------------------------------------------------------------------------
  console.log("⏰ [4/16] Menyiapkan rekam kehadiran 35 hari kerja terakhir (Hadir, Telat, WFH, Izin)...");

  // Generate tanggal kerja (Oktober - November 2026)
  const workDates: string[] = [
    "2026-10-01", "2026-10-02", "2026-10-05", "2026-10-06", "2026-10-07",
    "2026-10-08", "2026-10-09", "2026-10-12", "2026-10-13", "2026-10-14",
    "2026-10-15", "2026-10-16", "2026-10-19", "2026-10-20", "2026-10-21",
    "2026-10-22", "2026-10-23", "2026-10-26", "2026-10-27", "2026-10-28",
    "2026-10-29", "2026-10-30", "2026-11-02", "2026-11-03", "2026-11-04",
    "2026-11-05"
  ];

  const sampleStaffForAttendance = seededEmployees.slice(0, 8); // 8 pegawai baru diberi rekam jejak presensi intensif

  for (const dateStr of workDates) {
    const attDate = new Date(`${dateStr}T00:00:00.000Z`);

    for (let i = 0; i < sampleStaffForAttendance.length; i++) {
      const emp = sampleStaffForAttendance[i];
      if (!emp) continue;

      const existingAtt = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: emp.id,
            date: attDate,
          },
        },
      });

      if (!existingAtt) {
        // Variasi status berdasarkan pola hari dan indeks
        let status: AttendanceStatus = "PRESENT";
        let checkInTime = `${dateStr}T08:45:00.000Z`;
        let checkOutTime = `${dateStr}T17:15:00.000Z`;
        let notes: string | null = null;

        const modVal = (dateStr.charCodeAt(9) + i) % 10;
        if (modVal === 0) {
          status = "LATE";
          checkInTime = `${dateStr}T09:25:00.000Z`;
          notes = "Keterlambatan KRL Commuter Line rute Manggarai-Sudirman";
        } else if (modVal === 1) {
          status = "WFH";
          checkInTime = `${dateStr}T08:55:00.000Z`;
          notes = "Persetujuan jadwal kerja jarak jauh (WFH) divisi";
        } else if (modVal === 2 && i % 3 === 0) {
          status = "LEAVE";
          checkInTime = `${dateStr}T00:00:00.000Z`;
          checkOutTime = `${dateStr}T00:00:00.000Z`;
          notes = "Cuti disetujui atasan";
        } else {
          // Normal hadir tepat waktu
          const minRandom = 40 + (i * 2);
          checkInTime = `${dateStr}T08:${minRandom < 10 ? "0" + minRandom : minRandom}:00.000Z`;
        }

        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            date: attDate,
            checkInAt: status === "LEAVE" ? null : new Date(checkInTime),
            checkOutAt: status === "LEAVE" ? null : new Date(checkOutTime),
            status,
            source: "WEB",
            notes,
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. MASTER KOMPONEN GAJI PEGAWAI
  // ---------------------------------------------------------------------------
  console.log("💰 [5/16] Menyiapkan alokasi komponen gaji untuk seluruh pegawai baru...");
  const components = await prisma.salaryComponent.findMany();
  const gapokComp = components.find((c) => c.code === "GAPOK");
  const tjJabatanComp = components.find((c) => c.code === "TJ_JABATAN");
  const tjMakanComp = components.find((c) => c.code === "TJ_MAKAN");
  const tjKomunikasiComp = components.find((c) => c.code === "TJ_KOMUNIKASI");
  const potBpjsKeshComp = components.find((c) => c.code === "POT_BPJS_KESH");
  const potBpjsTkComp = components.find((c) => c.code === "POT_BPJS_TK");
  const potPph21Comp = components.find((c) => c.code === "POT_PPH21");

  for (const emp of seededEmployees) {
    const contract = await prisma.employmentContract.findFirst({
      where: { employeeId: emp.id, status: "ACTIVE" },
    });
    if (!contract || contract.wageType !== "MONTHLY") continue;

    const baseVal = Number(contract.baseSalary) || 8000000;

    const allocations = [
      { comp: gapokComp, val: baseVal },
      { comp: tjMakanComp, val: 660000 },
      { comp: tjKomunikasiComp, val: 350000 },
      { comp: tjJabatanComp, val: baseVal > 10000000 ? 1500000 : 500000 },
      { comp: potBpjsKeshComp, val: Math.round(baseVal * 0.01) },
      { comp: potBpjsTkComp, val: Math.round(baseVal * 0.02) },
      { comp: potPph21Comp, val: Math.round(baseVal * 0.025) },
    ];

    for (const alloc of allocations) {
      if (!alloc.comp) continue;
      const existing = await prisma.employeeSalaryComponent.findFirst({
        where: {
          employeeId: emp.id,
          componentId: alloc.comp.id,
        },
      });

      if (!existing) {
        await prisma.employeeSalaryComponent.create({
          data: {
            employeeId: emp.id,
            componentId: alloc.comp.id,
            amount: alloc.val,
            effectiveFrom: new Date("2026-01-01"),
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 6. PERIODE PENGGAJIAN & PENERBITAN SLIP GAJI (20+ Slip Gaji Lengkap)
  // ---------------------------------------------------------------------------
  console.log("💵 [6/16] Menyiapkan periode penggajian & penerbitan slip gaji Oktober 2026...");

  let octPeriod = await prisma.payrollPeriod.findUnique({
    where: {
      year_month_kind: {
        year: 2026,
        month: 10,
        kind: "REGULAR",
      },
    },
  });

  if (!octPeriod) {
    octPeriod = await prisma.payrollPeriod.create({
      data: {
        year: 2026,
        month: 10,
        kind: "REGULAR",
        status: "PUBLISHED",
      },
    });
  }

  // Buat payslip untuk staf bulanan baru
  for (const emp of seededEmployees) {
    const contract = await prisma.employmentContract.findFirst({
      where: { employeeId: emp.id, status: "ACTIVE" },
    });
    if (!contract || contract.wageType !== "MONTHLY") continue;

    const existingPayslip = await prisma.payslip.findUnique({
      where: {
        periodId_employeeId: {
          periodId: octPeriod.id,
          employeeId: emp.id,
        },
      },
    });

    if (!existingPayslip) {
      const baseSalary = Number(contract.baseSalary) || 8000000;
      const allowances = 660000 + 350000 + (baseSalary > 10000000 ? 1500000 : 500000);
      const gross = baseSalary + allowances;
      const deductions = Math.round(baseSalary * 0.055); // BPJS + PPh21
      const net = gross - deductions;

      const payslip = await prisma.payslip.create({
        data: {
          periodId: octPeriod.id,
          employeeId: emp.id,
          grossAmount: gross,
          totalDeduction: deductions,
          netAmount: net,
          wageType: "MONTHLY",
          status: "PUBLISHED",
          publishedAt: new Date("2026-10-28T10:00:00.000Z"),
        },
      });

      // Payslip Lines
      const lines = [
        { name: "Gaji Pokok", type: "EARNING" as const, amount: baseSalary },
        { name: "Tunjangan Makan", type: "EARNING" as const, amount: 660000 },
        { name: "Tunjangan Komunikasi", type: "EARNING" as const, amount: 350000 },
        { name: "Tunjangan Jabatan", type: "EARNING" as const, amount: baseSalary > 10000000 ? 1500000 : 500000 },
        { name: "Potongan BPJS Kesehatan (1%)", type: "DEDUCTION" as const, amount: Math.round(baseSalary * 0.01) },
        { name: "Potongan BPJS Ketenagakerjaan (2%)", type: "DEDUCTION" as const, amount: Math.round(baseSalary * 0.02) },
        { name: "Potongan PPh 21", type: "DEDUCTION" as const, amount: Math.round(baseSalary * 0.025) },
      ];

      for (const line of lines) {
        await prisma.payslipLine.create({
          data: {
            payslipId: payslip.id,
            label: line.name,
            type: line.type,
            amount: line.amount,
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 7. SASARAN KINERJA & EVALUASI REVIEW (25 Goals, 12 Reviews)
  // ---------------------------------------------------------------------------
  console.log("🎯 [7/16] Menyiapkan sasaran kinerja (KPI) & ulasan evaluasi semester...");

  let perfPeriod = await prisma.performancePeriod.findFirst({
    where: { name: { contains: "Semester II 2026" } },
  });

  if (!perfPeriod) {
    perfPeriod = await prisma.performancePeriod.create({
      data: {
        name: "Evaluasi Kinerja Semester II 2026",
        startDate: new Date("2026-07-01T00:00:00.000Z"),
        endDate: new Date("2026-12-31T23:59:59.000Z"),
        status: "ACTIVE",
      },
    });
  }

  const kpiData = [
    {
      emp: seededEmployees[0], // Rian (Peneliti LSKP)
      goals: [
        { title: "Penyusunan Naskah Kebijakan Alokasi BOS Nasional", weight: 40, target: "1 Dokumen Final", actual: "Draft Bab 4 selesai" },
        { title: "Diseminasi Hasil Riset Bersama Bappenas", weight: 35, target: "2 Sesi Forum Terbuka", actual: "1 Forum terlaksana" },
        { title: "Mentoring Asisten Peneliti & Magang LSKP", weight: 25, target: "10 Jam Bimbingan", actual: "12 Jam bimbingan" },
      ],
      reviewStatus: "FINALIZED" as const,
      selfScore: 88,
      mgrScore: 90,
      finalScore: 89,
      selfComment: "Target penyusunan policy brief berjalan sesuai timeline kemitraan Bappenas.",
      mgrComment: "Kualitas analisis kuantitatif sangat baik, terus pertahankan kolaborasi lintas divisi.",
    },
    {
      emp: seededEmployees[1], // Siti (Komunikasi)
      goals: [
        { title: "Kampanye Publik Kebijakan Pendidikan Inklusif", weight: 50, target: "10 Konten Advokasi", actual: "9 Konten tayang" },
        { title: "Penyusunan Annual Impact Report PSPK 2026", weight: 30, target: "Desain Siap Cetak", actual: "Proses layout 80%" },
        { title: "Koordinasi Media Massa & Siaran Pers", weight: 20, target: "4 Liputan Media Nasional", actual: "5 Liputan tayang" },
      ],
      reviewStatus: "MANAGER_REVIEW" as const,
      selfScore: 92,
      mgrScore: 88,
      finalScore: 90,
      selfComment: "Engagement media sosial lembaga naik 45% selama semester ini.",
      mgrComment: "Dampak visual materi advokasi sangat kuat, koordinasikan narasi dengan tim riset.",
    },
    {
      emp: seededEmployees[2], // Ahmad Fauzi (PMO/IT)
      goals: [
        { title: "Pengembangan Modul Kredensial & PWA HRIS", weight: 45, target: "Rilis Produksi Tanpa Bug", actual: "Fitur live di VPS" },
        { title: "Otomasi Skrip Backup Basis Data Terjadwal", weight: 30, target: "RPO < 24 Jam", actual: "Skrip cron pg_dump aktif" },
        { title: "Audit Keamanan & Rotasi Kata Sandi Sistem", weight: 25, target: "100% Akun Terinspeksi", actual: "Selesai 100%" },
      ],
      reviewStatus: "FINALIZED" as const,
      selfScore: 95,
      mgrScore: 94,
      finalScore: 94.5,
      selfComment: "PWA dan optimasi responsif mobile diselesaikan tepat waktu sesuai target.",
      mgrComment: "Infrastruktur stabil, kepatuhan dokumentasi kode sangat rapi.",
    },
    {
      emp: seededEmployees[3], // Anisa (Keuangan)
      goals: [
        { title: "Laporan Pertanggungjawaban Hibah Riset Q3", weight: 50, target: "WTP Tanpa Temuan", actual: "Selesai diaudit" },
        { title: "Digitalisasi Slip Gaji & Rekonsiliasi Bank", weight: 30, target: "Otomasi 100%", actual: "Slip terintegrasi" },
        { title: "Kepatuhan Pajak PPh 21 & Pelaporan DJP Online", weight: 20, target: "Nihil Denda Keterlambatan", actual: "Tepat waktu" },
      ],
      reviewStatus: "SELF_REVIEW" as const,
      selfScore: 90,
      mgrScore: null,
      finalScore: null,
      selfComment: "Semua laporan kepatuhan pajak nihil komplain dan tepat tenggat waktu.",
      mgrComment: null,
    },
  ];

  for (const item of kpiData) {
    if (!item.emp) continue;

    for (const g of item.goals) {
      const existingGoal = await prisma.performanceGoal.findFirst({
        where: { employeeId: item.emp.id, periodId: perfPeriod.id, title: g.title },
      });
      if (!existingGoal) {
        await prisma.performanceGoal.create({
          data: {
            employeeId: item.emp.id,
            periodId: perfPeriod.id,
            title: g.title,
            weight: g.weight,
            target: g.target,
            actual: g.actual,
          },
        });
      }
    }

    const existingReview = await prisma.performanceReview.findUnique({
      where: {
        employeeId_periodId: {
          employeeId: item.emp.id,
          periodId: perfPeriod.id,
        },
      },
    });

    if (!existingReview) {
      await prisma.performanceReview.create({
        data: {
          employeeId: item.emp.id,
          periodId: perfPeriod.id,
          reviewerId: item.emp.managerId || jodyEmp?.id || item.emp.id,
          selfScore: item.selfScore,
          managerScore: item.mgrScore,
          finalScore: item.finalScore,
          selfComment: item.selfComment,
          managerComment: item.mgrComment,
          status: item.reviewStatus,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 8. PENGAJUAN TIMESHEET STAF FREELANCE / HOURLY (12 Pengajuan Baru)
  // ---------------------------------------------------------------------------
  console.log("⏱️ [8/16] Menyiapkan 12 pengajuan timesheet staf PKWT lepas & reviewer...");

  const hourlyStaff = [
    seededEmployees[9], // Gilang Ramadhan
    seededEmployees[13], // Yoga Pratama
  ].filter(Boolean);

  const timesheetEntries = [
    { emp: hourlyStaff[0], month: 8, year: 2026, hours: 48.5, title: "Desain Infografis Laporan Kebijakan Pemantik (Agustus)", status: "APPROVED" as const },
    { emp: hourlyStaff[0], month: 9, year: 2026, hours: 62.0, title: "Pengembangan Aset UI/UX Dashboard PWA (September)", status: "APPROVED" as const },
    { emp: hourlyStaff[0], month: 10, year: 2026, hours: 55.5, title: "Ilustrasi Modul Tata Kelola Riset (Oktober)", status: "APPROVED" as const },
    { emp: hourlyStaff[0], month: 11, year: 2026, hours: 32.0, title: "Desain Slide Presentasi Diseminasi Riset (November)", status: "PENDING" as const },

    { emp: hourlyStaff[1], month: 8, year: 2026, hours: 70.0, title: "Survei Lapangan LSKP Wilayah Jawa Barat (Agustus)", status: "APPROVED" as const },
    { emp: hourlyStaff[1], month: 9, year: 2026, hours: 80.0, title: "Entri Data Kuantitatif Uji Coba Instrumen (September)", status: "APPROVED" as const },
    { emp: hourlyStaff[1], month: 10, year: 2026, hours: 68.5, title: "Transkripsi Wawancara Mendalam Guru Penggerak (Oktober)", status: "APPROVED" as const },
    { emp: hourlyStaff[1], month: 11, year: 2026, hours: 40.0, title: "Analisis Awal Data Kuesioner Daerah (November)", status: "REVISION_REQUESTED" as const },
  ];

  for (const ts of timesheetEntries) {
    if (!ts.emp) continue;
    const existingTs = await prisma.timesheetSubmission.findFirst({
      where: {
        employeeId: ts.emp.id,
        periodMonth: ts.month,
        periodYear: ts.year,
      },
    });

    if (!existingTs) {
      const nextMonthStr = String(ts.month + 1).padStart(2, "0");
      const submission = await prisma.timesheetSubmission.create({
        data: {
          employeeId: ts.emp.id,
          periodMonth: ts.month,
          periodYear: ts.year,
          title: ts.title,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/sample-pspk-timesheet-${ts.month}-${ts.year}`,
          totalHours: ts.hours,
          status: ts.status,
          approvedAt: ts.status === "APPROVED" ? new Date(`2026-${nextMonthStr}-02T08:00:00.000Z`) : null,
          payrollPeriodId: ts.month === 10 ? octPeriod.id : null,
        },
      });

      // Hubungkan Reviewer (Jody Fathurachman)
      if (jodyEmp) {
        await prisma.timesheetReviewer.create({
          data: {
            submissionId: submission.id,
            reviewerId: jodyEmp.id,
            status: ts.status === "APPROVED" ? "APPROVED" : ts.status === "REVISION_REQUESTED" ? "REJECTED" : "PENDING",
            notes: ts.status === "REVISION_REQUESTED" ? "Mohon cantumkan rincian nomor ID responden wawancara pada tab log harian." : "Jam kerja telah terverifikasi dan sesuai deliverables proyek.",
            reviewedAt: ts.status !== "PENDING" ? new Date(`2026-${nextMonthStr}-02T08:00:00.000Z`) : null,
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 9. TUGAS ONBOARDING PEGAWAI BARU
  // ---------------------------------------------------------------------------
  console.log("🎓 [9/16] Menyiapkan tugas orientasi onboarding pegawai baru...");
  const recentEmp = seededEmployees[0];
  if (recentEmp) {
    const onboardingItems = [
      { title: "Penandatanganan Perjanjian Kerja & Pakta Integritas", done: true },
      { title: "Pemberian Hak Akses Email Google Workspace & Slack", done: true },
      { title: "Serah Terima Laptop Kerja & Inventaris Kantor", done: true },
      { title: "Orientasi Budaya Kerja & Struktur Riset Lembaga", done: true },
      { title: "Briefing Manajemen Kinerja & Penyusunan Sasaran KPI", done: false },
    ];

    for (const ob of onboardingItems) {
      const existing = await prisma.onboardingTask.findFirst({
        where: { employeeId: recentEmp.id, title: ob.title },
      });
      if (!existing) {
        await prisma.onboardingTask.create({
          data: {
            employeeId: recentEmp.id,
            title: ob.title,
            dueDate: new Date("2026-11-20"),
            doneAt: ob.done ? new Date() : null,
            assigneeId: vindaEmp?.id,
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 10. SYSTEM MANAGEMENT: ASET FISIK & RIWAYAT PENUGASAN (25+ Aset)
  // ---------------------------------------------------------------------------
  console.log("🖥️ [10/16] Menyiapkan inventaris aset fisik (IT & Non-IT) & penugasan staf...");

  const physicalAssets = [
    { tag: "PSPK-IT-2026-001", cat: "IT" as const, type: "Laptop", name: "MacBook Pro 14 M3 Pro", brand: "Apple", model: "A2992", sn: "C02G90XXMD6M", price: 34999000, status: "ASSIGNED" as const, loc: "Ruang Kerja Utama Lt. 3", emp: seededEmployees[0] },
    { tag: "PSPK-IT-2026-002", cat: "IT" as const, type: "Laptop", name: "ThinkPad T14s Gen 4", brand: "Lenovo", model: "21F8", sn: "PF4Y902A", price: 21500000, status: "ASSIGNED" as const, loc: "Ruang Kerja Utama Lt. 3", emp: seededEmployees[1] },
    { tag: "PSPK-IT-2026-003", cat: "IT" as const, type: "Laptop", name: "MacBook Air 15 M2", brand: "Apple", model: "A2941", sn: "C02L91AAMD6R", price: 22999000, status: "ASSIGNED" as const, loc: "Ruang Kerja Utama Lt. 3", emp: seededEmployees[2] },
    { tag: "PSPK-IT-2026-004", cat: "IT" as const, type: "Laptop", name: "Dell Latitude 5440", brand: "Dell", model: "L5440", sn: "8B7Y021", price: 18500000, status: "ASSIGNED" as const, loc: "Ruang Finansial & HR", emp: seededEmployees[3] },
    { tag: "PSPK-IT-2026-005", cat: "IT" as const, type: "Laptop", name: "ThinkPad E14 Gen 5", brand: "Lenovo", model: "21JK", sn: "PF3Z1189", price: 14200000, status: "ASSIGNED" as const, loc: "Ruang Rapat Riset", emp: seededEmployees[4] },
    { tag: "PSPK-IT-2026-006", cat: "IT" as const, type: "Monitor Eksternal", name: "Dell UltraSharp 27 4K", brand: "Dell", model: "U2723QE", sn: "CN04K891", price: 9200000, status: "ASSIGNED" as const, loc: "Ruang Kerja Utama Lt. 3", emp: seededEmployees[0] },
    { tag: "PSPK-IT-2026-007", cat: "IT" as const, type: "Monitor Eksternal", name: "LG UltraFine 27 Ergo", brand: "LG", model: "27UN880", sn: "208NT891", price: 7800000, status: "ASSIGNED" as const, loc: "Ruang Kerja Utama Lt. 3", emp: seededEmployees[2] },
    { tag: "PSPK-IT-2026-008", cat: "IT" as const, type: "Printer & Scanner", name: "Epson WorkForce Pro", brand: "Epson", model: "WF-C5790", sn: "X89Y10029", price: 8900000, status: "IN_STOCK" as const, loc: "Ruang Finansial & HR", emp: null },
    { tag: "PSPK-IT-2026-009", cat: "IT" as const, type: "Smartphone Uji", name: "Samsung Galaxy A54 5G", brand: "Samsung", model: "SM-A546E", sn: "RF8W10291", price: 5499000, status: "IN_STOCK" as const, loc: "Ruang Server & IT", emp: null },
    { tag: "PSPK-IT-2026-010", cat: "IT" as const, type: "Laptop", name: "MacBook Pro 16 M1 Max", brand: "Apple", model: "A2485", sn: "C02FK081MD6Q", price: 42000000, status: "MAINTENANCE" as const, loc: "Ruang Server & IT", emp: null, notes: "Penggantian baterai di authorized service provider" },
    { tag: "PSPK-IT-2026-011", cat: "IT" as const, type: "Laptop", name: "Lenovo ThinkPad X270", brand: "Lenovo", model: "20HN", sn: "PC0Q8891", price: 12000000, status: "RETIRED" as const, loc: "Gudang Logistik & Inventaris", emp: null, notes: "Sudah lewat masa pakai 5 tahun lembaga" },

    // Non-IT Assets
    { tag: "PSPK-NIT-2026-001", cat: "NON_IT" as const, type: "Meja Kerja", name: "Meja Workstation Modular 4-Pax", brand: "Informa", model: "Modular 4P", sn: "INF-M-2026-01", price: 14500000, status: "IN_STOCK" as const, loc: "Ruang Kerja Utama Lt. 3", emp: null },
    { tag: "PSPK-NIT-2026-002", cat: "NON_IT" as const, type: "Kursi Ergonomis", name: "Kursi Kerja Ergotec 808", brand: "Ergotec", model: "808-X", sn: "ERG-808-002", price: 2850000, status: "ASSIGNED" as const, loc: "Ruang Kerja Utama Lt. 3", emp: seededEmployees[0] },
    { tag: "PSPK-NIT-2026-003", cat: "NON_IT" as const, type: "Kursi Ergonomis", name: "Kursi Kerja Ergotec 808", brand: "Ergotec", model: "808-X", sn: "ERG-808-003", price: 2850000, status: "ASSIGNED" as const, loc: "Ruang Kerja Utama Lt. 3", emp: seededEmployees[1] },
    { tag: "PSPK-NIT-2026-004", cat: "NON_IT" as const, type: "Proyektor Rapat", name: "Epson Laser Projector 4K", brand: "Epson", model: "EB-L520U", sn: "EP-PROJ-992", price: 26000000, status: "IN_STOCK" as const, loc: "Ruang Rapat Riset", emp: null },
    { tag: "PSPK-NIT-2026-005", cat: "NON_IT" as const, type: "Kendaraan Operasional", name: "Toyota Kijang Innova Zenix V", brand: "Toyota", model: "Zenix 2.0 V", sn: "B 1928 PSP", price: 475000000, status: "IN_STOCK" as const, loc: "Gudang Logistik & Inventaris", emp: null, notes: "Kendaraan dinas lapangan tim riset daerah" },
  ];

  for (const ast of physicalAssets) {
    const asset = await prisma.asset.upsert({
      where: { assetTag: ast.tag },
      update: {
        category: ast.cat,
        type: ast.type,
        name: ast.name,
        brand: ast.brand,
        model: ast.model,
        serialNumber: ast.sn,
        purchasePrice: ast.price,
        status: ast.status,
        location: ast.loc,
        notes: (ast as any).notes || null,
      },
      create: {
        assetTag: ast.tag,
        category: ast.cat,
        type: ast.type,
        name: ast.name,
        brand: ast.brand,
        model: ast.model,
        serialNumber: ast.sn,
        purchaseDate: new Date("2026-01-15"),
        purchasePrice: ast.price,
        status: ast.status,
        location: ast.loc,
        notes: (ast as any).notes || null,
      },
    });

    if (ast.status === "ASSIGNED" && ast.emp) {
      const existingAssign = await prisma.assetAssignment.findFirst({
        where: { assetId: asset.id, employeeId: ast.emp.id, returnedAt: null },
      });
      if (!existingAssign) {
        await prisma.assetAssignment.create({
          data: {
            assetId: asset.id,
            employeeId: ast.emp.id,
            assignedAt: new Date("2026-02-01T08:00:00.000Z"),
            conditionOut: "Kondisi baru/prima lengkap dengan adaptor dan aksesoris orisinal",
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 11. LISENSI PERANGKAT LUNAK (10 Lisensi Software)
  // ---------------------------------------------------------------------------
  console.log("🔑 [11/16] Menyiapkan lisensi perangkat lunak kelembagaan...");

  const softwareLicenses = [
    { name: "Notion Team Workspace", vendor: "Notion Labs, Inc.", seatsTotal: 50, seatsUsed: 28, expiresAt: new Date("2027-08-31"), key: "NTN-PSPK-2026-ENTERPRISE" },
    { name: "Figma Organization", vendor: "Figma, Inc.", seatsTotal: 15, seatsUsed: 12, expiresAt: new Date("2027-04-30"), key: "FIG-ORG-9921-PSPK" },
    { name: "Google Workspace Enterprise", vendor: "Google Cloud", seatsTotal: 100, seatsUsed: 35, expiresAt: new Date("2027-12-31"), key: "GWS-ENT-PSPK-CLOUD" },
    { name: "Zoom Workplace Business", vendor: "Zoom Video Comm.", seatsTotal: 10, seatsUsed: 8, expiresAt: new Date("2027-02-28"), key: "ZM-BIZ-4401-PSPK" },
    { name: "Stata / MP 18 4-Core", vendor: "StataCorp LLC", seatsTotal: 5, seatsUsed: 5, expiresAt: new Date("2028-06-30"), key: "STATA-MP18-4C-9901" },
    { name: "IBM SPSS Statistics v29", vendor: "IBM Indonesia", seatsTotal: 8, seatsUsed: 6, expiresAt: new Date("2027-10-15"), key: "SPSS-V29-ACAD-2026" },
    { name: "OpenAI API Team Workspace", vendor: "OpenAI, LLC", seatsTotal: 25, seatsUsed: 14, expiresAt: new Date("2027-12-31"), key: "OAI-TEAM-KEY-ENC-01" },
    { name: "Canva for Teams", vendor: "Canva Pty Ltd", seatsTotal: 20, seatsUsed: 16, expiresAt: new Date("2027-05-15"), key: "CNV-TEAM-PSPK-2026" },
    { name: "Slack Pro Workspace", vendor: "Slack Technologies", seatsTotal: 60, seatsUsed: 32, expiresAt: new Date("2027-09-01"), key: "SLK-PRO-PSPK-COMM" },
    { name: "JetBrains All Products Pack", vendor: "JetBrains s.r.o.", seatsTotal: 5, seatsUsed: 4, expiresAt: new Date("2027-03-31"), key: "JB-ALL-PK-2026-TECH" },
  ];

  for (const lic of softwareLicenses) {
    const existing = await prisma.softwareLicense.findFirst({ where: { name: lic.name } });
    if (!existing) {
      await prisma.softwareLicense.create({
        data: {
          name: lic.name,
          vendor: lic.vendor,
          seatsTotal: lic.seatsTotal,
          seatsUsed: lic.seatsUsed,
          expiresAt: lic.expiresAt,
          purchaseDate: new Date("2026-01-01"),
          licenseKeyEnc: encryptField(lic.key),
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 12. DOKUMEN SOP & KEBIJAKAN (+ BERKAS PDF FISIK)
  // ---------------------------------------------------------------------------
  console.log("📁 [12/16] Menyiapkan dokumen SOP, regulasi internal, & berkas PDF...");

  const docCategories = await prisma.documentCategory.findMany();
  const kbjCat = docCategories.find((c) => c.codePrefix.includes("KBJ"));
  const hrCat = docCategories.find((c) => c.codePrefix.includes("HR"));
  const itCat = docCategories.find((c) => c.codePrefix.includes("IT"));
  const keuCat = docCategories.find((c) => c.codePrefix.includes("KEU"));
  const umumCat = docCategories.find((c) => c.codePrefix.includes("UMUM"));

  const sampleDocs = [
    { code: "KBJ-001", title: "Kebijakan Tata Kelola Organisasi & Kode Etik Peneliti PSPK", cat: kbjCat, vis: "ALL_STAFF" as const, file: "sysmgmt/documents/KBJ-001.pdf" },
    { code: "KBJ-002", title: "Kebijakan Kerja Fleksibel (Hybrid & WFH) Lembaga", cat: kbjCat, vis: "ALL_STAFF" as const, file: "sysmgmt/documents/KBJ-002.pdf" },
    { code: "KBJ-003", title: "Pedoman Integritas Data & Anti Plagiarisme Publikasi Riset", cat: kbjCat, vis: "ALL_STAFF" as const, file: "sysmgmt/documents/KBJ-003.pdf" },
    { code: "SOP-HR-001", title: "Prosedur Pengajuan & Rekonsiliasi Cuti Karyawan", cat: hrCat, vis: "ALL_STAFF" as const, file: "sysmgmt/documents/SOP-HR-001.pdf" },
    { code: "SOP-HR-002", title: "Prosedur Penilaian Kinerja Semesteran & KPI Scorecard", cat: hrCat, vis: "MANAGERS" as const, file: "sysmgmt/documents/SOP-HR-002.pdf" },
    { code: "SOP-HR-003", title: "Prosedur Pengunduran Diri & Serah Terima Tugas (Offboarding)", cat: hrCat, vis: "HR_ONLY" as const, file: "sysmgmt/documents/SOP-HR-003.pdf" },
    { code: "SOP-IT-001", title: "Standar Pengamanan Akun & Kebijakan Rotasi Kata Sandi", cat: itCat, vis: "ALL_STAFF" as const, file: "sysmgmt/documents/SOP-IT-001.pdf" },
    { code: "SOP-IT-002", title: "Prosedur Peminjaman & Pemeliharaan Perangkat Komputasi", cat: itCat, vis: "ALL_STAFF" as const, file: "sysmgmt/documents/SOP-IT-002.pdf" },
    { code: "SOP-KEU-001", title: "Pedoman Klaim Reimbursement Biaya Operasional Lapangan", cat: keuCat, vis: "ALL_STAFF" as const, file: "sysmgmt/documents/SOP-KEU-001.pdf" },
    { code: "SOP-UMUM-001", title: "Tata Tertib Penggunaan Ruang Rapat & Fasilitas Gedung Edukasi", cat: umumCat, vis: "ALL_STAFF" as const, file: "sysmgmt/documents/SOP-UMUM-001.pdf" },
  ];

  for (const d of sampleDocs) {
    const existing = await prisma.document.findUnique({ where: { code: d.code } });
    if (!existing && d.cat) {
      const doc = await prisma.document.create({
        data: {
          code: d.code,
          title: d.title,
          category: d.cat.name,
          categoryId: d.cat.id,
          visibility: d.vis,
          status: "ACTIVE",
          ownerId: superAdminId,
        },
      });

      // Tulis file fisik PDF ke .data/uploads
      const { size, sha256 } = await writeStorageFile(d.file, d.title);

      const version = await prisma.documentVersion.create({
        data: {
          documentId: doc.id,
          versionNo: 1,
          fileKey: d.file,
          fileName: `${d.code}.pdf`,
          mimeType: "application/pdf",
          sizeBytes: size,
          sha256,
          changeNote: "Penerbitan dokumen resmi versi perdana.",
          effectiveDate: new Date("2026-01-01"),
          createdById: superAdminId,
        },
      });

      await prisma.document.update({
        where: { id: doc.id },
        data: { currentVersionId: version.id },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 13. BRANKAS KREDENSIAL AKUN LEMBAGA (16 Kredensial Baru Terenkripsi)
  // ---------------------------------------------------------------------------
  console.log("🔐 [13/16] Menyiapkan 16 akun brankas kredensial terenkripsi (AES-256-GCM)...");

  const credentialVaultItems = [
    // Media Sosial
    { title: "Instagram Resmi Lembaga (@pspk_id)", cat: "SOCIAL_MEDIA" as const, url: "https://www.instagram.com/pspk_id", user: "pspk_id", email: "komunikasi@pspk.id", pass: "PspkInstaPass2026!", twoFa: "AUTHENTICATOR_APP" as const, pic: seededEmployees[8] },
    { title: "LinkedIn Organisasi PSPK", cat: "SOCIAL_MEDIA" as const, url: "https://www.linkedin.com/company/pspk-id", user: "admin_linkedin", email: "kemitraan@pspk.id", pass: "LinkedInPspkAdvokasi!", twoFa: "SMS_OTP" as const, pic: seededEmployees[1] },
    { title: "X (Twitter) Resmi (@pspk_id)", cat: "SOCIAL_MEDIA" as const, url: "https://x.com/pspk_id", user: "pspk_id", email: "komunikasi@pspk.id", pass: "TwitPolicyPspk#2026", twoFa: "AUTHENTICATOR_APP" as const, pic: seededEmployees[8] },
    { title: "YouTube Channel Edukasi PSPK", cat: "SOCIAL_MEDIA" as const, url: "https://www.youtube.com/@pspk_edukasi", user: "studio_pspk", email: "youtube@pspk.id", pass: "YtStudioPspkVideo26!", twoFa: "AUTHENTICATOR_APP" as const, pic: jodyEmp },

    // Hosting & Server
    { title: "Niagahoster cPanel Hosting Utama", cat: "WEBSITE_HOSTING" as const, url: "https://cpanel.pspk.id:2083", user: "pspkcpanel", email: "it@pspk.id", pass: "CpanelSecured9912!", twoFa: "AUTHENTICATOR_APP" as const, pic: budiEmp },
    { title: "Cloudflare DNS & Edge Gateway", cat: "WEBSITE_HOSTING" as const, url: "https://dash.cloudflare.com", user: "noc@pspk.id", email: "it@pspk.id", pass: "CloudflareEdgeShield26!", twoFa: "AUTHENTICATOR_APP" as const, pic: budiEmp },
    { title: "AWS Console PSPK Production Cloud", cat: "WEBSITE_HOSTING" as const, url: "https://pspk-org.signin.aws.amazon.com/console", user: "aws-admin-pspk", email: "cloud-ops@pspk.id", pass: "AwsKmsPlatform321#", twoFa: "HARDWARE_KEY" as const, pic: seededEmployees[2] },
    { title: "PANDI Domain Registrar (.id)", cat: "WEBSITE_HOSTING" as const, url: "https://pandi.id/login", user: "domain_pspk", email: "it.admin@pspk.id", pass: "PandiDomainRegistrar!", twoFa: "EMAIL_OTP" as const, pic: budiEmp },

    // SaaS & Tools
    { title: "Typeform Akun Survei Peneliti", cat: "SAAS_TOOL" as const, url: "https://admin.typeform.com", user: "typeform_lead", email: "riset@pspk.id", pass: "TypeformSurveiPspk99", twoFa: "NONE" as const, pic: seededEmployees[0] },
    { title: "Mailgun SMTP Transactional Service", cat: "SAAS_TOOL" as const, url: "https://app.mailgun.com", user: "postmaster@mail.pspk.id", email: "sysadmin@pspk.id", pass: "MailgunSecretKey2026#", twoFa: "AUTHENTICATOR_APP" as const, pic: seededEmployees[2] },
    { title: "Airtable Data Riset Lapangan LDB", cat: "SAAS_TOOL" as const, url: "https://airtable.com", user: "ldb_airtable", email: "ldb@pspk.id", pass: "AirtableLdbField#26", twoFa: "NONE" as const, pic: seededEmployees[6] },

    // Pemerintah & Publik
    { title: "Portal Satu Data Kemendikbud", cat: "GOVERNMENT_PUBLIC" as const, url: "https://data.kemdikbud.go.id", user: "mitra_pspk_kemendikbud", email: "kebijakan@pspk.id", pass: "SatuDataDikbud2026!", twoFa: "SMS_OTP" as const, pic: seededEmployees[0] },
    { title: "LPSE Pengadaan Riset Nasional", cat: "GOVERNMENT_PUBLIC" as const, url: "https://lpse.lkpp.go.id", user: "pspk_lpse_vendor", email: "keuangan@pspk.id", pass: "LpseTenderPspk2026!", twoFa: "AUTHENTICATOR_APP" as const, pic: seededEmployees[3] },
    { title: "DJP Online Pajak Lembaga", cat: "GOVERNMENT_PUBLIC" as const, url: "https://djponline.pajak.go.id", user: "01.234.567.8-012.000", email: "pajak@pspk.id", pass: "DjpPajakPspkAnnual26!", twoFa: "SMS_OTP" as const, pic: seededEmployees[3] },

    // Perbankan
    { title: "BCA KlikBisnis Corporate Banking", cat: "FINANCE_BANKING" as const, url: "https://klikbca.com/corporate", user: "CORP_PSPK_01", email: "finance@pspk.id", pass: "BcaKlikBisnisPass99!", twoFa: "HARDWARE_KEY" as const, pic: seededEmployees[3] },
    { title: "Mandiri Cash Management (MCM)", cat: "FINANCE_BANKING" as const, url: "https://mcm.bankmandiri.co.id", user: "MCM_PSPK_ADMIN", email: "treasury@pspk.id", pass: "MandiriMcmSecure2026#", twoFa: "HARDWARE_KEY" as const, pic: jodyEmp },
  ];

  for (const cred of credentialVaultItems) {
    const existing = await prisma.credential.findFirst({ where: { title: cred.title } });
    if (!existing) {
      await prisma.credential.create({
        data: {
          title: cred.title,
          category: cred.cat,
          url: cred.url,
          username: cred.user,
          email: cred.email,
          passwordEnc: encryptField(cred.pass),
          twoFactorType: cred.twoFa,
          recoveryEmail: "it.backup@pspk.id",
          recoveryPhone: "081234567800",
          picEmployeeId: cred.pic?.id || null,
          notes: "Akun operasional resmi lembaga. Jangan bagikan kata sandi di luar kanal komunikasi aman.",
          isActive: true,
          lastRotatedAt: new Date("2026-10-01T00:00:00.000Z"),
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 14. KALENDER LEMBAGA & ACARA KEGIATAN (8 Event Baru)
  // ---------------------------------------------------------------------------
  console.log("📅 [14/16] Menyiapkan kalender kerja lembaga & acara riset...");

  const calendarEventsBatch = [
    { title: "Townhall & Koordinasi Akbar Kuartal IV 2026", type: "MEETING" as const, start: "2026-11-13T09:00:00.000Z", end: "2026-11-13T11:30:00.000Z", desc: "Paparan capaian program inisiatif semester II dan arah strategis 2027.", url: "https://meet.google.com/pspk-twn-2026" },
    { title: "Diseminasi Riset Kebijakan Bersama Ditjen PAUD Dikdasmen", type: "MEETING" as const, start: "2026-11-18T13:30:00.000Z", end: "2026-11-18T16:00:00.000Z", desc: "Pemaparan hasil survei lapangan efektivitas program belajar mandiri.", url: "https://meet.google.com/pspk-ris-2026" },
    { title: "Pelatihan Analisis Kuantitatif Stata untuk Peneliti Muda", type: "MEETING" as const, start: "2026-11-24T10:00:00.000Z", end: "2026-11-24T12:00:00.000Z", desc: "Workshop internal pengolahan data mikro survei pendidikan.", url: "https://meet.google.com/pspk-trn-2026" },
    { title: "Rapat Koordinasi Akhir Tahun Divisi SDM & Operasional", type: "MEETING" as const, start: "2026-12-04T14:00:00.000Z", end: "2026-12-04T15:30:00.000Z", desc: "Review cuti massal, fasilitas kantor, dan perpanjangan kontrak.", url: "https://meet.google.com/pspk-ops-2026" },
    { title: "Refleksi Akhir Tahun & Penutupan Program Lembaga 2026", type: "MEETING" as const, start: "2026-12-23T10:00:00.000Z", end: "2026-12-23T14:00:00.000Z", desc: "Apresiasi kinerja tim, makan siang bersama, dan libur akhir tahun.", url: "https://meet.google.com/pspk-eoy-2026" },
  ];

  for (const ev of calendarEventsBatch) {
    const existing = await prisma.calendarEvent.findFirst({ where: { title: ev.title } });
    if (!existing) {
      await prisma.calendarEvent.create({
        data: {
          title: ev.title,
          description: ev.desc,
          type: ev.type,
          source: "HRIS_SYSTEM",
          startAt: new Date(ev.start),
          endAt: new Date(ev.end),
          meetUrl: ev.url,
          employeeId: jodyEmp?.id,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 15. SIARAN EMAIL INTERNAL (Email Broadcasts)
  // ---------------------------------------------------------------------------
  console.log("📢 [15/16] Menyiapkan siaran pengumuman internal (Email Broadcast)...");

  const broadcastsBatch = [
    {
      subject: "Pengumuman Jadwal Libur Nasional & Rekomendasi Cuti Akhir Tahun 2026",
      html: "<p>Yth. Seluruh Rekan PSPK,<br><br>Sehubungan dengan mendekatnya penghujung tahun 2026, manajemen mengingatkan rekan-rekan untuk memeriksa sisa kuota cuti tahunan dan mengajukan permohonan melalui sistem HRIS paling lambat tanggal 10 Desember 2026.<br><br>Salam hangat,<br>Divisi SDM & Budaya Organisasi</p>",
      text: "Yth. Seluruh Rekan PSPK, Manajemen mengingatkan rekan-rekan untuk mengajukan sisa cuti tahunan melalui sistem HRIS paling lambat 10 Desember 2026.",
    },
    {
      subject: "Sosialisasi Standar Keamanan Akun & Pemanfaatan Brankas Kredensial Sistem",
      html: "<p>Rekan-rekan Staf & Peneliti,<br><br>Guna menjaga keamanan aset informasi riset, Divisi IT telah mengaktifkan modul Brankas Kredensial di System Management. Mohon tidak mencatat password di spreadsheet bersama.<br><br>Salam,<br>Divisi TI PSPK</p>",
      text: "Rekan-rekan, Divisi IT telah mengaktifkan modul Brankas Kredensial di System Management. Mohon tidak mencatat password di spreadsheet bersama.",
    },
  ];

  for (const b of broadcastsBatch) {
    const existing = await prisma.emailBroadcast.findFirst({ where: { subject: b.subject } });
    if (!existing && superAdminUser && jodyEmp) {
      const bc = await prisma.emailBroadcast.create({
        data: {
          subject: b.subject,
          contentHtml: b.html,
          contentText: b.text,
          senderUserId: superAdminUser.id,
          senderEmployeeId: jodyEmp.id,
          senderName: "Operasi & Manajemen SDM PSPK",
          senderEmail: "operasi@pspk.id",
          replyToEmail: "hr@pspk.id",
          targetScope: "ALL_EMPLOYEES",
          totalRecipients: allEmployees.length,
          sentCount: allEmployees.length,
          failedCount: 0,
          status: "SENT",
        },
      });

      // Hubungkan 5 sampel penerima
      for (const emp of seededEmployees.slice(0, 5)) {
        await prisma.emailBroadcastRecipient.create({
          data: {
            broadcastId: bc.id,
            employeeId: emp.id,
            email: emp.workEmail,
            recipientName: emp.fullName,
            status: "SENT",
            sentAt: new Date(),
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 16. NOTIFIKASI & LOG AUDIT SISTEM (30+ Notifikasi, 50+ Audit Log)
  // ---------------------------------------------------------------------------
  console.log("🔔 [16/16] Menyiapkan notifikasi interaktif & riwayat log audit aktivitas...");

  // Notifikasi untuk pengguna baru
  for (const emp of seededEmployees.slice(0, 8)) {
    if (!emp.userId) continue;

    const notifData = [
      {
        title: "Slip Gaji Oktober 2026 Telah Diterbitkan",
        message: "Slip gaji elektronik periode Oktober 2026 Anda sudah dapat diunduh melalui menu Slip Gaji.",
        type: "SUCCESS",
        category: "PAYROLL",
        link: "/slip-gaji",
      },
      {
        title: "Pengingat Evaluasi Kinerja Semester II",
        message: "Periode evaluasi kinerja Semester II 2026 aktif. Silakan lengkapi self-review sasaran KPI Anda.",
        type: "ACTION_REQUIRED",
        category: "PERFORMANCE",
        link: "/kinerja",
      },
      {
        title: "Penugasan Perangkat Kerja Resmi",
        message: "Perangkat inventaris laptop kerja telah tercatat pada profil aset Anda di System Management.",
        type: "INFO",
        category: "SYSTEM",
        link: "/profil",
      },
    ];

    for (const n of notifData) {
      const existing = await prisma.notification.findFirst({
        where: { userId: emp.userId, title: n.title },
      });
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: emp.userId,
            title: n.title,
            message: n.message,
            type: n.type,
            category: n.category,
            link: n.link,
            isRead: false,
          },
        });
      }
    }
  }

  // Log Audit Tambahan untuk SysMgmt Audit Trail
  const auditEntries = [
    { actorEmail: "superadmin@pspk.id", app: "sysmgmt", action: "CREATE", entityType: "Asset", entityId: "PSPK-IT-2026-001", after: { name: "MacBook Pro 14 M3 Pro", tag: "PSPK-IT-2026-001" } },
    { actorEmail: "it.admin@pspk.id", app: "sysmgmt", action: "UPDATE", entityType: "Credential", entityId: "cred-vault-01", after: { action: "Rotasi kata sandi rutin Cloudflare Gateway" } },
    { actorEmail: "hr@pspk.id", app: "hris", action: "APPROVE", entityType: "LeaveRequest", entityId: "leave-req-batch", after: { status: "APPROVED", notes: "Persetujuan cuti tahunan staf riset" } },
    { actorEmail: "jody@pspk.id", app: "hris", action: "PUBLISH", entityType: "PayrollPeriod", entityId: octPeriod.id, after: { period: "Oktober 2026", totalNet: 145000000 } },
    { actorEmail: "it.admin@pspk.id", app: "sysmgmt", action: "VIEW_SENSITIVE", entityType: "Credential", entityId: "cred-vault-bca", after: { field: "passwordEnc", reason: "Verifikasi otentikasi pembayaran payroll" } },
    { actorEmail: "hr@pspk.id", app: "hris", action: "CREATE", entityType: "Employee", entityId: "batch-import", after: { count: 14, note: "Penyuntikan profil pegawai baru sistem" } },
  ];

  for (const al of auditEntries) {
    await prisma.auditLog.create({
      data: {
        actorEmail: al.actorEmail,
        app: al.app,
        action: al.action,
        entityType: al.entityType,
        entityId: al.entityId,
        occurredAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 10)),
        after: al.after,
        ip: "127.0.0.1",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0 Safari/537.36",
      },
    });
  }

  console.log("✨ Seeding data dummy komprehensif HRIS & System Management berhasil diselesaikan!");
}

// Eksekusi jika file dijalankan langsung via tsx
if (process.argv[1]?.endsWith("seed-dummy.ts")) {
  const standalonePrisma = new PrismaClient();
  seedDummyData(standalonePrisma)
    .catch((err) => {
      console.error("❌ Terjadi error saat menjalankan seed-dummy:", err);
      process.exit(1);
    })
    .finally(async () => {
      await standalonePrisma.$disconnect();
    });
}

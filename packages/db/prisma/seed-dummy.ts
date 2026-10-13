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
} from "@prisma/client";
import { encryptField } from "@pspk/shared";
import { hashPassword } from "better-auth/crypto";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

function createSamplePdfBuffer(title: string): Buffer {
  return Buffer.from(
    `%PDF-1.4\n1 0 obj\n<< /Title (${title}) /Creator (PSPK Platform Seed) /CreationDate (D:20261013000000Z) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000090 00000 n \n0000000135 00000 n \n0000000186 00000 n \ntrailer\n<< /Size 5 /Root 2 0 R >>\nstartxref\n255\n%%EOF\n`,
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
  console.log("🚀 Memulai penyiapan data dummy komprehensif HRIS & System Management...");

  const defaultPasswordHash = await hashPassword("PspkPlatform2026!");
  const staffRole = await prisma.role.findUnique({ where: { key: "staff" } });
  const superAdminUser = await prisma.user.findFirst({ where: { email: "superadmin@pspk.id" } });
  const superAdminId = superAdminUser?.id || "system";
  const arisUser = await prisma.user.findUnique({ where: { email: "aris@pspk.id" } });
  const jodyUser = await prisma.user.findUnique({ where: { email: "jody@pspk.id" } });
  const vindaUser = await prisma.user.findUnique({ where: { email: "hr@pspk.id" } });

  // ---------------------------------------------------------------------------
  // 1. DATA PENGGUNA & PEGAWAI TAMBAHAN
  // ---------------------------------------------------------------------------
  console.log("👥 [1/13] Menyiapkan pegawai & user tambahan...");

  const jodyEmp = await prisma.employee.findFirst({ where: { workEmail: "jody@pspk.id" } });
  const lskpDept = await prisma.department.findFirst({ where: { name: { contains: "LSKP" } } });
  const ldbDept = await prisma.department.findFirst({ where: { name: { contains: "LDB" } } });

  const lskpResearcherPos = await prisma.position.findFirst({
    where: { departmentId: lskpDept?.id, title: "Peneliti" },
  });
  const ldbStaffPos = await prisma.position.findFirst({
    where: { departmentId: ldbDept?.id, title: "Staf" },
  });

  // A. Dewi Lestari, M.Si. (Peneliti Lepas / PKWT Hourly)
  const dewiUser = await prisma.user.upsert({
    where: { email: "dewi@pspk.id" },
    update: { name: "Dewi Lestari, M.Si.", isActive: true, emailVerified: true },
    create: {
      email: "dewi@pspk.id",
      name: "Dewi Lestari, M.Si.",
      isActive: true,
      emailVerified: true,
    },
  });

  const existingDewiAcc = await prisma.account.findFirst({
    where: { userId: dewiUser.id, providerId: "credential" },
  });
  if (!existingDewiAcc) {
    await prisma.account.create({
      data: {
        userId: dewiUser.id,
        accountId: dewiUser.id,
        providerId: "credential",
        password: defaultPasswordHash,
      },
    });
  }
  if (staffRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: dewiUser.id, roleId: staffRole.id } },
      update: {},
      create: { userId: dewiUser.id, roleId: staffRole.id },
    });
  }

  const dewiEmp = await prisma.employee.upsert({
    where: { employeeNo: "PSPK-202610-006" },
    update: {
      userId: dewiUser.id,
      fullName: "Dewi Lestari, M.Si.",
      workEmail: "dewi@pspk.id",
      phone: "081234567891",
      gender: "FEMALE",
      maritalStatus: "SINGLE",
      currentDepartmentId: lskpDept?.id,
      currentPositionId: lskpResearcherPos?.id,
      managerId: jodyEmp?.id,
      status: "ACTIVE",
    },
    create: {
      employeeNo: "PSPK-202610-006",
      userId: dewiUser.id,
      fullName: "Dewi Lestari, M.Si.",
      nickname: "Dewi",
      workEmail: "dewi@pspk.id",
      personalEmail: "dewi.lestari.research@gmail.com",
      phone: "081234567891",
      gender: "FEMALE",
      maritalStatus: "SINGLE",
      address: "Jl. Tebet Barat Dalam No. 12, Jakarta Selatan",
      emergencyContactName: "Lestari Senior (Ibu)",
      emergencyContactPhone: "081298765431",
      joinDate: new Date("2026-08-01"),
      currentDepartmentId: lskpDept?.id,
      currentPositionId: lskpResearcherPos?.id,
      managerId: jodyEmp?.id,
      status: "ACTIVE",
      bankName: "Bank Central Asia (BCA)",
      bankAccountName: "Dewi Lestari",
      bankAccountEnc: encryptField("5420987123"),
      nikEnc: encryptField("3174055208920002"),
      npwpEnc: encryptField("829104928014000"),
    },
  });

  // B. Farhan Ramadhan (Mahasiswa Magang Riset Kebijakan / Internship)
  const farhanUser = await prisma.user.upsert({
    where: { email: "farhan@pspk.id" },
    update: { name: "Farhan Ramadhan", isActive: true, emailVerified: true },
    create: {
      email: "farhan@pspk.id",
      name: "Farhan Ramadhan",
      isActive: true,
      emailVerified: true,
    },
  });

  const existingFarhanAcc = await prisma.account.findFirst({
    where: { userId: farhanUser.id, providerId: "credential" },
  });
  if (!existingFarhanAcc) {
    await prisma.account.create({
      data: {
        userId: farhanUser.id,
        accountId: farhanUser.id,
        providerId: "credential",
        password: defaultPasswordHash,
      },
    });
  }
  if (staffRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: farhanUser.id, roleId: staffRole.id } },
      update: {},
      create: { userId: farhanUser.id, roleId: staffRole.id },
    });
  }

  const farhanEmp = await prisma.employee.upsert({
    where: { employeeNo: "PSPK-202610-007" },
    update: {
      userId: farhanUser.id,
      fullName: "Farhan Ramadhan",
      workEmail: "farhan@pspk.id",
      phone: "081345678902",
      gender: "MALE",
      maritalStatus: "SINGLE",
      currentDepartmentId: ldbDept?.id,
      currentPositionId: ldbStaffPos?.id,
      managerId: jodyEmp?.id,
      status: "ACTIVE",
    },
    create: {
      employeeNo: "PSPK-202610-007",
      userId: farhanUser.id,
      fullName: "Farhan Ramadhan",
      nickname: "Farhan",
      workEmail: "farhan@pspk.id",
      personalEmail: "farhan.ramadhan.univ@gmail.com",
      phone: "081345678902",
      gender: "MALE",
      maritalStatus: "SINGLE",
      address: "Kukusan, Beji, Depok, Jawa Barat",
      emergencyContactName: "Ramadhan (Ayah)",
      emergencyContactPhone: "081387654322",
      joinDate: new Date("2026-09-01"),
      currentDepartmentId: ldbDept?.id,
      currentPositionId: ldbStaffPos?.id,
      managerId: jodyEmp?.id,
      status: "ACTIVE",
      bankName: "Bank Mandiri",
      bankAccountName: "Farhan Ramadhan",
      bankAccountEnc: encryptField("1570008899112"),
      nikEnc: encryptField("3276021504010003"),
      npwpEnc: encryptField("912384759012000"),
    },
  });

  // ---------------------------------------------------------------------------
  // 2. KONTRAK KERJA KARYAWAN (Employment Contracts)
  // ---------------------------------------------------------------------------
  console.log("📑 [2/13] Menyiapkan kelengkapan kontrak kerja seluruh pegawai...");

  const allEmployees = await prisma.employee.findMany();
  const empTypes = await prisma.employmentTypeMaster.findMany();
  const typeMap = new Map(empTypes.map((t) => [t.code, t]));

  const contractConfigs = [
    {
      email: "hr@pspk.id",
      type: "PERMANENT" as EmploymentType,
      typeCode: "PERMANENT",
      startDate: new Date("2024-01-01"),
      baseSalary: 12500000,
      wageType: "MONTHLY" as WageType,
    },
    {
      email: "jody@pspk.id",
      type: "PERMANENT" as EmploymentType,
      typeCode: "PERMANENT",
      startDate: new Date("2023-06-01"),
      baseSalary: 14500000,
      wageType: "MONTHLY" as WageType,
    },
    {
      email: "aris@pspk.id",
      type: "FIXED_TERM" as EmploymentType,
      typeCode: "PKWT_RISET",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      baseSalary: 10500000,
      wageType: "MONTHLY" as WageType,
    },
    {
      email: "it.admin@pspk.id",
      type: "PERMANENT" as EmploymentType,
      typeCode: "PERMANENT",
      startDate: new Date("2025-06-01"),
      baseSalary: 10000000,
      wageType: "MONTHLY" as WageType,
    },
    {
      email: "rina@pspk.id",
      type: "FIXED_TERM" as EmploymentType,
      typeCode: "PKWT_RISET",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2027-01-31"),
      baseSalary: 9000000,
      wageType: "MONTHLY" as WageType,
    },
    {
      email: "dewi@pspk.id",
      type: "FIXED_TERM" as EmploymentType,
      typeCode: "PKWT_HOURLY",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2027-01-31"),
      wageType: "HOURLY" as WageType,
      hourlyRate: 75000,
      baseSalary: null,
    },
    {
      email: "farhan@pspk.id",
      type: "PART_TIME_PROJECT" as EmploymentType,
      typeCode: "INTERNSHIP",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-11-30"),
      baseSalary: 3000000,
      wageType: "MONTHLY" as WageType,
    },
  ];

  for (const c of contractConfigs) {
    const emp = allEmployees.find((e) => e.workEmail === c.email);
    if (!emp) continue;

    const masterType = typeMap.get(c.typeCode);
    const existing = await prisma.employmentContract.findFirst({
      where: { employeeId: emp.id, status: "ACTIVE" },
    });

    if (existing) {
      await prisma.employmentContract.update({
        where: { id: existing.id },
        data: {
          baseSalary: c.baseSalary,
          hourlyRate: c.hourlyRate || null,
          wageType: c.wageType,
          type: c.type,
          employmentTypeId: masterType?.id || null,
        },
      });
    } else {
      await prisma.employmentContract.create({
        data: {
          employeeId: emp.id,
          type: c.type,
          employmentTypeId: masterType?.id || null,
          startDate: c.startDate,
          endDate: c.endDate || null,
          baseSalary: c.baseSalary || null,
          hourlyRate: c.hourlyRate || null,
          wageType: c.wageType,
          status: "ACTIVE",
          notes: `Kontrak kerja resmi terverifikasi SDM PSPK (${c.typeCode}).`,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 3. MASTER SALDO CUTI TAHUN 2026 (Leave Balances)
  // ---------------------------------------------------------------------------
  console.log("🏖️ [3/13] Menyiapkan kuota dan saldo cuti tahun 2026...");

  const leaveTypes = await prisma.leaveType.findMany({ where: { isActive: true } });
  const cutiTahunan = leaveTypes.find((lt) => lt.name.includes("Tahunan"));
  const cutiSakit = leaveTypes.find((lt) => lt.name.includes("Sakit"));
  const cutiMelahirkan = leaveTypes.find((lt) => lt.name.includes("Melahirkan"));
  const cutiPenting = leaveTypes.find((lt) => lt.name.includes("Penting"));

  const leaveBalancePresets: Record<string, { tahunanUsed: number; sakitUsed: number }> = {
    "hr@pspk.id": { tahunanUsed: 2, sakitUsed: 0 },
    "jody@pspk.id": { tahunanUsed: 1, sakitUsed: 0 },
    "aris@pspk.id": { tahunanUsed: 2, sakitUsed: 0 },
    "it.admin@pspk.id": { tahunanUsed: 0, sakitUsed: 0 },
    "rina@pspk.id": { tahunanUsed: 3, sakitUsed: 1 },
    "dewi@pspk.id": { tahunanUsed: 0, sakitUsed: 0 },
    "farhan@pspk.id": { tahunanUsed: 0, sakitUsed: 0 },
  };

  const currentRefreshedEmployees = await prisma.employee.findMany();
  for (const emp of currentRefreshedEmployees) {
    const preset = leaveBalancePresets[emp.workEmail] || { tahunanUsed: 0, sakitUsed: 0 };

    for (const lt of leaveTypes) {
      let used = 0;
      if (lt.id === cutiTahunan?.id) used = preset.tahunanUsed;
      if (lt.id === cutiSakit?.id) used = preset.sakitUsed;

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
          usedDays: used,
        },
        create: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          year: 2026,
          quotaDays: lt.defaultQuotaDays,
          usedDays: used,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 4. PENGAJUAN CUTI (Leave Requests)
  // ---------------------------------------------------------------------------
  console.log("📝 [4/13] Menyiapkan permohonan cuti (Pending, Approved, Rejected)...");

  const arisEmp = currentRefreshedEmployees.find((e) => e.workEmail === "aris@pspk.id");
  const rinaEmp = currentRefreshedEmployees.find((e) => e.workEmail === "rina@pspk.id");
  const vindaEmp = currentRefreshedEmployees.find((e) => e.workEmail === "hr@pspk.id");
  const jodyEmpRef = currentRefreshedEmployees.find((e) => e.workEmail === "jody@pspk.id");

  // Sample upload surat dokter untuk cuti sakit
  await writeStorageFile(
    "samples/surat-keterangan-sakit-rina.pdf",
    "Surat Keterangan Sakit Puskesmas / RS Jakarta",
  );

  const sampleLeaveRequests = [
    {
      emp: arisEmp,
      lt: cutiTahunan,
      startDate: new Date("2026-10-22"),
      endDate: new Date("2026-10-23"),
      days: 2,
      reason: "Keperluan upacara adat keluarga di Denpasar, Bali",
      status: "PENDING" as LeaveStatus,
      approverId: null,
      decidedAt: null,
      decisionNote: null,
    },
    {
      emp: rinaEmp,
      lt: cutiTahunan,
      startDate: new Date("2026-09-17"),
      endDate: new Date("2026-09-18"),
      days: 2,
      reason: "Cuti bersama keluarga dan urusan pribadi di luar kota",
      status: "APPROVED" as LeaveStatus,
      approverId: jodyUser?.id || null,
      decidedAt: new Date("2026-09-15T09:30:00Z"),
      decisionNote: "Disetujui. Koordinasi dengan rekan inisiatif telah tuntas.",
    },
    {
      emp: jodyEmpRef,
      lt: cutiTahunan,
      startDate: new Date("2026-09-25"),
      endDate: new Date("2026-09-25"),
      days: 1,
      reason: "Urusan administrasi kependudukan dan perpanjangan paspor dinas",
      status: "APPROVED" as LeaveStatus,
      approverId: vindaUser?.id || null,
      decidedAt: new Date("2026-09-24T14:15:00Z"),
      decisionNote: "Disetujui oleh HR.",
    },
    {
      emp: vindaEmp,
      lt: cutiTahunan,
      startDate: new Date("2026-08-14"),
      endDate: new Date("2026-08-15"),
      days: 2,
      reason: "Liburan tahunan bersama keluarga",
      status: "APPROVED" as LeaveStatus,
      approverId: superAdminId,
      decidedAt: new Date("2026-08-10T10:00:00Z"),
      decisionNote: "Disetujui Direksi.",
    },
    {
      emp: rinaEmp,
      lt: cutiSakit,
      startDate: new Date("2026-10-06"),
      endDate: new Date("2026-10-06"),
      days: 1,
      reason: "Istirahat sakit demam tinggi dan gejala radang tenggorokan",
      attachmentKey: "samples/surat-keterangan-sakit-rina.pdf",
      status: "APPROVED" as LeaveStatus,
      approverId: jodyUser?.id || null,
      decidedAt: new Date("2026-10-06T11:00:00Z"),
      decisionNote: "Disetujui berdasarkan lampiran surat istirahat dokter klinik.",
    },
    {
      emp: arisEmp,
      lt: cutiTahunan,
      startDate: new Date("2026-07-10"),
      endDate: new Date("2026-07-10"),
      days: 1,
      reason: "Cuti mendadak keperluan personal",
      status: "REJECTED" as LeaveStatus,
      approverId: jodyUser?.id || null,
      decidedAt: new Date("2026-07-09T16:20:00Z"),
      decisionNote: "Mohon dijadwalkan ulang karena bertepatan dengan rilis platform Pemantik.",
    },
  ];

  for (const lr of sampleLeaveRequests) {
    if (!lr.emp || !lr.lt) continue;
    const existing = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: lr.emp.id,
        startDate: lr.startDate,
        endDate: lr.endDate,
      },
    });

    if (!existing) {
      await prisma.leaveRequest.create({
        data: {
          employeeId: lr.emp.id,
          leaveTypeId: lr.lt.id,
          startDate: lr.startDate,
          endDate: lr.endDate,
          days: lr.days,
          reason: lr.reason,
          attachmentKey: lr.attachmentKey || null,
          status: lr.status,
          approverId: lr.approverId,
          decidedAt: lr.decidedAt,
          decisionNote: lr.decisionNote,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 5. DATA LOG PRESENSI / ABSENSI (Attendance)
  // ---------------------------------------------------------------------------
  console.log("⏰ [5/13] Menyiapkan rekam kehadiran 30 hari terakhir...");

  // Generate log absensi 15 September 2026 s/d 13 Oktober 2026
  const attendanceStaff = [vindaEmp, jodyEmpRef, arisEmp, rinaEmp].filter(Boolean);
  const budiEmp = currentRefreshedEmployees.find((e) => e.workEmail === "it.admin@pspk.id");
  if (budiEmp) attendanceStaff.push(budiEmp);

  const startAttDate = new Date(Date.UTC(2026, 8, 15)); // 15 Sep 2026
  const endAttDate = new Date(Date.UTC(2026, 9, 13)); // 13 Oct 2026

  for (let d = new Date(startAttDate); d <= endAttDate; d.setUTCDate(d.getUTCDate() + 1)) {
    const dayOfWeek = d.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekend

    const curDateOnly = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
    );
    const dayNum = d.getUTCDate();

    for (const emp of attendanceStaff) {
      if (!emp) continue;

      // Cek apakah ada cuti di tanggal ini
      const isRinaLeave =
        emp.workEmail === "rina@pspk.id" &&
        ((d.getUTCMonth() === 8 && (dayNum === 17 || dayNum === 18)) ||
          (d.getUTCMonth() === 9 && dayNum === 6));
      const isJodyLeave =
        emp.workEmail === "jody@pspk.id" && d.getUTCMonth() === 8 && dayNum === 25;

      if (isRinaLeave || isJodyLeave) {
        await prisma.attendance.upsert({
          where: { employeeId_date: { employeeId: emp.id, date: curDateOnly } },
          update: { status: "LEAVE", notes: "Cuti disetujui", source: "MANUAL_HR" },
          create: {
            employeeId: emp.id,
            date: curDateOnly,
            status: "LEAVE",
            notes: "Cuti disetujui",
            source: "MANUAL_HR",
          },
        });
        continue;
      }

      // Variasi status kehadiran
      const isLateDay = (dayNum + emp.fullName.length) % 11 === 0;
      const isWfhDay = dayOfWeek === 3 || dayOfWeek === 5; // Rabu / Jumat WFH

      let status: AttendanceStatus = "PRESENT";
      let inHour = 8;
      let inMin = 30 + ((dayNum * 3) % 25);
      let outHour = 17;
      let outMin = 5 + ((dayNum * 4) % 25);
      let notes: string | null = null;

      if (isLateDay) {
        status = "LATE";
        inHour = 9;
        inMin = 15 + ((dayNum * 2) % 20);
        notes = "Keterlambatan karena gangguan perjalanan KRL";
      } else if (isWfhDay) {
        status = "WFH";
        inHour = 8;
        inMin = 45;
        notes = "WFH - Penulisan naskah riset kebijakan & operasional online";
      }

      // Buat timestamp UTC (WIB = UTC+7)
      const checkInAt = new Date(
        Date.UTC(
          d.getUTCFullYear(),
          d.getUTCMonth(),
          d.getUTCDate(),
          inHour - 7,
          inMin,
          0,
          0,
        ),
      );
      const checkOutAt = new Date(
        Date.UTC(
          d.getUTCFullYear(),
          d.getUTCMonth(),
          d.getUTCDate(),
          outHour - 7,
          outMin,
          0,
          0,
        ),
      );

      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: emp.id, date: curDateOnly } },
        update: {
          status,
          checkInAt,
          checkOutAt,
          notes,
          source: "WEB",
        },
        create: {
          employeeId: emp.id,
          date: curDateOnly,
          status,
          checkInAt,
          checkOutAt,
          notes,
          source: "WEB",
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 6. MASTER & ALOKASI KOMPONEN PENGGAJIAN (Payroll Components)
  // ---------------------------------------------------------------------------
  console.log("💰 [6/13] Menyiapkan master komponen payroll & alokasi gaji...");

  const defaultSalaryComponents = [
    {
      code: "BASE_SALARY",
      name: "Gaji Pokok",
      type: "EARNING" as SalaryComponentType,
      calcType: "FIXED" as SalaryCalcType,
      defaultValue: 8000000,
    },
    {
      code: "ALLOWANCE_POSITION",
      name: "Tunjangan Jabatan & Keahlian",
      type: "EARNING" as SalaryComponentType,
      calcType: "FIXED" as SalaryCalcType,
      defaultValue: 2500000,
    },
    {
      code: "ALLOWANCE_COMMUNICATION",
      name: "Tunjangan Komunikasi & Internet",
      type: "EARNING" as SalaryComponentType,
      calcType: "FIXED" as SalaryCalcType,
      defaultValue: 500000,
    },
    {
      code: "ALLOWANCE_TRANSPORT",
      name: "Tunjangan Transportasi & Mobilitas",
      type: "EARNING" as SalaryComponentType,
      calcType: "FIXED" as SalaryCalcType,
      defaultValue: 750000,
    },
    {
      code: "DED_BPJS_KES",
      name: "Iuran BPJS Kesehatan (1%)",
      type: "DEDUCTION" as SalaryComponentType,
      calcType: "FIXED" as SalaryCalcType,
      defaultValue: 100000,
    },
    {
      code: "DED_BPJS_TK",
      name: "Iuran BPJS Ketenagakerjaan (2%)",
      type: "DEDUCTION" as SalaryComponentType,
      calcType: "FIXED" as SalaryCalcType,
      defaultValue: 200000,
    },
    {
      code: "DED_PPH21",
      name: "PPh Pasal 21 (Pajak Penghasilan)",
      type: "DEDUCTION" as SalaryComponentType,
      calcType: "FIXED" as SalaryCalcType,
      defaultValue: 150000,
    },
  ];

  const compMap = new Map();
  for (const sc of defaultSalaryComponents) {
    const comp = await prisma.salaryComponent.upsert({
      where: { code: sc.code },
      update: {
        name: sc.name,
        type: sc.type,
        calcType: sc.calcType,
        defaultValue: sc.defaultValue,
        isActive: true,
      },
      create: {
        code: sc.code,
        name: sc.name,
        type: sc.type,
        calcType: sc.calcType,
        defaultValue: sc.defaultValue,
        isActive: true,
      },
    });
    compMap.set(sc.code, comp);
  }

  // Alokasi komponen gaji per karyawan
  const empSalaryAllocations: Record<string, Record<string, number>> = {
    "hr@pspk.id": {
      BASE_SALARY: 9500000,
      ALLOWANCE_POSITION: 2000000,
      ALLOWANCE_COMMUNICATION: 500000,
      ALLOWANCE_TRANSPORT: 500000,
      DED_BPJS_KES: 120000,
      DED_BPJS_TK: 240000,
      DED_PPH21: 290000,
    },
    "jody@pspk.id": {
      BASE_SALARY: 11000000,
      ALLOWANCE_POSITION: 2500000,
      ALLOWANCE_COMMUNICATION: 500000,
      ALLOWANCE_TRANSPORT: 500000,
      DED_BPJS_KES: 140000,
      DED_BPJS_TK: 280000,
      DED_PPH21: 430000,
    },
    "aris@pspk.id": {
      BASE_SALARY: 8500000,
      ALLOWANCE_POSITION: 1500000,
      ALLOWANCE_COMMUNICATION: 500000,
      ALLOWANCE_TRANSPORT: 500000,
      DED_BPJS_KES: 105000,
      DED_BPJS_TK: 210000,
      DED_PPH21: 185000,
    },
    "it.admin@pspk.id": {
      BASE_SALARY: 8000000,
      ALLOWANCE_POSITION: 1500000,
      ALLOWANCE_COMMUNICATION: 500000,
      ALLOWANCE_TRANSPORT: 500000,
      DED_BPJS_KES: 100000,
      DED_BPJS_TK: 200000,
      DED_PPH21: 150000,
    },
    "rina@pspk.id": {
      BASE_SALARY: 7500000,
      ALLOWANCE_POSITION: 1000000,
      ALLOWANCE_COMMUNICATION: 500000,
      ALLOWANCE_TRANSPORT: 500000,
      DED_BPJS_KES: 95000,
      DED_BPJS_TK: 190000,
      DED_PPH21: 115000,
    },
  };

  for (const emp of currentRefreshedEmployees) {
    const alloc = empSalaryAllocations[emp.workEmail];
    if (!alloc) continue;

    for (const [code, amount] of Object.entries(alloc)) {
      const comp = compMap.get(code);
      if (!comp) continue;

      const existingComp = await prisma.employeeSalaryComponent.findFirst({
        where: { employeeId: emp.id, componentId: comp.id },
      });

      if (!existingComp) {
        await prisma.employeeSalaryComponent.create({
          data: {
            employeeId: emp.id,
            componentId: comp.id,
            amount,
            effectiveFrom: new Date("2026-01-01"),
          },
        });
      } else {
        await prisma.employeeSalaryComponent.update({
          where: { id: existingComp.id },
          data: { amount },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 7. PERIODE PENGGAJIAN & SLIP GAJI (Payroll Periods & Payslips)
  // ---------------------------------------------------------------------------
  console.log("💵 [7/13] Menyiapkan periode penggajian & penerbitan slip gaji...");

  // Periode September 2026 (PUBLISHED)
  const sepPeriod = await prisma.payrollPeriod.upsert({
    where: {
      year_month_kind: {
        year: 2026,
        month: 9,
        kind: "REGULAR" as PayrollKind,
      },
    },
    update: {
      status: "PUBLISHED" as PayrollStatus,
      cutoffDate: new Date("2026-09-25"),
      lockedAt: new Date("2026-09-26T10:00:00Z"),
    },
    create: {
      year: 2026,
      month: 9,
      kind: "REGULAR",
      status: "PUBLISHED",
      cutoffDate: new Date("2026-09-25"),
      lockedAt: new Date("2026-09-26T10:00:00Z"),
    },
  });

  // Periode Oktober 2026 (CALCULATED / DRAFT)
  await prisma.payrollPeriod.upsert({
    where: {
      year_month_kind: {
        year: 2026,
        month: 10,
        kind: "REGULAR" as PayrollKind,
      },
    },
    update: {
      status: "CALCULATED" as PayrollStatus,
      cutoffDate: new Date("2026-10-25"),
    },
    create: {
      year: 2026,
      month: 10,
      kind: "REGULAR",
      status: "CALCULATED",
      cutoffDate: new Date("2026-10-25"),
    },
  });

  // Terbitkan slip gaji September 2026
  for (const emp of currentRefreshedEmployees) {
    const alloc = empSalaryAllocations[emp.workEmail];
    let gross = 0;
    let deduction = 0;
    let wageType: WageType = "MONTHLY";
    let totalHours: number | null = null;
    let hourlyRate: number | null = null;

    if (alloc) {
      gross =
        (alloc.BASE_SALARY || 0) +
        (alloc.ALLOWANCE_POSITION || 0) +
        (alloc.ALLOWANCE_COMMUNICATION || 0) +
        (alloc.ALLOWANCE_TRANSPORT || 0);
      deduction = (alloc.DED_BPJS_KES || 0) + (alloc.DED_BPJS_TK || 0) + (alloc.DED_PPH21 || 0);
    } else if (emp.workEmail === "dewi@pspk.id") {
      wageType = "HOURLY";
      totalHours = 42.5;
      hourlyRate = 75000;
      gross = totalHours * hourlyRate;
      deduction = 0;
    } else if (emp.workEmail === "farhan@pspk.id") {
      gross = 3000000;
      deduction = 0;
    } else {
      continue;
    }

    const net = gross - deduction;

    const payslip = await prisma.payslip.upsert({
      where: {
        periodId_employeeId: {
          periodId: sepPeriod.id,
          employeeId: emp.id,
        },
      },
      update: {
        grossAmount: gross,
        totalDeduction: deduction,
        netAmount: net,
        wageType,
        totalHours,
        hourlyRate,
        status: "PUBLISHED" as PayrollStatus,
        publishedAt: new Date("2026-09-26T10:00:00Z"),
      },
      create: {
        periodId: sepPeriod.id,
        employeeId: emp.id,
        grossAmount: gross,
        totalDeduction: deduction,
        netAmount: net,
        wageType,
        totalHours,
        hourlyRate,
        status: "PUBLISHED",
        publishedAt: new Date("2026-09-26T10:00:00Z"),
      },
    });

    // Rincian Baris Slip Gaji (Payslip Lines)
    await prisma.payslipLine.deleteMany({ where: { payslipId: payslip.id } });

    if (alloc) {
      for (const [code, amount] of Object.entries(alloc)) {
        const comp = compMap.get(code);
        if (!comp) continue;
        await prisma.payslipLine.create({
          data: {
            payslipId: payslip.id,
            componentId: comp.id,
            label: comp.name,
            type: comp.type,
            amount,
          },
        });
      }
    } else if (emp.workEmail === "dewi@pspk.id") {
      await prisma.payslipLine.create({
        data: {
          payslipId: payslip.id,
          label: "Honorarium Jam Kerja Terverifikasi (42.5 jam @ Rp 75.000)",
          type: "EARNING",
          amount: gross,
        },
      });
    } else if (emp.workEmail === "farhan@pspk.id") {
      await prisma.payslipLine.create({
        data: {
          payslipId: payslip.id,
          label: "Uang Saku Magang Bulanan PSPK",
          type: "EARNING",
          amount: gross,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 8. KINERJA / EVALUASI PEGAWAI (Performance Goals & Reviews)
  // ---------------------------------------------------------------------------
  console.log("🎯 [8/13] Menyiapkan modul sasaran kinerja & ulasan semester...");

  const perfPeriod = await prisma.performancePeriod.upsert({
    where: { id: "perf-sem-2-2026" },
    update: {
      name: "Semester II 2026 — Penguatan Advokasi & Riset Kebijakan Pendidikan",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-12-31"),
      status: "OPEN",
    },
    create: {
      id: "perf-sem-2-2026",
      name: "Semester II 2026 — Penguatan Advokasi & Riset Kebijakan Pendidikan",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-12-31"),
      status: "OPEN",
    },
  });

  const sampleGoals = [
    {
      emp: jodyEmpRef,
      title: "Penyusunan & Publikasi 3 Policy Brief Transformasi Kurikulum",
      desc: "Menghasilkan rekomendasi kebijakan berbasis data riset evaluasi kurikulum untuk kementerian.",
      weight: 40,
      target: "3 naskah",
      unit: "naskah",
      actual: "2 naskah diselesaikan",
    },
    {
      emp: jodyEmpRef,
      title: "Supervisi Metodologi & Kualitas Analisis 4 Inisiatif Riset",
      desc: "Memastikan kepatuhan standar rigor ilmiah dan validitas data lintas inisiatif PSPK.",
      weight: 30,
      target: "100%",
      unit: "%",
      actual: "85%",
    },
    {
      emp: jodyEmpRef,
      title: "Diseminasi Kebijakan dengan Pemangku Kepentingan Nasional",
      desc: "Menginisiasi forum dialog bersama Bappenas dan Kemendikbudristek.",
      weight: 30,
      target: "4 forum",
      unit: "forum",
      actual: "3 forum",
    },
    {
      emp: arisEmp,
      title: "Pengembangan & Stabilitas Platform Terpadu Pemantik & HRIS",
      desc: "Menjaga ketersediaan sistem, integrasi modul baru, dan performa query database.",
      weight: 45,
      target: "99.5% Uptime",
      unit: "%",
      actual: "99.8%",
    },
    {
      emp: arisEmp,
      title: "Keamanan Sistem & Otomasi Pipeline Backup VPS",
      desc: "Penerapan enkripsi kolom AES-256-GCM, audit log komprehensif, dan backup otomatis harian.",
      weight: 35,
      target: "100% Kepatuhan",
      unit: "%",
      actual: "100%",
    },
    {
      emp: arisEmp,
      title: "Dokumentasi Arsitektur Sistem & Panduan Administrator",
      desc: "Penyusunan blueprint arsitektur, SOP IT, dan recovery plan.",
      weight: 20,
      target: "100%",
      unit: "%",
      actual: "90%",
    },
    {
      emp: rinaEmp,
      title: "Pengembangan Instrumen Asesmen Diagnostik Literasi LDB",
      desc: "Penyusunan rubrik asesmen mandiri tingkat sekolah dasar di 5 kabupaten mitra.",
      weight: 50,
      target: "5 instrumen",
      unit: "instrumen",
      actual: "4 instrumen",
    },
    {
      emp: rinaEmp,
      title: "Fasilitasi Workshop Komunitas Guru Penggerak Daerah",
      desc: "Penyelenggaraan pendampingan pemanfaatan hasil data asesmen pembelajaran.",
      weight: 50,
      target: "6 sesi",
      unit: "sesi",
      actual: "5 sesi",
    },
  ];

  for (const g of sampleGoals) {
    if (!g.emp) continue;
    const existing = await prisma.performanceGoal.findFirst({
      where: {
        employeeId: g.emp.id,
        periodId: perfPeriod.id,
        title: g.title,
      },
    });

    if (!existing) {
      await prisma.performanceGoal.create({
        data: {
          employeeId: g.emp.id,
          periodId: perfPeriod.id,
          title: g.title,
          description: g.desc,
          weight: g.weight,
          target: g.target,
          unit: g.unit,
          actual: g.actual,
        },
      });
    }
  }

  // Performance Review (Aris direview oleh Jody, Rina direview oleh Jody)
  if (arisEmp && jodyEmpRef) {
    await prisma.performanceReview.upsert({
      where: {
        employeeId_periodId: {
          employeeId: arisEmp.id,
          periodId: perfPeriod.id,
        },
      },
      update: {
        reviewerId: jodyEmpRef.id,
        selfScore: 92.5,
        managerScore: 91.0,
        finalScore: 91.75,
        selfComment:
          "Sistem HRIS dan System Management berhasil dibangun dan terintegrasi monorepo dengan aman.",
        managerComment:
          "Kinerja teknis sangat memuaskan, platform andal dan tanggap menangani kebutuhan organisasi.",
        status: "FINALIZED" as ReviewStatus,
      },
      create: {
        employeeId: arisEmp.id,
        periodId: perfPeriod.id,
        reviewerId: jodyEmpRef.id,
        selfScore: 92.5,
        managerScore: 91.0,
        finalScore: 91.75,
        selfComment:
          "Sistem HRIS dan System Management berhasil dibangun dan terintegrasi monorepo dengan aman.",
        managerComment:
          "Kinerja teknis sangat memuaskan, platform andal dan tanggap menangani kebutuhan organisasi.",
        status: "FINALIZED",
      },
    });
  }

  if (rinaEmp && jodyEmpRef) {
    await prisma.performanceReview.upsert({
      where: {
        employeeId_periodId: {
          employeeId: rinaEmp.id,
          periodId: perfPeriod.id,
        },
      },
      update: {
        reviewerId: jodyEmpRef.id,
        selfScore: 88.0,
        managerScore: 87.5,
        finalScore: 87.75,
        selfComment: "Penyusunan modul dan instrumen asesmen berjalan sesuai jadwal riset daerah.",
        managerComment:
          "Hasil asesmen sangat diapresiasi oleh dinas pendidikan mitra daerah. Pertahankan!",
        status: "FINALIZED" as ReviewStatus,
      },
      create: {
        employeeId: rinaEmp.id,
        periodId: perfPeriod.id,
        reviewerId: jodyEmpRef.id,
        selfScore: 88.0,
        managerScore: 87.5,
        finalScore: 87.75,
        selfComment: "Penyusunan modul dan instrumen asesmen berjalan sesuai jadwal riset daerah.",
        managerComment:
          "Hasil asesmen sangat diapresiasi oleh dinas pendidikan mitra daerah. Pertahankan!",
        status: "FINALIZED",
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 9. TIMESHEET PENELITI LEPAS (Timesheets & Reviewers)
  // ---------------------------------------------------------------------------
  console.log("⏱️ [9/13] Menyiapkan pengajuan lembar timesheet staf PKWT lepas...");

  if (dewiEmp && jodyEmpRef) {
    // Timesheet September 2026 (APPROVED)
    const sepTimesheet = await prisma.timesheetSubmission.upsert({
      where: { id: "ts-dewi-sep-2026" },
      update: {
        totalHours: 42.5,
        status: "APPROVED" as TimesheetStatus,
        approvedAt: new Date("2026-09-25T15:00:00Z"),
        payrollPeriodId: sepPeriod.id,
      },
      create: {
        id: "ts-dewi-sep-2026",
        employeeId: dewiEmp.id,
        periodMonth: 9,
        periodYear: 2026,
        title: "Lembar Jam Kerja Peneliti Lepas — Transkripsi & Koding Wawancara LSKP",
        spreadsheetUrl:
          "https://docs.google.com/spreadsheets/d/1dewiTimesheetSep2026ExamplePSPK/edit",
        totalHours: 42.5,
        description:
          "Penyelesaian koding kualitatif 12 wawancara mendalam informan dinas pendidikan provinsi.",
        status: "APPROVED",
        submittedAt: new Date("2026-09-24T10:00:00Z"),
        approvedAt: new Date("2026-09-25T15:00:00Z"),
        payrollPeriodId: sepPeriod.id,
      },
    });

    await prisma.timesheetReviewer.upsert({
      where: {
        submissionId_reviewerId: {
          submissionId: sepTimesheet.id,
          reviewerId: jodyEmpRef.id,
        },
      },
      update: {
        status: "APPROVED" as ReviewerStatus,
        notes: "Hasil analisis koding telah diperiksa dan disetujui penuh.",
        reviewedAt: new Date("2026-09-25T15:00:00Z"),
        actionAt: new Date("2026-09-25T15:00:00Z"),
      },
      create: {
        submissionId: sepTimesheet.id,
        reviewerId: jodyEmpRef.id,
        status: "APPROVED",
        notes: "Hasil analisis koding telah diperiksa dan disetujui penuh.",
        reviewedAt: new Date("2026-09-25T15:00:00Z"),
        actionAt: new Date("2026-09-25T15:00:00Z"),
      },
    });

    // Timesheet Oktober 2026 (PENDING)
    const oktTimesheet = await prisma.timesheetSubmission.upsert({
      where: { id: "ts-dewi-okt-2026" },
      update: {
        totalHours: 28.0,
        status: "PENDING" as TimesheetStatus,
      },
      create: {
        id: "ts-dewi-okt-2026",
        employeeId: dewiEmp.id,
        periodMonth: 10,
        periodYear: 2026,
        title: "Lembar Jam Kerja Peneliti Lepas — Sintesis Literatur & Draft Analisis Bab 3",
        spreadsheetUrl:
          "https://docs.google.com/spreadsheets/d/1dewiTimesheetOkt2026ExamplePSPK/edit",
        totalHours: 28.0,
        description:
          "Penyusunan matriks perbandingan regulasi daerah dan draft narasi bab temuan awal.",
        status: "PENDING",
        submittedAt: new Date("2026-10-12T16:00:00Z"),
      },
    });

    await prisma.timesheetReviewer.upsert({
      where: {
        submissionId_reviewerId: {
          submissionId: oktTimesheet.id,
          reviewerId: jodyEmpRef.id,
        },
      },
      update: {
        status: "PENDING" as ReviewerStatus,
        notes: null,
      },
      create: {
        submissionId: oktTimesheet.id,
        reviewerId: jodyEmpRef.id,
        status: "PENDING",
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 10. ONBOARDING & PELATIHAN (Onboarding Tasks & Training Records)
  // ---------------------------------------------------------------------------
  console.log("🎓 [10/13] Menyiapkan tugas orientasi onboarding & riwayat pelatihan...");

  if (farhanEmp) {
    const onboardingItems = [
      {
        title: "Orientasi Visi, Misi, dan Nilai Lembaga PSPK",
        doneAt: new Date("2026-09-02T10:00:00Z"),
        dueDate: new Date("2026-09-05"),
      },
      {
        title: "Pemberian Akses Email Lembaga, Google Workspace & Slack",
        doneAt: new Date("2026-09-01T14:00:00Z"),
        dueDate: new Date("2026-09-02"),
      },
      {
        title: "Sosialisasi Tata Tertib, SOP Kepegawaian & Jam Kerja Lembaga",
        doneAt: new Date("2026-09-04T11:00:00Z"),
        dueDate: new Date("2026-09-07"),
      },
      {
        title: "Briefing Panduan Metodologi Riset Kebijakan & Gaya Selingkung PSPK",
        doneAt: null,
        dueDate: new Date("2026-10-20"),
      },
      {
        title: "Evaluasi Capaian Program Magang Bulan Ke-2 bersama Mentor",
        doneAt: null,
        dueDate: new Date("2026-11-05"),
      },
    ];

    for (const ob of onboardingItems) {
      const existing = await prisma.onboardingTask.findFirst({
        where: { employeeId: farhanEmp.id, title: ob.title },
      });
      if (!existing) {
        await prisma.onboardingTask.create({
          data: {
            employeeId: farhanEmp.id,
            title: ob.title,
            dueDate: ob.dueDate,
            doneAt: ob.doneAt,
            assigneeId: jodyEmpRef?.id || null,
          },
        });
      }
    }
  }

  // Training Records
  const trainingItems = [
    {
      emp: jodyEmpRef,
      title: "Workshop Advanced Policy Analysis & Econometric Modelling",
      provider: "LPEM FEB UI & The World Bank Institute",
      startDate: new Date("2025-04-10"),
      endDate: new Date("2025-04-14"),
    },
    {
      emp: arisEmp,
      title: "Sertifikasi Keamanan Aplikasi Web & DevSecOps Container Docker",
      provider: "Linux Foundation Training & Certification",
      startDate: new Date("2025-07-20"),
      endDate: new Date("2025-07-25"),
    },
    {
      emp: vindaEmp,
      title: "Manajemen Kinerja SDM Sektor Nonprofit Berbasis OKR",
      provider: "PPM Manajemen",
      startDate: new Date("2025-09-12"),
      endDate: new Date("2025-09-13"),
    },
    {
      emp: rinaEmp,
      title: "Bimbingan Teknis Penyusunan Asesmen Diagnostik Literasi Dasar",
      provider: "Pusat Kurikulum dan Pembelajaran Kemendikbudristek",
      startDate: new Date("2026-03-05"),
      endDate: new Date("2026-03-07"),
    },
  ];

  for (const tr of trainingItems) {
    if (!tr.emp) continue;
    const existing = await prisma.trainingRecord.findFirst({
      where: { employeeId: tr.emp.id, title: tr.title },
    });
    if (!existing) {
      await prisma.trainingRecord.create({
        data: {
          employeeId: tr.emp.id,
          title: tr.title,
          provider: tr.provider,
          startDate: tr.startDate,
          endDate: tr.endDate,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 11. SYSTEM MANAGEMENT: ASET, LISENSI & DOKUMEN TAMBAHAN
  // ---------------------------------------------------------------------------
  console.log("🖥️ [11/13] Menyiapkan inventaris aset, lisensi, & SOP System Management...");

  // A. Aset Tambahan
  const additionalAssets = [
    {
      tag: "AST-IT-2025-005",
      name: "Apple iPad Pro 11 M4 (Wi-Fi 256GB)",
      category: "IT" as AssetCategory,
      type: "Smartphone Uji",
      brand: "Apple",
      model: "iPad Pro M4 Space Black",
      serial: "DMPQ9827361K",
      price: 18499000,
      status: "ASSIGNED" as AssetStatus,
      location: "Ruang Kerja Utama Lt. 3",
      notes: "Digunakan staf peneliti untuk pengambilan data lapangan dan instrumen asesmen digital.",
      assigneeEmp: rinaEmp,
    },
    {
      tag: "AST-IT-2025-006",
      name: "Apple MacBook Air 15 M2 (16GB/512GB)",
      category: "IT" as AssetCategory,
      type: "Laptop",
      brand: "Apple",
      model: "MacBook Air 15 Midnight",
      serial: "C02XYZ1234AB",
      price: 21999000,
      status: "ASSIGNED" as AssetStatus,
      location: "Ruang Kerja Utama Lt. 3",
      notes: "Laptop operasional staf administrator TI PSPK.",
      assigneeEmp: budiEmp,
    },
    {
      tag: "AST-IT-2025-007",
      name: "MikroTik CCR2004-16G-2S+ Cloud Router",
      category: "IT" as AssetCategory,
      type: "Printer & Scanner", // tipe kategori IT
      brand: "MikroTik",
      model: "CCR2004-16G-2S+",
      serial: "MT-CCR-992018",
      price: 8750000,
      status: "IN_STOCK" as AssetStatus,
      location: "Ruang Server & IT",
      notes: "Router gateway utama jaringan internet kantor dan VPN organisasi.",
      assigneeEmp: null,
    },
    {
      tag: "AST-IT-2025-008",
      name: "Lenovo ThinkPad X1 Carbon Gen 8 (Refurbished)",
      category: "IT" as AssetCategory,
      type: "Laptop",
      brand: "Lenovo",
      model: "ThinkPad X1 Gen 8",
      serial: "PF-109283-ID",
      price: 14500000,
      status: "RETIRED" as AssetStatus,
      location: "Gudang Logistik & Inventaris",
      notes: "Masa pakai telah melebihi 5 tahun, dipensiunkan sebagai suku cadang cadangan.",
      assigneeEmp: null,
    },
    {
      tag: "AST-NIT-2025-003",
      name: "Toyota Avanza Veloz 1.5 Q CVT (B 1452 PSP)",
      category: "NON_IT" as AssetCategory,
      type: "Kendaraan Operasional",
      brand: "Toyota",
      model: "Veloz 1.5 Q CVT",
      serial: "MHFM87123987",
      price: 295000000,
      status: "IN_STOCK" as AssetStatus,
      location: "Area Parkir Khusus PSPK Lt. 1",
      notes: "Kendaraan dinas operasional riset lapangan dan agenda kelembagaan.",
      assigneeEmp: null,
    },
    {
      tag: "AST-NIT-2025-004",
      name: "Kamera Mirrorless Sony Alpha 7 IV + Lensa FE 24-70mm GM",
      category: "NON_IT" as AssetCategory,
      type: "Proyektor Rapat",
      brand: "Sony",
      model: "ILCE-7M4",
      serial: "SN-A7M4-449102",
      price: 43500000,
      status: "ASSIGNED" as AssetStatus,
      location: "Ruang Finansial & HR",
      notes: "Perangkat dokumentasi resmi forum nasional, wawancara, dan materi publikasi.",
      assigneeEmp: vindaEmp,
    },
    {
      tag: "AST-NIT-2025-005",
      name: "Meja Rapat Oval Konferensi Kayu Jati 12 Kursi",
      category: "NON_IT" as AssetCategory,
      type: "Meja Kerja",
      brand: "Custom Woodcraft",
      model: "Oval Conference Table 360cm",
      serial: "FUR-TBL-005",
      price: 16500000,
      status: "IN_STOCK" as AssetStatus,
      location: "Ruang Rapat Riset",
      notes: "Meja ruang rapat pleno direksi dan forum diseminasi internal.",
      assigneeEmp: null,
    },
  ];

  for (const ast of additionalAssets) {
    const asset = await prisma.asset.upsert({
      where: { assetTag: ast.tag },
      update: {
        name: ast.name,
        category: ast.category,
        type: ast.type,
        brand: ast.brand,
        model: ast.model,
        serialNumber: ast.serial,
        purchasePrice: ast.price,
        status: ast.status,
        location: ast.location,
        notes: ast.notes,
      },
      create: {
        assetTag: ast.tag,
        name: ast.name,
        category: ast.category,
        type: ast.type,
        brand: ast.brand,
        model: ast.model,
        serialNumber: ast.serial,
        purchasePrice: ast.price,
        status: ast.status,
        location: ast.location,
        notes: ast.notes,
        purchaseDate: new Date("2025-03-01"),
      },
    });

    if (ast.assigneeEmp) {
      const existingAssign = await prisma.assetAssignment.findFirst({
        where: { assetId: asset.id, employeeId: ast.assigneeEmp.id, returnedAt: null },
      });
      if (!existingAssign) {
        await prisma.assetAssignment.create({
          data: {
            assetId: asset.id,
            employeeId: ast.assigneeEmp.id,
            assignedAt: new Date("2025-06-01T09:00:00Z"),
            conditionOut: "Kondisi baru 100%, lengkap box dan kelengkapan resmi.",
            notes: `Serah terima penugasan fasilitas kerja resmi untuk ${ast.assigneeEmp.fullName}.`,
          },
        });
      }
    }
  }

  // B. Lisensi Software Tambahan
  const additionalLicenses = [
    {
      name: "IBM SPSS Statistics 29 Campus Edition",
      vendor: "IBM Corporation",
      seatsTotal: 5,
      seatsUsed: 4,
      expiresAt: new Date("2027-04-30"),
      key: "SPSS29-PSPK-UNIV-99201-ACAD",
      notes: "Lisensi pengolahan statistik kuantitatif untuk tim analis data dan asisten riset.",
    },
    {
      name: "Stata MP 18 (4-Core Parallel High-Performance)",
      vendor: "StataCorp LLC",
      seatsTotal: 3,
      seatsUsed: 2,
      expiresAt: new Date("2026-12-31"),
      key: "STATA18-MP4-PSPK-88192-LAB",
      notes: "Lisensi ekonometrika untuk analisis data longitudinal & evaluasi dampak kebijakan.",
    },
    {
      name: "Canva Pro for Nonprofits (Tim Desain & Publikasi)",
      vendor: "Canva Pty Ltd",
      seatsTotal: 10,
      seatsUsed: 8,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Berakhir 14 hari lagi (Trigger alert dashboard!)
      key: "CANVA-NPO-PSPK-GRANT-2026",
      notes:
        "Peringatan aktif: Lisensi mendekati batas kedaluwarsa, proses perpanjangan sedang diajukan ke Keuangan.",
    },
  ];

  for (const lic of additionalLicenses) {
    const existing = await prisma.softwareLicense.findFirst({ where: { name: lic.name } });
    if (!existing) {
      await prisma.softwareLicense.create({
        data: {
          name: lic.name,
          vendor: lic.vendor,
          seatsTotal: lic.seatsTotal,
          seatsUsed: lic.seatsUsed,
          expiresAt: lic.expiresAt,
          licenseKeyEnc: encryptField(lic.key),
          notes: lic.notes,
        },
      });
    }
  }

  // C. Dokumen & SOP Tambahan
  const docCats = await prisma.documentCategory.findMany();
  const catSopUmum = docCats.find((c) => c.name.includes("Umum"));
  const catKbj = docCats.find((c) => c.name.includes("Kebijakan"));
  const catSopHr = docCats.find((c) => c.name.includes("HR"));
  const catSopKeu = docCats.find((c) => c.name.includes("Keuangan"));

  const newDocs = [
    {
      code: "SOP-UMUM-001",
      title: "Standar Prosedur Peminjaman Fasilitas & Ruang Pertemuan Lembaga",
      categoryName: catSopUmum?.name || "SOP Operasional & Umum",
      catId: catSopUmum?.id,
      visibility: "ALL_STAFF" as DocumentVisibility,
      fileKey: "sysmgmt/documents/sop-umum-001/v1-sample-sop-umum-001.pdf",
      fileName: "SOP-UMUM-001_Peminjaman_Fasilitas_v1.0.pdf",
      note: "Pedoman tata cara reservasi ruang rapat dan peminjaman fasilitas kantor.",
    },
    {
      code: "KBJ-002",
      title: "Surat Edaran Direksi: Kebijakan Pola Kerja Fleksibel & Hybrid Working PSPK",
      categoryName: catKbj?.name || "Kebijakan Lembaga",
      catId: catKbj?.id,
      visibility: "ALL_STAFF" as DocumentVisibility,
      fileKey: "sysmgmt/documents/kbj-002/v1-sample-kbj-002.pdf",
      fileName: "SE-DIR-002_Kebijakan_Hybrid_Working_2026.pdf",
      note: "Panduan pembagian jadwal WFH, jam inti kerja kolaboratif, dan standar komunikasi daring.",
    },
    {
      code: "SOP-HR-002",
      title: "Petunjuk Teknis Pengajuan Cuti, Dispensasi, dan Izin Khusus Pegawai",
      categoryName: catSopHr?.name || "SOP HR & Kepegawaian",
      catId: catSopHr?.id,
      visibility: "ALL_STAFF" as DocumentVisibility,
      fileKey: "sysmgmt/documents/sop-hr-002/v1-sample-sop-hr-002.pdf",
      fileName: "SOP-HR-002_Alur_Pengajuan_Cuti_v1.0.pdf",
      note: "Alur persetujuan bertingkat, batas waktu pengajuan, dan ketentuan lampiran surat dokter.",
    },
    {
      code: "SOP-KEU-002",
      title: "Pedoman Standar Honorarium & Perjalanan Dinas Riset Lapangan",
      categoryName: catSopKeu?.name || "SOP Keuangan & Anggaran",
      catId: catSopKeu?.id,
      visibility: "MANAGERS" as DocumentVisibility,
      fileKey: "sysmgmt/documents/sop-keu-002/v1-sample-sop-keu-002.pdf",
      fileName: "SOP-KEU-002_Standar_Honorarium_Riset_v1.0.pdf",
      note: "Standar tarif upah peneliti lepas, narasumber ahli, dan pertanggungjawaban SPJ keuangan.",
    },
  ];

  for (const nd of newDocs) {
    const fileMeta = await writeStorageFile(nd.fileKey, nd.title);

    let doc = await prisma.document.findUnique({ where: { code: nd.code } });
    if (!doc) {
      doc = await prisma.document.create({
        data: {
          code: nd.code,
          title: nd.title,
          category: nd.categoryName,
          categoryId: nd.catId || null,
          visibility: nd.visibility,
          status: "ACTIVE",
          ownerId: superAdminId,
        },
      });
    }

    const version = await prisma.documentVersion.upsert({
      where: {
        documentId_versionNo: {
          documentId: doc.id,
          versionNo: 1,
        },
      },
      update: {
        fileName: nd.fileName,
        fileKey: nd.fileKey,
        mimeType: "application/pdf",
        sizeBytes: fileMeta.size,
        sha256: fileMeta.sha256,
        changeNote: nd.note,
        effectiveDate: new Date("2026-01-01"),
      },
      create: {
        documentId: doc.id,
        versionNo: 1,
        fileName: nd.fileName,
        fileKey: nd.fileKey,
        mimeType: "application/pdf",
        sizeBytes: fileMeta.size,
        sha256: fileMeta.sha256,
        changeNote: nd.note,
        effectiveDate: new Date("2026-01-01"),
        createdById: superAdminId,
      },
    });

    if (doc.currentVersionId !== version.id) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { currentVersionId: version.id },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 12. NOTIFIKASI AKTIVITAS SISTEM (Notifications)
  // ---------------------------------------------------------------------------
  console.log("🔔 [12/13] Menyiapkan riwayat notifikasi pengguna...");

  const notificationsToCreate = [
    {
      userId: arisUser?.id,
      title: "Permohonan Cuti Berhasil Diajukan",
      message:
        "Pengajuan Cuti Tahunan Anda (22-23 Okt 2026) telah dikirimkan ke atasan untuk ditinjau.",
      type: "INFO",
      category: "LEAVE",
      link: "/cuti",
      isRead: false,
    },
    {
      userId: arisUser?.id,
      title: "Slip Gaji Periode September 2026 Tersedia",
      message:
        "Slip gaji resmi elektronik periode September 2026 telah terbit dan siap diunduh.",
      type: "SUCCESS",
      category: "PAYROLL",
      link: "/slip-gaji",
      isRead: true,
    },
    {
      userId: arisUser?.id,
      title: "Fasilitas Perangkat Kerja Ditugaskan",
      message:
        "Laptop MacBook Pro 14 M3 Pro (AST-IT-2025-001) telah dialokasikan ke profil Anda oleh IT Admin.",
      type: "SUCCESS",
      category: "SYSTEM",
      link: "/profil",
      isRead: true,
    },
    {
      userId: jodyUser?.id,
      title: "Persetujuan Cuti Pegawai Menunggu Tindakan",
      message:
        "I Made Aris Danuarta mengajukan Cuti Tahunan (2 hari: 22-23 Okt 2026) yang membutuhkan persetujuan Anda.",
      type: "ACTION_REQUIRED",
      category: "LEAVE",
      link: "/cuti/persetujuan",
      isRead: false,
    },
    {
      userId: jodyUser?.id,
      title: "Lembar Jam Kerja Timesheet Masuk",
      message:
        "Dewi Lestari mengajukan lembar timesheet 28 jam untuk periode riset Oktober 2026.",
      type: "ACTION_REQUIRED",
      category: "SYSTEM",
      link: "/timesheet",
      isRead: false,
    },
    {
      userId: vindaUser?.id,
      title: "Peringatan Kedaluwarsa Lisensi Software",
      message:
        "Lisensi Canva Pro for Nonprofits akan berakhir dalam 14 hari. Mohon periksa pengajuan perpanjangan.",
      type: "WARNING",
      category: "SYSTEM",
      link: "/lisensi",
      isRead: false,
    },
  ];

  for (const notif of notificationsToCreate) {
    if (!notif.userId) continue;
    const existing = await prisma.notification.findFirst({
      where: { userId: notif.userId, title: notif.title },
    });
    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: notif.userId,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          category: notif.category,
          link: notif.link,
          isRead: notif.isRead,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 13. AUDIT LOGS & KALENDER LEMBAGA
  // ---------------------------------------------------------------------------
  console.log("📜 [13/13] Menyiapkan log audit aktivitas & kalender lembaga...");

  // Kalender Lembaga Tambahan
  const newCalendarEvents = [
    {
      title: "Rapat Pleno Riset & Kebijakan Bulanan PSPK",
      description: "Konsolidasi capaian riset bulanan seluruh inisiatif (Katalis, LDB, LSKP, Pemantik).",
      startAt: new Date("2026-10-20T02:00:00Z"), // 09:00 WIB
      endAt: new Date("2026-10-20T04:30:00Z"), // 11:30 WIB
      type: "MEETING" as CalendarEventType,
      source: "HRIS_SYSTEM" as CalendarEventSource,
      meetUrl: "https://meet.google.com/pspk-pleno-okt26",
    },
    {
      title: "Town Hall & Refleksi Kuartal IV 2026",
      description: "Pertemuan seluruh jajaran direksi, staf, dan tim riset PSPK.",
      startAt: new Date("2026-11-06T06:30:00Z"), // 13:30 WIB
      endAt: new Date("2026-11-06T09:00:00Z"), // 16:00 WIB
      type: "MEETING" as CalendarEventType,
      source: "HRIS_SYSTEM" as CalendarEventSource,
      meetUrl: "https://meet.google.com/pspk-townhall-q4",
    },
  ];

  for (const ce of newCalendarEvents) {
    const existing = await prisma.calendarEvent.findFirst({ where: { title: ce.title } });
    if (!existing) {
      await prisma.calendarEvent.create({ data: ce });
    }
  }

  // Audit Logs Tambahan untuk riwayat
  const sampleAuditEvents = [
    {
      actorEmail: "superadmin@pspk.id",
      app: "hris",
      action: "PUBLISH",
      entityType: "PayrollPeriod",
      entityId: sepPeriod.id,
      occurredAt: new Date("2026-09-26T10:00:00Z"),
      after: { period: "September 2026", status: "PUBLISHED" },
    },
    {
      actorEmail: "jody@pspk.id",
      app: "hris",
      action: "APPROVE",
      entityType: "TimesheetSubmission",
      entityId: "ts-dewi-sep-2026",
      occurredAt: new Date("2026-09-25T15:00:00Z"),
      after: { totalHours: 42.5, status: "APPROVED" },
    },
    {
      actorEmail: "it.admin@pspk.id",
      app: "sysmgmt",
      action: "ASSIGN",
      entityType: "Asset",
      entityId: "AST-IT-2025-005",
      occurredAt: new Date("2026-06-01T09:00:00Z"),
      after: { assetTag: "AST-IT-2025-005", assignee: "Rina Cahyani, S.Pd." },
    },
    {
      actorEmail: "hr@pspk.id",
      app: "hris",
      action: "UPDATE",
      entityType: "LeaveBalance",
      entityId: "leave-balances-2026",
      occurredAt: new Date("2026-01-05T08:30:00Z"),
      after: { year: 2026, status: "ALLOCATED" },
    },
  ];

  for (const al of sampleAuditEvents) {
    const existing = await prisma.auditLog.findFirst({
      where: {
        entityType: al.entityType,
        entityId: al.entityId,
        action: al.action,
      },
    });
    if (!existing) {
      await prisma.auditLog.create({
        data: {
          actorEmail: al.actorEmail,
          app: al.app,
          action: al.action,
          entityType: al.entityType,
          entityId: al.entityId,
          occurredAt: al.occurredAt,
          after: al.after,
        },
      });
    }
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

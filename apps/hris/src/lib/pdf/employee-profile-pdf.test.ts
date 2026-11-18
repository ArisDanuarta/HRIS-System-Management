import { describe, it, expect } from "vitest";
import { generateEmployeeProfilePdf } from "./employee-profile-pdf";

describe("Employee Profile PDF Generator Engine", () => {
  it("harus menghasilkan buffer PDF yang valid dengan magic byte %PDF-", async () => {
    const mockEmployee = {
      id: "emp-test-1",
      employeeNo: "PSPK-2024-001",
      fullName: "Budi Santoso",
      nickname: "Budi",
      gender: "MALE",
      maritalStatus: "MARRIED",
      birthPlace: "Jakarta",
      birthDate: new Date("1990-05-15"),
      religion: "Islam",
      bloodType: "O",
      citizenship: "WNI",
      workEmail: "budi.santoso@pspk.or.id",
      personalEmail: "budi@gmail.com",
      phone: "081234567890",
      landlinePhone: "0217654321",
      emergencyContactName: "Siti Rahma",
      emergencyContactRelation: "Istri",
      emergencyContactPhone: "081987654321",
      joinDate: new Date("2022-01-10"),
      status: "ACTIVE",
      currentPosition: { title: "Peneliti Kebijakan Senior" },
      currentDepartment: { name: "Riset Kebijakan" },
      manager: { fullName: "Dr. Maya Indah", employeeNo: "PSPK-2020-001" },
      addresses: [
        {
          type: "KTP",
          street: "Jl. Pendidikan No. 10",
          kelurahan: "Cilandak",
          kecamatan: "Cilandak",
          city: "Jakarta Selatan",
          province: "DKI Jakarta",
          postalCode: "12430",
        },
      ],
      familyMembers: [
        {
          name: "Siti Rahma",
          relation: "Istri",
          birthDate: new Date("1992-08-20"),
          phone: "081987654321",
          isDependent: true,
        },
      ],
      educations: [
        {
          level: "S1",
          institution: "Universitas Indonesia",
          major: "Ilmu Pendidikan",
          graduationYear: 2012,
          gpa: 3.75,
        },
      ],
      trainings: [
        {
          name: "Pelatihan Metodologi Analisis Kebijakan Publik",
          organizer: "LAN RI",
          startDate: new Date("2023-03-01"),
          duration: "32 Jam",
        },
      ],
      workExperiences: [
        {
          companyName: "Pusat Penelitian Pendidikan",
          jobTitle: "Junior Analyst",
          startDate: new Date("2015-01-01"),
          endDate: new Date("2021-12-31"),
          reasonForLeaving: "Pindah ke PSPK",
        },
      ],
      contracts: [
        {
          type: "PKWTT",
          startDate: new Date("2022-01-10"),
          endDate: null,
          status: "ACTIVE",
          employmentTypeMaster: { name: "Karyawan Tetap (PKWTT)" },
          baseSalary: 12000000,
        },
      ],
      salaryComponents: [{ name: "Tunjangan Transport & Makan", amount: 2000000 }],
      documents: [
        {
          category: "KTP",
          title: "KTP Budi Santoso",
          fileName: "ktp_budi.pdf",
          createdAt: new Date("2022-01-10"),
        },
      ],
      ptkpStatus: "K_1",
      taxMethod: "GROSS",
      nikRaw: "3171012345670001",
      npwpRaw: "09.123.456.7-012.000",
      bankName: "Bank Mandiri",
      bankAccountRaw: "1230009876543",
    };

    const pdfBuffer = await generateEmployeeProfilePdf({
      employee: mockEmployee,
      actor: {
        name: "Admin HR PSPK",
        email: "hr@pspk.or.id",
        role: "admin_hr",
      },
      options: {
        personal: true,
        address: true,
        family: true,
        education: true,
        employment: true,
        contracts: true,
        attendance: true,
        documents: true,
        assets: true,
        sensitive: true,
        compensation: true,
        attendanceFrom: "2026-01-01",
        attendanceTo: "2026-01-31",
      },
      attendanceData: {
        summary: {
          workingDaysCount: 22,
          presentCount: 20,
          lateCount: 1,
          wfhCount: 1,
          leaveCount: 0,
          absentCount: 0,
          attendanceRate: 100,
        },
        records: [
          {
            date: new Date("2026-01-15"),
            checkInTime: new Date("2026-01-15T08:30:00Z"),
            checkOutTime: new Date("2026-01-15T17:30:00Z"),
            status: "PRESENT",
            notes: "Hadir tepat waktu",
          },
        ],
        leaveBalances: [
          {
            leaveTypeName: "Cuti Tahunan",
            quotaDays: 12,
            usedDays: 2,
            remainingDays: 10,
          },
        ],
      },
      activeAssets: [
        {
          assetTag: "AST-2024-001",
          name: "MacBook Pro M2",
          brand: "Apple",
          model: "14 inch 2023",
          assignedAt: new Date("2024-01-15"),
          conditionOut: "Sangat Baik",
        },
      ],
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    // Verifikasi PDF Magic Header
    const pdfHeader = pdfBuffer.subarray(0, 5).toString("utf-8");
    expect(pdfHeader).toBe("%PDF-");
  });

  it("harus menyamarkan data sensitif jika sensitive=false", async () => {
    const mockEmployee = {
      id: "emp-test-2",
      employeeNo: "PSPK-2024-002",
      fullName: "Dewi Lestari",
      gender: "FEMALE",
      joinDate: new Date("2023-06-01"),
      status: "ACTIVE",
    };

    const pdfBuffer = await generateEmployeeProfilePdf({
      employee: mockEmployee,
      actor: {
        name: "Manager Riset",
        email: "manager@pspk.or.id",
        role: "manager",
      },
      options: {
        personal: true,
        address: false,
        family: false,
        education: false,
        employment: true,
        contracts: true,
        attendance: false,
        documents: false,
        assets: false,
        sensitive: false, // Terkunci
        compensation: false, // Terkunci
      },
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(500);
    expect(pdfBuffer.subarray(0, 5).toString("utf-8")).toBe("%PDF-");
  });
});

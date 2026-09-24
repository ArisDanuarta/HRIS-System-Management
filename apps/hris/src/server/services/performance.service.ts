import { prisma } from "@pspk/db";
import {
  CreatePerformancePeriodInput,
  FinalizePerformanceReviewInput,
} from "../schemas/performance.schema";

/**
 * Membuat periode evaluasi kinerja baru dan menginisialisasi review
 * untuk seluruh pegawai aktif di organisasi PSPK.
 */
export async function createPerformancePeriod(input: CreatePerformancePeriodInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buat record periode
    const period = await tx.performancePeriod.create({
      data: {
        name: input.name,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        status: input.status,
      },
    });

    // 2. Ambil seluruh karyawan aktif
    const activeEmployees = await tx.employee.findMany({
      where: {
        status: { in: ["ACTIVE", "PROBATION"] },
        deletedAt: null,
      },
      select: {
        id: true,
        managerId: true,
      },
    });

    // Cari fallback reviewer jika ada karyawan yang belum punya atasan langsung
    const defaultManager = await tx.employee.findFirst({
      where: {
        currentPosition: {
          title: { contains: "Kepala", mode: "insensitive" },
        },
      },
      select: { id: true },
    });

    // 3. Buat kerangka review (DRAFT) untuk tiap karyawan aktif
    if (activeEmployees.length > 0) {
      const fallbackReviewerId = defaultManager?.id || activeEmployees[0]!.id;

      await tx.performanceReview.createMany({
        data: activeEmployees.map((emp) => ({
          periodId: period.id,
          employeeId: emp.id,
          reviewerId: emp.managerId || fallbackReviewerId,
          status: "DRAFT",
        })),
        skipDuplicates: true,
      });
    }

    return period;
  });
}

/**
 * Memperbarui status siklus periode evaluasi (OPEN / CLOSED)
 */
export async function updatePerformancePeriodStatus(id: string, status: "OPEN" | "CLOSED") {
  const period = await prisma.performancePeriod.findUnique({
    where: { id },
  });

  if (!period) {
    throw new Error("Periode evaluasi tidak ditemukan");
  }

  return await prisma.performancePeriod.update({
    where: { id },
    data: { status },
  });
}

/**
 * Finalisasi penilaian kinerja seorang pegawai oleh Admin HR / Pimpinan
 */
export async function finalizePerformanceReview(input: FinalizePerformanceReviewInput) {
  const review = await prisma.performanceReview.findUnique({
    where: { id: input.reviewId },
    include: {
      employee: { select: { fullName: true } },
      period: { select: { name: true } },
    },
  });

  if (!review) {
    throw new Error("Data evaluasi kinerja tidak ditemukan");
  }

  return await prisma.performanceReview.update({
    where: { id: input.reviewId },
    data: {
      finalScore: input.finalScore,
      managerComment: input.managerComment !== undefined ? input.managerComment : review.managerComment,
      status: "FINALIZED",
    },
  });
}

/**
 * Menghasilkan data ekspor rekap kinerja dalam format CSV
 */
export async function generatePerformanceExportCsv(periodId: string): Promise<{ filename: string; content: string }> {
  const period = await prisma.performancePeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) {
    throw new Error("Periode evaluasi tidak ditemukan");
  }

  const reviews = await prisma.performanceReview.findMany({
    where: { periodId },
    include: {
      employee: {
        select: {
          employeeNo: true,
          fullName: true,
          workEmail: true,
          currentPosition: { select: { title: true } },
          currentDepartment: { select: { name: true } },
        },
      },
      reviewer: {
        select: {
          fullName: true,
          currentPosition: { select: { title: true } },
        },
      },
    },
    orderBy: { employee: { fullName: "asc" } },
  });

  const headers = [
    "No",
    "NIP",
    "Nama Pegawai",
    "Email",
    "Divisi",
    "Jabatan",
    "Atasan Penilai",
    "Skor Mandiri",
    "Skor Atasan",
    "Skor Akhir",
    "Predikat",
    "Status Review",
  ];

  const rows = reviews.map((r, idx) => {
    const finalScore = r.finalScore ? Number(r.finalScore) : null;
    let predicate = "-";
    if (finalScore !== null) {
      if (finalScore >= 90) predicate = "Sangat Baik";
      else if (finalScore >= 80) predicate = "Baik";
      else if (finalScore >= 70) predicate = "Cukup";
      else predicate = "Perlu Perbaikan";
    }

    return [
      idx + 1,
      `"${r.employee.employeeNo}"`,
      `"${r.employee.fullName.replace(/"/g, '""')}"`,
      `"${r.employee.workEmail || "-"}"`,
      `"${r.employee.currentDepartment?.name || "-"}"`,
      `"${r.employee.currentPosition?.title || "-"}"`,
      `"${r.reviewer ? r.reviewer.fullName.replace(/"/g, '""') : "-"}"`,
      r.selfScore ? Number(r.selfScore) : "-",
      r.managerScore ? Number(r.managerScore) : "-",
      finalScore !== null ? finalScore : "-",
      `"${predicate}"`,
      `"${r.status}"`,
    ].join(",");
  });

  const sanitizedPeriodName = period.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const filename = `rekap-kinerja-${sanitizedPeriodName}.csv`;
  const content = [headers.join(","), ...rows].join("\n");

  return { filename, content };
}

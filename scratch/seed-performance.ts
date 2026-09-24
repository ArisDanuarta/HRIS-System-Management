import { prisma } from "../packages/db/src";

async function main() {
  console.log("🌱 Menyiapkan seed data modul Kinerja & Riset PSPK...");

  // 1. Cek atau buat periode evaluasi aktif
  let period = await prisma.performancePeriod.findFirst({
    where: { name: "Semester Ganjil 2026 — Riset & Advokasi Kebijakan" },
  });

  if (!period) {
    period = await prisma.performancePeriod.create({
      data: {
        name: "Semester Ganjil 2026 — Riset & Advokasi Kebijakan",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-12-31"),
        status: "OPEN",
      },
    });
    console.log("✅ Periode dibuat:", period.name);
  } else {
    console.log("ℹ️ Periode sudah ada:", period.name);
  }

  // 2. Ambil pegawai-pegawai kunci
  const budi = await prisma.employee.findFirst({
    where: { fullName: { contains: "Budi Rahardjo" } },
  });

  const siti = await prisma.employee.findFirst({
    where: { fullName: { contains: "Siti Aminah" } },
  });

  const wirawan = await prisma.employee.findFirst({
    where: { fullName: { contains: "Wirawan" } },
  });

  const anisa = await prisma.employee.findFirst({
    where: { fullName: { contains: "Anisa Larasati" } },
  });

  const dewi = await prisma.employee.findFirst({
    where: { fullName: { contains: "Dewi Permata" } },
  });

  const reviewerId = budi?.id || siti?.id || "fallback";

  // 3. Setup Review & Goals untuk Siti Aminah (FINALIZED)
  if (siti && reviewerId) {
    await prisma.performanceReview.upsert({
      where: {
        employeeId_periodId: {
          employeeId: siti.id,
          periodId: period.id,
        },
      },
      update: {
        reviewerId: budi?.id || reviewerId,
        selfScore: 88,
        managerScore: 90,
        finalScore: 89,
        selfComment:
          "Target penyusunan policy brief tercapai tuntas dengan masukan stakeholder daerah 3T. Forum advokasi terlaksana 3 dari 4 kali karena penyesuaian jadwal dinas.",
        managerComment:
          "Kinerja riset sangat solid dan berdampak nyata bagi advokasi kebijakan kurikulum daerah. Pertahankan kecepatan analisis dan ketajaman metodologi.",
        status: "FINALIZED",
      },
      create: {
        employeeId: siti.id,
        periodId: period.id,
        reviewerId: budi?.id || reviewerId,
        selfScore: 88,
        managerScore: 90,
        finalScore: 89,
        selfComment:
          "Target penyusunan policy brief tercapai tuntas dengan masukan stakeholder daerah 3T. Forum advokasi terlaksana 3 dari 4 kali karena penyesuaian jadwal dinas.",
        managerComment:
          "Kinerja riset sangat solid dan berdampak nyata bagi advokasi kebijakan kurikulum daerah. Pertahankan kecepatan analisis dan ketajaman metodologi.",
        status: "FINALIZED",
      },
    });

    // Goals Siti Aminah
    await prisma.performanceGoal.deleteMany({
      where: { employeeId: siti.id, periodId: period.id },
    });
    await prisma.performanceGoal.createMany({
      data: [
        {
          employeeId: siti.id,
          periodId: period.id,
          title: "Penyusunan Policy Brief Evaluasi Kurikulum Merdeka Daerah 3T",
          description: "Riset empiris dan naskah rekomendasi kebijakan berbasis data lapangan",
          weight: 40,
          target: "2 Naskah Policy Brief",
          unit: "Dokumen",
          actual: "2 Naskah Final",
        },
        {
          employeeId: siti.id,
          periodId: period.id,
          title: "Audiensi Advokasi Kebijakan dengan BPMP & Dinas Pendidikan",
          description: "Diseminasi temuan evaluasi dan fasilitasi dialog multi-pihak",
          weight: 30,
          target: "4 Forum Advokasi",
          unit: "Forum",
          actual: "3 Forum Terlaksana",
        },
        {
          employeeId: siti.id,
          periodId: period.id,
          title: "Publikasi Opini/Kajian Riset di Media Massa Terverifikasi",
          description: "Peningkatan literasi publik terkait pemerataan kualitas pembelajaran",
          weight: 30,
          target: "2 Artikel Media",
          unit: "Artikel",
          actual: "2 Artikel Terbit",
        },
      ],
    });
    console.log("✅ Data Kinerja Siti Aminah (FINALIZED) siap.");
  }

  // 4. Setup Review & Goals untuk Made Wirawan (MANAGER_REVIEW)
  if (wirawan && reviewerId) {
    await prisma.performanceReview.upsert({
      where: {
        employeeId_periodId: {
          employeeId: wirawan.id,
          periodId: period.id,
        },
      },
      update: {
        reviewerId: budi?.id || reviewerId,
        selfScore: 85,
        managerScore: 88,
        finalScore: null,
        selfComment:
          "Pengumpulan data wawancara mendalam di 15 sekolah terlaksana tepat waktu. Draf sintesis riset kualitatif telah selesai dan memasuki review internal.",
        managerComment:
          "Dedikasi dan ketelitian pengumpulan data lapangan sangat tinggi. Draf sintesis perlu diperkuat pada rekomendasi kebijakan praktis.",
        status: "MANAGER_REVIEW",
      },
      create: {
        employeeId: wirawan.id,
        periodId: period.id,
        reviewerId: budi?.id || reviewerId,
        selfScore: 85,
        managerScore: 88,
        finalScore: null,
        selfComment:
          "Pengumpulan data wawancara mendalam di 15 sekolah terlaksana tepat waktu. Draf sintesis riset kualitatif telah selesai dan memasuki review internal.",
        managerComment:
          "Dedikasi dan ketelitian pengumpulan data lapangan sangat tinggi. Draf sintesis perlu diperkuat pada rekomendasi kebijakan praktis.",
        status: "MANAGER_REVIEW",
      },
    });

    await prisma.performanceGoal.deleteMany({
      where: { employeeId: wirawan.id, periodId: period.id },
    });
    await prisma.performanceGoal.createMany({
      data: [
        {
          employeeId: wirawan.id,
          periodId: period.id,
          title: "Pengumpulan Data Lapangan Program Penguatan Karakter",
          description: "Wawancara mendalam dengan kepala sekolah, guru, dan perwakilan komite",
          weight: 50,
          target: "15 Sekolah",
          unit: "Sekolah",
          actual: "15 Sekolah Selesai",
        },
        {
          employeeId: wirawan.id,
          periodId: period.id,
          title: "Penyusunan Transkrip Kualitatif & Analisis Tematik",
          description: "Koding tematik dan sintesis temuan wawancara",
          weight: 30,
          target: "1 Laporan Sintesis",
          unit: "Laporan",
          actual: "Draf Pertama Selesai",
        },
        {
          employeeId: wirawan.id,
          periodId: period.id,
          title: "Fasilitasi Lokakarya Penguatan Komunitas Belajar Guru",
          description: "Pendampingan fasilitasi guru penggerak di daerah kemitraan",
          weight: 20,
          target: "2 Lokakarya",
          unit: "Kegiatan",
          actual: "2 Lokakarya Terlaksana",
        },
      ],
    });
    console.log("✅ Data Kinerja Made Wirawan (MANAGER_REVIEW) siap.");
  }

  // 5. Setup Review & Goals untuk Anisa Larasati (SELF_REVIEW)
  if (anisa && reviewerId) {
    await prisma.performanceReview.upsert({
      where: {
        employeeId_periodId: {
          employeeId: anisa.id,
          periodId: period.id,
        },
      },
      update: {
        reviewerId: budi?.id || reviewerId,
        selfScore: 92,
        selfComment:
          "Seluruh laporan pertanggungjawaban hibah riset dan rekonsiliasi pajak semester ini terselesaikan tepat waktu tanpa temuan audit.",
        status: "SELF_REVIEW",
      },
      create: {
        employeeId: anisa.id,
        periodId: period.id,
        reviewerId: budi?.id || reviewerId,
        selfScore: 92,
        selfComment:
          "Seluruh laporan pertanggungjawaban hibah riset dan rekonsiliasi pajak semester ini terselesaikan tepat waktu tanpa temuan audit.",
        status: "SELF_REVIEW",
      },
    });

    await prisma.performanceGoal.deleteMany({
      where: { employeeId: anisa.id, periodId: period.id },
    });
    await prisma.performanceGoal.createMany({
      data: [
        {
          employeeId: anisa.id,
          periodId: period.id,
          title: "Pelaporan Keuangan Proyek Riset Hibah Mitra Donor Tepat Waktu",
          description: "Kompilasi bukti pengeluaran dan laporan realisasi anggaran",
          weight: 40,
          target: "100% On-time",
          unit: "%",
          actual: "100%",
        },
        {
          employeeId: anisa.id,
          periodId: period.id,
          title: "Kepatuhan Pajak Lembaga & Pemotongan PPh 21 Sesuai Regulasi",
          description: "Pelaporan SPT berkala dan rekonsiliasi bukti potong",
          weight: 35,
          target: "Nihil Denda",
          unit: "Status",
          actual: "Selesai",
        },
        {
          employeeId: anisa.id,
          periodId: period.id,
          title: "Digitalisasi Arsip Keuangan & Otomasi Rekapitulasi Kas",
          description: "Peningkatan efisiensi pencarian berkas audit keuangan",
          weight: 25,
          target: "100% Terindeks",
          unit: "%",
          actual: "80%",
        },
      ],
    });
    console.log("✅ Data Kinerja Anisa Larasati (SELF_REVIEW) siap.");
  }

  // 6. Inisialisasi sisa karyawan aktif yang belum punya review ke status DRAFT
  const allEmployees = await prisma.employee.findMany({
    where: { status: { in: ["ACTIVE", "PROBATION"] }, deletedAt: null },
  });

  for (const emp of allEmployees) {
    await prisma.performanceReview.upsert({
      where: {
        employeeId_periodId: {
          employeeId: emp.id,
          periodId: period.id,
        },
      },
      update: {},
      create: {
        employeeId: emp.id,
        periodId: period.id,
        reviewerId: emp.managerId || budi?.id || emp.id,
        status: "DRAFT",
      },
    });
  }

  console.log("🎉 Seeding modul Kinerja & Riset berhasil diselesaikan!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding performance:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

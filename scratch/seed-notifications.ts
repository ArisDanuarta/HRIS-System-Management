import { prisma } from "../packages/db/src";

async function main() {
  console.log("🔔 Menyiapkan seed data notifikasi in-app untuk seluruh role...");

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
  });

  const userMap = new Map(users.map((u) => [u.email, u.id]));

  // 1. Notifikasi untuk Admin HR (admin@pspk.example & hr@pspk.id)
  const hrUserIds = [userMap.get("admin@pspk.example"), userMap.get("hr@pspk.id")].filter(
    Boolean
  ) as string[];

  for (const uid of hrUserIds) {
    await prisma.notification.deleteMany({ where: { userId: uid } });
    await prisma.notification.createMany({
      data: [
        {
          userId: uid,
          title: "Pengajuan Cuti Baru",
          message: "I Made Wirawan mengajukan Cuti Tahunan selama 3 hari (28–30 September 2026).",
          type: "ACTION_REQUIRED",
          category: "LEAVE",
          link: "/cuti/persetujuan",
          isRead: false,
          createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 menit lalu
        },
        {
          userId: uid,
          title: "Pengingat Berakhirnya Kontrak",
          message: "Kontrak PKWT Siti Aminah, S.Sos. akan berakhir dalam 25 hari (15 Oktober 2026).",
          type: "WARNING",
          category: "CONTRACT",
          link: "/karyawan",
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 jam lalu
        },
        {
          userId: uid,
          title: "Evaluasi Diri Riset Selesai",
          message: "Siti Aminah telah mengisi capaian evaluasi mandiri semester ini.",
          type: "INFO",
          category: "PERFORMANCE",
          link: "/kinerja",
          isRead: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 hari lalu
        },
        {
          userId: uid,
          title: "Penggajian Selesai Dihitung",
          message: "Perhitungan kalkulasi massal payroll periode September 2026 siap ditinjau.",
          type: "SUCCESS",
          category: "PAYROLL",
          link: "/payroll",
          isRead: true,
          createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000), // Kemarin
        },
      ],
    });
  }

  // 2. Notifikasi untuk Manager (manajer@pspk.id)
  const managerId = userMap.get("manajer@pspk.id");
  if (managerId) {
    await prisma.notification.deleteMany({ where: { userId: managerId } });
    await prisma.notification.createMany({
      data: [
        {
          userId: managerId,
          title: "Menunggu Review Kinerja Tim",
          message: "I Made Wirawan telah mengajukan evaluasi mandiri. Harap berikan skor & umpan balik atasan.",
          type: "ACTION_REQUIRED",
          category: "PERFORMANCE",
          link: "/kinerja",
          isRead: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
        },
        {
          userId: managerId,
          title: "Permohonan Cuti Anggota Tim",
          message: "I Made Wirawan mengajukan Cuti Tahunan selama 3 hari.",
          type: "ACTION_REQUIRED",
          category: "LEAVE",
          link: "/cuti/persetujuan",
          isRead: false,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
      ],
    });
  }

  // 3. Notifikasi untuk Staf Umum (staf@pspk.id)
  const staffId = userMap.get("staf@pspk.id");
  if (staffId) {
    await prisma.notification.deleteMany({ where: { userId: staffId } });
    await prisma.notification.createMany({
      data: [
        {
          userId: staffId,
          title: "Pengajuan Cuti Disetujui",
          message: "Permohonan Cuti Tahunan Anda telah DISETUJUI oleh Dr. Budi Rahardjo, M.Ed.",
          type: "SUCCESS",
          category: "LEAVE",
          link: "/cuti",
          isRead: false,
          createdAt: new Date(Date.now() - 45 * 60 * 1000),
        },
        {
          userId: staffId,
          title: "Slip Gaji Telah Terbit",
          message: "Slip gaji resmi periode September 2026 Anda telah diterbitkan dan dapat diunduh.",
          type: "SUCCESS",
          category: "PAYROLL",
          link: "/payroll",
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
        {
          userId: staffId,
          title: "Siklus Kinerja Semester Dibuka",
          message: "Periode evaluasi kinerja Semester Ganjil 2026 telah dibuka oleh HR. Harap menyusun sasaran riset.",
          type: "INFO",
          category: "PERFORMANCE",
          link: "/kinerja",
          isRead: true,
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
      ],
    });
  }

  console.log("✅ Seed notifikasi berhasil dibuat untuk seluruh role!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding notifications:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { prisma } from "../packages/db/src";
import {
  createDepartment,
  createPosition,
  deleteDepartment,
  deletePosition,
  transferEmployeePosition,
} from "../apps/hris/src/server/services/organization.service";

async function main() {
  console.log("🚀 Menjalankan pengujian otomatis: Struktur Organisasi & Mutasi Pegawai...");

  const testActor = {
    id: "system-test-actor",
    email: "hr@pspk.id",
    ip: "127.0.0.1",
    userAgent: "Automated-Test-Runner",
  };

  // 1. Uji Tambah Divisi Baru
  const testDeptName = `Unit Riset AI & EduTech ${Date.now()}`;
  console.log(`1. Membuat Divisi Baru: "${testDeptName}"...`);
  const createdDept = await createDepartment({ name: testDeptName }, testActor);
  console.log(`   ✓ Divisi berhasil dibuat dengan ID: ${createdDept.id}`);

  // 2. Uji Tambah Jabatan Baru
  const testPosTitle = `Lead AI Researcher ${Date.now()}`;
  console.log(`2. Membuat Formasi Jabatan Baru: "${testPosTitle}"...`);
  const createdPos = await createPosition(
    { title: testPosTitle, departmentId: createdDept.id },
    testActor,
  );
  console.log(`   ✓ Jabatan berhasil dibuat dengan ID: ${createdPos.id}`);

  // 3. Ambil salah satu pegawai aktif untuk pengujian mutasi
  const employee = await prisma.employee.findFirst({
    where: { status: "ACTIVE", deletedAt: null },
    include: { currentDepartment: true, currentPosition: true },
  });

  if (!employee) {
    throw new Error("Tidak ditemukan pegawai aktif di database untuk pengujian mutasi.");
  }

  console.log(`3. Melakukan Mutasi Pegawai: ${employee.fullName} (${employee.employeeNo})...`);
  const originalDeptId = employee.currentDepartmentId;
  const originalPosId = employee.currentPositionId;
  const originalManagerId = employee.managerId;

  const transferResult = await transferEmployeePosition(
    {
      employeeId: employee.id,
      departmentId: createdDept.id,
      positionId: createdPos.id,
      managerId: null,
      effectiveDate: "2026-09-24",
      transferType: "PROMOTION",
      skNumber: "SK/DIR/999/TEST",
      notes: "Pengujian mutasi promosi otomatis",
    },
    testActor,
  );

  console.log("   ✓ Mutasi berhasil dieksekusi!");
  console.log(
    `   - Posisi Baru: ${transferResult.updatedEmployee.currentPosition?.title} di ${transferResult.updatedEmployee.currentDepartment?.name}`,
  );
  console.log(`   - Catatan Riwayat: ${transferResult.newHistory.notes}`);

  // 4. Uji Proteksi Hapus: Coba hapus jabatan yang sedang diduduki pegawai (HARUS DITOLAK)
  console.log("4. Pengujian Proteksi: Mencoba menghapus jabatan yang sedang aktif diduduki...");
  try {
    await deletePosition(createdPos.id, testActor);
    console.error("   ❌ ERROR: Seharusnya gagal menghapus jabatan yang memiliki pegawai aktif!");
    process.exit(1);
  } catch (err: any) {
    console.log(`   ✓ Proteksi Berhasil! Penolakan: "${err.message}"`);
  }

  // 5. Uji Proteksi Hapus: Coba hapus divisi yang memiliki pegawai aktif (HARUS DITOLAK)
  console.log("5. Pengujian Proteksi: Mencoba menghapus divisi yang memiliki pegawai aktif...");
  try {
    await deleteDepartment(createdDept.id, testActor);
    console.error("   ❌ ERROR: Seharusnya gagal menghapus divisi yang memiliki pegawai aktif!");
    process.exit(1);
  } catch (err: any) {
    console.log(`   ✓ Proteksi Berhasil! Penolakan: "${err.message}"`);
  }

  // 6. Kembalikan posisi pegawai ke awal (Rollback status pegawai)
  console.log("6. Mengembalikan posisi pegawai ke formasi awal...");
  await prisma.employee.update({
    where: { id: employee.id },
    data: {
      currentDepartmentId: originalDeptId,
      currentPositionId: originalPosId,
      managerId: originalManagerId,
    },
  });

  // Hapus history test tadi
  await prisma.employmentHistory.delete({
    where: { id: transferResult.newHistory.id },
  });

  // Buka kembali history lama jika sebelumnya ditutup
  const latestHist = await prisma.employmentHistory.findFirst({
    where: { employeeId: employee.id },
    orderBy: { startDate: "desc" },
  });
  if (latestHist) {
    await prisma.employmentHistory.update({
      where: { id: latestHist.id },
      data: { endDate: null },
    });
  }

  // 7. Bersihkan jabatan dan divisi test setelah pegawai dipindahkan kembali
  console.log("7. Membersihkan formasi dan divisi uji coba...");
  await deletePosition(createdPos.id, testActor);
  console.log("   ✓ Jabatan test berhasil dihapus.");
  await deleteDepartment(createdDept.id, testActor);
  console.log("   ✓ Divisi test berhasil dihapus.");

  console.log("\n========================================================");
  console.log("🎉 SELURUH PENGUJIAN INTEGRASI STRUKTUR ORGANISASI & MUTASI LOLOS!");
  console.log("========================================================");
}

main()
  .catch((e) => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

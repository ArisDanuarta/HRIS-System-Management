import { prisma } from "@pspk/db";
import {
  calculatePeriodPayroll,
  updatePayslipTimesheet,
} from "../apps/hris/src/server/services/payroll.service";

async function main() {
  console.log("🚀 Menjalankan pengujian fungsional Payroll Timesheet PKWT...");

  // 1. Cek profil & kontrak Aris
  const aris = await prisma.employee.findFirst({
    where: { workEmail: "aris@pspk.id" },
    include: {
      contracts: {
        where: { status: "ACTIVE" },
        take: 1,
      },
    },
  });

  if (!aris) throw new Error("Aris tidak ditemukan!");
  const contract = aris.contracts[0];
  console.log(`👤 Pegawai: ${aris.fullName} (${aris.employeeNo})`);
  console.log(`   Tipe Kontrak: ${contract?.type}, Skema Upah: ${contract?.wageType}, Tarif: Rp ${Number(contract?.hourlyRate || 0)}/jam`);

  if (contract?.wageType !== "HOURLY" || Number(contract?.hourlyRate) !== 30000) {
    throw new Error("Kontrak Aris belum HOURLY atau tarif belum 30.000!");
  }

  // 2. Ambil atau buat periode September 2026
  let period = await prisma.payrollPeriod.findFirst({
    where: { year: 2026, month: 9, kind: "REGULAR" },
  });

  if (!period) {
    period = await prisma.payrollPeriod.create({
      data: {
        year: 2026,
        month: 9,
        kind: "REGULAR",
        status: "DRAFT",
      },
    });
  }

  // Set status DRAFT agar bisa dihitung ulang
  await prisma.payrollPeriod.update({
    where: { id: period.id },
    data: { status: "DRAFT" },
  });

  // 3. Kalkulasi awal (tanpa timesheet)
  console.log("⚙️ Menjalankan kalkulasi awal periode...");
  const calc1 = await calculatePeriodPayroll(period.id);
  console.log(`   Diproses: ${calc1.totalProcessed}, Total Net: Rp ${calc1.totalNet.toLocaleString("id-ID")}`);

  // Cek slip Aris sebelum timesheet
  const arisSlip1 = await prisma.payslip.findFirst({
    where: { periodId: period.id, employeeId: aris.id },
    include: { lines: true },
  });

  if (!arisSlip1) throw new Error("Slip Aris tidak ditemukan!");
  console.log(`   Slip Aris Awal: totalHours=${arisSlip1.totalHours}, Gross=Rp ${Number(arisSlip1.grossAmount)}, Net=Rp ${Number(arisSlip1.netAmount)}`);
  if (Number(arisSlip1.netAmount) !== 0) {
    throw new Error("Kebijakan 'No Work, No Pay' gagal! Netto harusnya 0 sebelum ada jam kerja terdeteksi.");
  }
  console.log("   ✓ Berhasil: Kebijakan 'No Work, No Pay' terbukti (Upah Rp 0 saat belum ada timesheet).");

  // 4. Update Timesheet: 120 jam @ Rp 30.000
  console.log("📝 Mengisi timesheet: 120 jam @ Rp 30.000...");
  const superAdmin = await prisma.user.findFirst({ where: { email: "superadmin@pspk.id" } });
  if (!superAdmin) throw new Error("Superadmin tidak ditemukan!");

  const updatedSlip = await updatePayslipTimesheet({
    payslipId: arisSlip1.id,
    totalHours: 120,
    hourlyRate: 30000,
    timesheetKey: "timesheets/test_aris_timesheet_202609.pdf",
    actor: {
      userId: superAdmin.id,
      email: superAdmin.email,
    },
  });

  console.log(`   Slip Aris Setelah Timesheet: totalHours=${updatedSlip.totalHours}, Gross=Rp ${Number(updatedSlip.grossAmount)}, Net=Rp ${Number(updatedSlip.netAmount)}`);
  if (Number(updatedSlip.grossAmount) !== 3600000 || Number(updatedSlip.netAmount) !== 3600000) {
    throw new Error(`Kalkulasi salah! Ekspektasi 3.600.000, didapat Gross=${updatedSlip.grossAmount}, Net=${updatedSlip.netAmount}`);
  }
  console.log("   ✓ Berhasil: 120 jam × Rp 30.000 = Rp 3.600.000 terhitung presisi!");

  // 5. Cek baris slip
  const updatedLines = await prisma.payslipLine.findMany({
    where: { payslipId: updatedSlip.id },
  });
  console.log("   Rincian Baris Slip Gaji Aris:");
  for (const l of updatedLines) {
    console.log(`     - [${l.type}] ${l.label}: Rp ${Number(l.amount).toLocaleString("id-ID")}`);
  }

  // 6. Cek Audit Log
  const lastAudit = await prisma.auditLog.findFirst({
    where: { entityType: "PayslipTimesheet", entityId: updatedSlip.id },
    orderBy: { createdAt: "desc" },
  });
  if (!lastAudit) throw new Error("Audit log update timesheet tidak tercatat!");
  console.log(`   ✓ Audit Log tercatat: Action=${lastAudit.action}, Entity=${lastAudit.entityType}, Actor=${lastAudit.actorEmail}`);

  // 7. Uji Rekalkulasi Massal: memastikan data timesheet Aris tidak hilang saat HR klik 'Hitung Ulang'
  console.log("🔄 Menguji hitung ulang massal periode (apakah timesheet tetap bertahan)...");
  await calculatePeriodPayroll(period.id);
  const arisSlip2 = await prisma.payslip.findFirst({
    where: { periodId: period.id, employeeId: aris.id },
  });
  if (Number(arisSlip2?.totalHours) !== 120 || Number(arisSlip2?.netAmount) !== 3600000) {
    throw new Error("Data timesheet hilang saat hitung ulang massal!");
  }
  console.log("   ✓ Berhasil: Data timesheet dan nominal Rp 3.600.000 tetap bertahan saat hitung ulang!");

  console.log("\n🎉 SELURUH PENGUJIAN PAYROLL TIMESHEET PKWT SUKSES BESAR (100% PASS)!");
}

main()
  .catch((e) => {
    console.error("❌ Test Gagal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

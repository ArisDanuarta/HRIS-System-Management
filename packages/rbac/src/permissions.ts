/**
 * PSPK Platform Permissions Definition
 * Format: <modul>.<resource>.<aksi>:<scope>
 * Scope: own | team | all
 */

export const PERMISSIONS = [
  // --- HRIS: Employee & Profile ---
  { key: "hris.employee.read:own", module: "hris", description: "Membaca profil karyawan sendiri" },
  { key: "hris.employee.read:team", module: "hris", description: "Membaca profil anggota tim" },
  { key: "hris.employee.read:all", module: "hris", description: "Membaca semua data karyawan" },
  { key: "hris.employee.write:own", module: "hris", description: "Memperbarui data pribadi terbatas sendiri" },
  { key: "hris.employee.write:all", module: "hris", description: "Mengelola seluruh data karyawan" },
  { key: "hris.employee.import:all", module: "hris", description: "Mengimpor data karyawan dari Excel" },

  // --- HRIS: Contracts & History ---
  { key: "hris.contract.read:own", module: "hris", description: "Membaca kontrak sendiri" },
  { key: "hris.contract.read:all", module: "hris", description: "Membaca seluruh kontrak kerja" },
  { key: "hris.contract.write:all", module: "hris", description: "Mengelola kontrak dan riwayat jabatan" },

  // --- HRIS: Attendance ---
  { key: "hris.attendance.read:own", module: "hris", description: "Membaca riwayat presensi sendiri" },
  { key: "hris.attendance.read:team", module: "hris", description: "Membaca riwayat presensi tim" },
  { key: "hris.attendance.read:all", module: "hris", description: "Membaca seluruh rekap presensi" },
  { key: "hris.attendance.checkin:own", module: "hris", description: "Melakukan check-in dan check-out" },
  { key: "hris.attendance.correct:all", module: "hris", description: "Melakukan koreksi presensi karyawan" },

  // --- HRIS: Leave ---
  { key: "hris.leave.read:own", module: "hris", description: "Membaca kuota dan riwayat cuti sendiri" },
  { key: "hris.leave.read:team", module: "hris", description: "Membaca kalender & pengajuan cuti tim" },
  { key: "hris.leave.read:all", module: "hris", description: "Membaca seluruh pengajuan cuti" },
  { key: "hris.leave.create:own", module: "hris", description: "Mengajukan cuti" },
  { key: "hris.leave.cancel:own", module: "hris", description: "Membatalkan pengajuan cuti sendiri" },
  { key: "hris.leave.approve:team", module: "hris", description: "Menyetujui atau menolak cuti tim" },
  { key: "hris.leave.approve:all", module: "hris", description: "Menyetujui atau menolak cuti (override HR)" },
  { key: "hris.leave.configure:all", module: "hris", description: "Mengonfigurasi jenis cuti, saldo & hari libur" },

  // --- HRIS: Payroll & Payslips ---
  { key: "hris.payslip.read:own", module: "hris", description: "Melihat dan mengunduh slip gaji sendiri" },
  { key: "hris.payroll.read:all", module: "hris", description: "Melihat rekap payroll organisasi" },
  { key: "hris.payroll.manage:all", module: "hris", description: "Mengelola periode, perhitungan & publikasi payroll" },

  // --- HRIS: Performance ---
  { key: "hris.performance.read:own", module: "hris", description: "Melihat sasaran & hasil kinerja sendiri" },
  { key: "hris.performance.read:team", module: "hris", description: "Melihat sasaran & kinerja tim" },
  { key: "hris.performance.read:all", module: "hris", description: "Melihat seluruh data kinerja organisasi" },
  { key: "hris.performance.review:own", module: "hris", description: "Mengisi penilaian mandiri (self-review)" },
  { key: "hris.performance.review:team", module: "hris", description: "Menilai kinerja anggota tim" },
  { key: "hris.performance.manage:all", module: "hris", description: "Mengelola periode & finalisasi kinerja" },

  // --- HRIS: Recruitment ---
  { key: "hris.recruitment.read:all", module: "hris", description: "Melihat lowongan & kandidat" },
  { key: "hris.recruitment.manage:all", module: "hris", description: "Mengelola proses rekrutmen & pelamar" },
  { key: "hris.recruitment.interview:team", module: "hris", description: "Mengisi catatan wawancara kandidat" },

  // --- HRIS: Training ---
  { key: "hris.training.read:own", module: "hris", description: "Melihat riwayat pelatihan sendiri" },
  { key: "hris.training.read:team", module: "hris", description: "Melihat riwayat pelatihan tim" },
  { key: "hris.training.read:all", module: "hris", description: "Melihat seluruh data pelatihan" },
  { key: "hris.training.manage:all", module: "hris", description: "Mengelola catatan pelatihan & sertifikasi" },

  // --- System Management: Core & Users ---
  { key: "sysmgmt.dashboard.read:all", module: "sysmgmt", description: "Melihat dashboard System Management" },
  { key: "sysmgmt.user.read:all", module: "sysmgmt", description: "Melihat daftar pengguna" },
  { key: "sysmgmt.user.manage:all", module: "sysmgmt", description: "Mengelola pengguna (undang, reset, aktifasi)" },
  { key: "sysmgmt.role.read:all", module: "sysmgmt", description: "Melihat peran dan matriks akses" },
  { key: "sysmgmt.role.manage:all", module: "sysmgmt", description: "Mengubah mapping permission peran" },

  // --- System Management: Assets & Licenses ---
  { key: "sysmgmt.asset.read:own", module: "sysmgmt", description: "Melihat aset yang dipegang sendiri" },
  { key: "sysmgmt.asset.read:all", module: "sysmgmt", description: "Melihat seluruh inventaris aset" },
  { key: "sysmgmt.asset.write:all", module: "sysmgmt", description: "Mengelola aset, serah terima & pengembalian" },
  { key: "sysmgmt.asset.import:all", module: "sysmgmt", description: "Mengimpor data aset dari Excel" },
  { key: "sysmgmt.license.read:all", module: "sysmgmt", description: "Melihat lisensi software" },
  { key: "sysmgmt.license.manage:all", module: "sysmgmt", description: "Mengelola lisensi software" },

  // --- System Management: Documents & SOPs ---
  { key: "sysmgmt.document.read:own", module: "sysmgmt", description: "Membaca dokumen publik / staf umum" },
  { key: "sysmgmt.document.read:team", module: "sysmgmt", description: "Membaca dokumen level manajer" },
  { key: "sysmgmt.document.read:all", module: "sysmgmt", description: "Membaca seluruh dokumen & SOP" },
  { key: "sysmgmt.document.manage:hr", module: "sysmgmt", description: "Mengelola dokumen kategori HR" },
  { key: "sysmgmt.document.manage:all", module: "sysmgmt", description: "Mengelola seluruh repositori dokumen & SOP" },

  // --- System Management: Audit Log ---
  { key: "sysmgmt.audit.read:all", module: "sysmgmt", description: "Melihat viewer audit log sistem" },
  { key: "sysmgmt.audit.export:all", module: "sysmgmt", description: "Mengekspor data audit log" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

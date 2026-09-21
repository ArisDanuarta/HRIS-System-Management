# Template Audit Data Existing (Excel & Aplikasi Pihak Ketiga)

Dokumen ini digunakan untuk memetakan sumber data sebelum migrasi data riil ke PSPK Platform.
**PERHATIAN: JANGAN PERNAH MENYIMPAN DATA PRIBADI/ASLI KARYAWAN KE DALAM GIT.**

---

## 1. Sumber Data Karyawan (Excel)
- **Nama File Sumber:** `Data_Karyawan_PSPK.xlsx` (contoh)
- **Lokasi Penyimpanan Asli:** Google Drive / Local HR
- **Format Kolom:**
  - Nama Lengkap → `hris.Employee.fullName`
  - Nomor Pegawai → `hris.Employee.employeeNo`
  - Email Kerja → `hris.Employee.workEmail`
  - NIK → `hris.Employee.nikEnc` (enkripsi AES-256)
  - NPWP → `hris.Employee.npwpEnc` (enkripsi AES-256)
  - Rekening Bank → `hris.Employee.bankAccountEnc` (enkripsi AES-256)
  - Tanggal Bergabung → `hris.Employee.joinDate`
  - Status Kepegawaian → `hris.Employee.status` (Tetap, Kontrak, Paruh Waktu)

## 2. Sumber Data Absensi & Cuti
- **Aplikasi / Spreadsheet Saat Ini:** Manual Form / Spreadsheet
- **Pemetaan:**
  - Saldo Cuti Tahunan → `hris.LeaveBalance`
  - Log Presensi Harian → `hris.Attendance`

## 3. Sumber Data Aset & Inventaris
- **Spreadsheet Inventaris:**
  - Kode Aset / Tag → `sysmgmt.Asset.assetTag`
  - Nama & Merek → `sysmgmt.Asset.name`, `sysmgmt.Asset.brand`
  - Pemegang Saat Ini → `sysmgmt.AssetAssignment`

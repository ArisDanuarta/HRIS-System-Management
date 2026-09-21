# Pertanyaan Terbuka & Keputusan Bisnis PSPK Platform

Dokumen ini mencatat pertanyaan terbuka yang perlu dikonfirmasi kepada pihak HR, Keuangan, atau IT Administrator PSPK sebelum modul terkait diimplementasikan.

| # | Pertanyaan | Dibutuhkan Sebelum | Status | Catatan / Jawaban |
|---|------------|--------------------|--------|-------------------|
| 1 | Domain/subdomain final, penyedia VPS, dan spesifikasi VPS? | Fase 5 | Terbuka | Menunggu keputusan deploy |
| 2 | Metode absensi: check-in web saja, geolokasi, atau impor dari mesin absensi? Jadwal kerja/jam masuk standar? | Fase 2 | Terbuka | Default web check-in waktu server |
| 3 | Kebijakan cuti: jenis, kuota, carry-over, aturan cuti bersama/hari libur nasional? | Fase 2 | Terbuka | Dummy: Cuti Tahunan 12 hari |
| 4 | Struktur organisasi & atasan: cukup satu tingkat approval, atau bertingkat? | Fase 2 | Terbuka | Default satu tingkat (managerId) |
| 5 | Format nomor pegawai dan nomor aset? | Fase 2/3 | Terbuka | Contoh: `PSPK-0042`, `LPT-0007` |
| 6 | Aturan payroll: komponen gaji/tunjangan/potongan, BPJS, PPh 21, tanggal cut-off, pembulatan, aturan THR, potongan cuti tak berbayar? | Fase 4 | Terbuka | Dikonfirmasi tertulis oleh HR sebelum Fase 4 |
| 7 | Hasil audit data existing: format Excel dan fungsi aplikasi pihak ketiga yang perlu diganti? | Fase 1 | Terbuka | Lihat `docs/data-audit.md` |
| 8 | Perlu notifikasi email (SMTP)? Penyedia SMTP apa? Perlu "lupa password" via email? | Fase 2 | Terbuka | Sementara in-app notification |
| 9 | Perlu SSO (Google Workspace/Microsoft 365) atau cukup email + password? 2FA untuk admin? | Fase 1/2 | Terbuka | Default email + password |
| 10 | Kebijakan retensi data (karyawan resign, audit log, slip gaji) dan kebutuhan kepatuhan UU PDP? | Fase 2 | Terbuka | Soft delete status & append-only audit |
| 11 | Zona waktu operasional (kantor/staf tersebar di lebih dari satu zona)? | Fase 1 | Selesai | Default: `Asia/Jakarta` (WIB) |
| 12 | Apakah Pemantik akan dipindah ke VPS yang sama atau tetap terpisah? | Pasca Fase 3 | Terbuka | Terpisah |
| 13 | Rekrutmen & Pelatihan: masuk sebelum go-live atau pasca go-live? | Fase 4 | Terbuka | Opsional di akhir Fase 4 |

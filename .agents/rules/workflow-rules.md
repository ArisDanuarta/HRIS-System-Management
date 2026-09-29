# Alur Kerja & Aturan Wajib Agent (Standard Operating Procedure)

File ini mendefinisikan alur kerja baku yang **WAJIB** diikuti oleh agent coding di setiap sesi pengerjaan proyek PSPK Platform.

---

### Alur Kerja (Workflow) 6 Langkah:

1. **Dilarang push / commit git otomatis**
   - **MUTLAK**: Agent dilarang menjalankan `git commit` maupun `git push` secara otomatis.
   - Semua pembuatan commit dan push harus menunggu instruksi atau persetujuan eksplisit dari pengguna.
   - Jangan pernah menyertakan `git commit` atau `git push` dalam rangkaian perbaikan otomatis.

2. **Analisis kode & analisis dokumen yang ada**
   - Sebelum melakukan perubahan atau menulis kode, pelajari dan pahami kode sumber yang terlibat.
   - Pahami skema Prisma, tipe data, serta aliran data dari database -> server query/action -> client component.
   - Baca dan rujuk dokumen spesifikasi yang ada:
     - `AGENTS.md` (arsitektur, RBAC, skema database, konvensi)
     - `docs/HRIS_BACKLOG.md` (spesifikasi fungsional fitur)
     - Blueprint atau dokumen panduan terkait lainnya.

3. **Melakukan perbaikan berdasarkan analisis poin 2**
   - Terapkan perbaikan atau implementasi fitur secara terstruktur dan tepat sasaran.
   - Pertahankan konsistensi arsitektur: validasi Zod di server action, otorisasi server-side, serialisasi plain JSON object melintasi batas server/client, serta penggunaan komponen desain brand PSPK.

4. **Crosscheck kembali kesesuaian dengan hasil analisis**
   - Setelah mengedit kode, lakukan tinjauan mandiri (*self-review*):
     - Apakah semua temuan di tahap analisis sudah terselesaikan?
     - Apakah ada efek samping (*side effects*) pada komponen atau fungsi lain yang memanggil kode tersebut?
     - Apakah penanganan nilai *nullable*, *edge cases*, dan konversi tipe (*Decimal* ke *number*, *Date* ke *string*) sudah tuntas?

5. **Catat hal penting (jika ada)**
   - Jika terdapat keputusan arsitektur baru, asumsi aturan bisnis, perubahan skema, atau hal krusial lain, catat pada:
     - `docs/PROGRESS.md`
     - `docs/DECISIONS.md`
     - `docs/OPEN_QUESTIONS.md`
   - Jika perbaikan bersifat rutin/minor dan tidak ada hal baru yang substansial, langkah pencatatan ini boleh dilewati (*skip*).

6. **Verifikasi yang sudah dikerjakan**
   - Lakukan verifikasi teknis secara menyeluruh:
     - `pnpm typecheck` (wajib 0 error di seluruh paket)
     - `pnpm lint` (wajib tidak ada lint error baru)
     - `pnpm test` (semua unit & integration test harus lulus)
     - Pengecekan fungsional atau ketersediaan endpoint bila diperlukan.

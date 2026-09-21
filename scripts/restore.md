# Prosedur Pemulihan (Restore) Database & File Upload PSPK Platform

Dokumentasi ini menjelaskan langkah-langkah pemulihan data dari file backup berkala.

## 1. Pemulihan Database PostgreSQL

Pastikan file dump tersedia (misalnya `db-YYYYMMDD-HHMMSS.dump`).

```bash
# Hentikan aplikasi untuk mencegah penulisan data baru saat restore
docker compose -f docker-compose.prod.yml stop hris sysmgmt

# Restore database menggunakan pg_restore ke container postgres
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore --clean --if-exists -U "$POSTGRES_USER" -d "$POSTGRES_DB" < /path/to/db-STAMP.dump

# Nyalakan kembali aplikasi
docker compose -f docker-compose.prod.yml start hris sysmgmt
```

## 2. Pemulihan File Upload

```bash
# Ekstrak file tar.gz ke volume uploads
docker run --rm -v pspk-platform_uploads:/data -v /path/to/backup:/backup alpine \
  tar xzf /backup/uploads-STAMP.tar.gz -C /data
```

## 3. Catatan Penting
- `DATA_ENCRYPTION_KEY` harus sesuai dengan kunci yang aktif saat data dienkripsi.
- Uji restore secara berkala pada database lokal/staging (`pspk_platform_test`).

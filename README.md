# POS to Data Warehouse Synchronizer

Aplikasi sinkronisasi data transaksi dari POS Cloud (MySQL) ke Data Warehouse (PostgreSQL) menggunakan Node.js.

## Fitur Utama
1. **Persistent Database Connections**: Menggunakan MySQL connection pool dan PostgreSQL pg-promise pool.
2. **Database Health Check**: Memastikan koneksi ke kedua database sukses sebelum memulai service. Jika gagal, aplikasi akan berhenti secara otomatis.
3. **Penjadwalan Otomatis (Cron)**: Berjalan setiap 5 menit sekali (atau sesuai konfigurasi env).
4. **Trigger Sinkronisasi Dinamis**: Menyediakan HTTP Server untuk memicu sinkronisasi manual via request `POST /sync`.
5. **Eksekusi Sekali Jalan (CLI)**: Mendukung parameter `now` untuk menjalankan sinkronisasi secara instan tanpa mengaktifkan server HTTP dan Cron.

---

## Konfigurasi Lingkungan (`.env`)

Buat file `.env` di direktori utama proyek dengan konfigurasi berikut:

```ini
# HTTP Server Configuration
PORT=3900

# Cron Configuration (Default: Setiap 5 menit)
CRON_SCHEDULE="*/5 * * * *"

# MySQL Source Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=secret
MYSQL_DATABASE=pos_db

# PostgreSQL Target Database Configuration
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=secret
PG_DATABASE=datawarehouse
```

---

## Cara Penggunaan

### 1. Menjalankan Service (HTTP Server & Cron)
Untuk menjalankan aplikasi secara terus-menerus dengan scheduler Cron dan server HTTP:

```bash
npm run start
# atau
node src/index.js
```

Aplikasi akan melakukan pengecekan koneksi database terlebih dahulu. Jika berhasil, server HTTP akan berjalan di port yang ditentukan (default: `3900`).

### 2. Memicu Sinkronisasi Manual (HTTP POST)
Ketika service di atas sedang berjalan, Anda dapat memicu proses sinkronisasi kapan saja melalui endpoint HTTP POST:

```bash
curl -X POST http://localhost:3900/sync
```

### 3. Menjalankan Sinkronisasi Instan Sekali Jalan (CLI)
Jika Anda ingin menjalankan sinkronisasi sekali saja secara instan melalui command line (misalnya untuk kebutuhan script migrasi otomatis), jalankan dengan parameter `now`:

```bash
node src/index.js now
```
Aplikasi akan memverifikasi koneksi database, menjalankan sinkronisasi, dan langsung menutup semua koneksi setelah selesai.

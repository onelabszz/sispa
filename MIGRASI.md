# `MIGRASI.md` — Panduan Lengkap

Simpan sebagai `MIGRASI.md` di root folder `sispa/`. File ini siap dibaca oleh siapa pun yang akan melakukan migrasi.

---

```markdown
# MIGRASI.md — Panduan Migrasi SISPA

Panduan lengkap memindahkan aplikasi SISPA ke akun Google baru,
termasuk auto-migrasi URL untuk semua user tanpa intervensi manual.

**Estimasi waktu:** 45–60 menit  
**Downtime:** ~5 menit (saat push frontend)  
**Kehilangan data:** Tidak ada (jika ikuti langkah dengan benar)

---

## Daftar Isi

1. [Ringkasan Komponen](#1-ringkasan-komponen)
2. [Konsep Auto-Migrasi](#2-konsep-auto-migrasi)
3. [Prasyarat](#3-prasyarat)
4. [Fase 1 — Persiapan](#fase-1--persiapan-10-menit)
5. [Fase 2 — Pindahkan Spreadsheet](#fase-2--pindahkan-spreadsheet-5-menit)
6. [Fase 3 — Pindahkan Apps Script](#fase-3--pindahkan-apps-script-20-menit)
7. [Fase 4 — Setup Trigger](#fase-4--setup-trigger-5-menit)
8. [Fase 5 — Deploy Web App Baru](#fase-5--deploy-web-app-baru-5-menit)
9. [Fase 6 — Update Frontend & Auto-Migrasi](#fase-6--update-frontend--auto-migrasi-5-menit)
10. [Fase 7 — Verifikasi Fungsional](#fase-7--verifikasi-fungsional-10-menit)
11. [Fase 8 — Pembersihan](#fase-8--pembersihan-opsional)
12. [Troubleshooting](#troubleshooting)
13. [Checklist Final](#checklist-final)
14. [Rollback Plan](#rollback-plan)
15. [Referensi Teknis](#referensi-teknis)

---

## 1. Ringkasan Komponen

| Komponen | Lokasi | Ikut saat Make a copy? | Aksi manual? |
|---|---|---|---|
| **Spreadsheet SISPA_DB** | Google Drive | ✅ Ya | Share + Make a copy |
| **Data** (14 sheet) | Dalam Spreadsheet | ✅ Ya | — |
| **Apps Script** (~30 file .gs) | Bound ke Spreadsheet | ❌ **Tidak** | Copy-paste manual |
| **Trigger otomatis** | Apps Script | ❌ Tidak | Setup ulang |
| **Deployment Web App** | Apps Script | ❌ Tidak | Deploy ulang |
| **Folder PDF di Drive** | Google Drive | ❌ Tidak | Buat folder baru (opsional) |
| **Frontend GitHub Pages** | GitHub | — | Update `config.js` |
| **localStorage user** | Browser user | — | **Auto-migrasi** |

**Kesimpulan:** Spreadsheet (data) otomatis ikut. Backend (Apps Script) **harus dipindah manual**. Frontend dan localStorage user **diupdate otomatis**.

---

## 2. Konsep Auto-Migrasi

Setelah migrasi selesai, **user tidak perlu tindakan apa pun**. Saat membuka aplikasi berikutnya:

```
1. User buka https://onelabszz.github.io/sispa/
        ↓
2. config.js dimuat: API_URL_VERSION = 'v2' (naik dari 'v1')
   localStorage.sispa_api_url_version = 'v1'  ← BEDA
        ↓
3. getApiUrl() deteksi version berubah
        ↓
4. Auto-reset otomatis:
   - localStorage.sispa_api_url = URL BARU
   - localStorage.sispa_api_url_version = 'v2'
   - Cache frontend dibersihkan
   - sessionStorage flag 'sispa_just_migrated' = '1'
        ↓
5. Banner "Aplikasi telah diperbarui" muncul 4 detik
        ↓
6. Request ke URL baru dengan token lama
        ↓
7. Selesai — user tidak sadar ada migrasi
```

### Dua Mekanisme Pengaman

| Mekanisme | Cara Kerja | Kapan Digunakan |
|---|---|---|
| **API_URL_VERSION** | Kalau versi di config ≠ versi di localStorage → reset global | Migrasi besar (semua user) |
| **LEGACY_URL_IDS** | Kalau URL user mengandung ID lama → reset | Migrasi spesifik (URL tertentu) |

**Rekomendasi:** Pakai keduanya bersamaan — version untuk jaring global, legacy untuk presisi.

### URL GAS Disimpan di 2 Tempat

| Lokasi | Fungsi | Siapa yang Update |
|---|---|---|
| `assets/js/config.js` → `DEFAULT_API_URL` | Fallback untuk user baru / reset | Developer (push) |
| `localStorage.sispa_api_url` | URL aktif per user | Auto-migrasi / admin manual |

Prioritas: **localStorage** > **DEFAULT_API_URL**.

---

## 3. Prasyarat

- ☐ Akses akun Google **lama** (pemilik SISPA saat ini)
- ☐ Akses akun Google **baru** (target migrasi)
- ☐ Akses repo GitHub `onelabszz.github.io`
- ☐ Editor teks di komputer (Notepad, gedit, VS Code)
- ☐ Terminal / Command Prompt (untuk test curl)
- ☐ Folder lokal: `~/backup-sispa/`

### Waktu dan Kompleksitas

| Fase | Waktu | Bisa Sambil Lain? |
|---|---|---|
| 1. Persiapan | 10 menit | Tidak |
| 2. Pindah Spreadsheet | 5 menit | Ya |
| 3. Pindah Apps Script | 20 menit | Tidak |
| 4. Setup Trigger | 5 menit | Tidak |
| 5. Deploy Web App | 5 menit | Tidak |
| 6. Update Frontend | 5 menit | Tidak |
| 7. Verifikasi | 10 menit | Tidak |
| **Total** | **~60 menit** | — |

**Rekomendasi:** Lakukan di luar jam sibuk (malam / weekend). Beri tahu user 1 hari sebelumnya.

---

## Fase 1 — Persiapan (10 menit)

### 1.1 Backup Data di Akun Lama

- ☐ Login ke akun lama
- ☐ Buka Spreadsheet `SISPA_DB`
- ☐ **File → Make a copy** → nama: `SISPA_DB_BACKUP_YYYY-MM-DD`
- ☐ **File → Download → Microsoft Excel (.xlsx)**
- ☐ Simpan sebagai `SISPA_DB_backup.xlsx` di `~/backup-sispa/`

### 1.2 Backup Kode Apps Script

- ☐ Buka Apps Script akun lama (menu **Extensions → Apps Script**)
- ☐ Buat folder `~/backup-sispa/gs/`
- ☐ Untuk **setiap** file di panel Files:
  - ☐ Klik file
  - ☐ **Ctrl+A** → **Ctrl+C**
  - ☐ Paste di editor teks → Save As `<nama-file>.txt`
  - ☐ Simpan di `~/backup-sispa/gs/`

**Daftar file yang harus di-backup (30 file):**

```
Code.gs
Config.gs
Utils.gs
Lock.gs
Cache.gs
Fast.gs
Instruments.gs
Auth.gs
Guard.gs
Repo_User.gs
Repo_Sekolah.gs
Repo_Guru.gs
Repo_Supervisi.gs
Repo_Coaching.gs
Repo_Rtl.gs
Repo_Audit.gs
Service_Guru.gs
Service_Supervisi.gs
Service_Coaching.gs
Service_Dashboard.gs
Service_Admin.gs
Service_Batch.gs
Service_Queue.gs
Service_Notifikasi.gs
Service_Pdf.gs
Service_Export.gs
Setup.gs
Dummy.gs
Debug.gs
Cache_Warming.gs
```

**Verifikasi:** Jumlah file `.txt` = jumlah file di Apps Script lama.

### 1.3 Catat Informasi Penting

Isi tabel:

| Item | Nilai |
|---|---|
| Akun Google lama | _______________________ |
| Akun Google baru | _______________________ |
| URL Web App lama | `https://script.google.com/macros/s/____/exec` |
| ID URL lama | `_______________________` (bagian setelah `/s/` sebelum `/exec`) |
| ID Spreadsheet lama | `_______________________` |
| ID Folder PDF lama | `_______________________` (kalau ada) |
| ID Folder Backup lama | `_______________________` (kalau ada) |
| Tanggal migrasi | _______________________ |

**Penting:** Catat **ID URL lama** (bukan URL lengkap) untuk `LEGACY_URL_IDS` di Fase 6.

### 1.4 Beri Tahu User

- ☐ Broadcast ke grup WA: "Aplikasi SISPA akan di-upgrade malam ini pukul 22.00–23.00. Mohon tidak mengisi data pada jam tersebut."
- ☐ Siapkan template follow-up: "Aplikasi sudah kembali normal, silakan lanjut digunakan."

---

## Fase 2 — Pindahkan Spreadsheet (5 menit)

### 2.1 Share Spreadsheet dari Akun Lama

- ☐ Login akun **lama**
- ☐ Buka Spreadsheet `SISPA_DB`
- ☐ Klik **Share** (kanan atas)
- ☐ Masukkan email akun **baru**
- ☐ Set permission: **Editor**
- ☐ Klik **Send**

### 2.2 Copy Spreadsheet di Akun Baru

- ☐ Logout akun lama → login akun **baru**
- ☐ Buka Gmail → klik link undangan → buka Spreadsheet
- ☐ **File → Make a copy**
- ☐ Beri nama: `SISPA_DB` (tanpa embel "Copy of")
- ☐ **Verifikasi 14 sheet ada:**

```
☐ users
☐ sessions
☐ sekolah
☐ guru
☐ supervisi
☐ supervisi_detail
☐ coaching
☐ coaching_detail
☐ rtl
☐ idempotency
☐ queue
☐ audit_log
☐ pengaturan
☐ schema_version
```

- ☐ **Verifikasi integritas data:**
  - Sheet `users` baris 2, kolom `salt` → 32 karakter hex
  - Sheet `users` baris 2, kolom `password_hash` → 64 karakter hex
  - Sheet `supervisi` kolom `tanggal` → format `YYYY-MM-DD` (plain text)

### 2.3 Bersihkan Share Akun Lama

- ☐ Login akun lama
- ☐ Buka Spreadsheet lama → **Share**
- ☐ Hapus akses akun baru (opsional)
- ☐ Rename: `SISPA_DB_OLD_JANGAN_HAPUS`

---

## Fase 3 — Pindahkan Apps Script (20 menit)

### 3.1 Buat Project Baru

- ☐ Di akun **baru**, buka Spreadsheet `SISPA_DB`
- ☐ Menu **Extensions → Apps Script**
- ☐ Project baru terbuka
- ☐ Rename project jadi `SISPA`
- ☐ **Hapus** file default `Code.gs` (klik kanan → Delete)

### 3.2 Paste Semua File

Untuk setiap file di `~/backup-sispa/gs/`:

- ☐ Klik **+ → Script**
- ☐ Beri nama (tanpa `.txt`) — contoh: `Config`
- ☐ Buka file `.txt` → **Ctrl+A** → **Ctrl+C**
- ☐ Paste di Apps Script → **Ctrl+V**
- ☐ **Ctrl+S**
- ☐ Ulangi untuk semua 30 file

**Verifikasi:** Panel Files harus berisi 30 file.

### 3.3 Sesuaikan `Config.gs`

- ☐ Buka `Config.gs`
- ☐ Cari blok `STORAGE`
- ☐ Pastikan 3 ID **KOSONG**:

```javascript
DB_SPREADSHEET_ID: '',
PDF_FOLDER_ID: '',
BACKUP_FOLDER_ID: '',
```

**PENTING:** Jangan isi dengan ID akun lama — beda akun tidak bisa akses.

- ☐ **Ctrl+S**

### 3.4 Verifikasi Script Binding

- ☐ Dropdown fungsi → pilih **`admin.health`**
- ☐ Klik **Run**
- ☐ Cek log
- ☐ Kalau error "Spreadsheet tidak terdeteksi" → buka Apps Script **dari menu Extensions di Spreadsheet**, bukan dari `script.google.com`

---

## Fase 4 — Setup Trigger (5 menit)

### 4.1 Jalankan Setup Awal

- ☐ Dropdown fungsi → **`setupSpreadsheet`**
- ☐ **Run**
- ☐ Izinkan akses (akun baru akan diminta authorization)
- ☐ Cek log: `Setup selesai. Semua sheet sudah siap.`

Fungsi ini **idempotent** — tidak akan menghapus data yang ada.

### 4.2 Pasang Trigger Queue

- ☐ Dropdown → **`installTriggers`**
- ☐ Run
- ☐ Cek log: `Trigger queue terpasang.`

### 4.3 Pasang Trigger Cache Warming

- ☐ Dropdown → **`installCacheWarmingTrigger`**
- ☐ Run
- ☐ Cek log: `✓ Trigger warm cache terpasang: setiap 30 menit.`

### 4.4 Verifikasi Trigger

- ☐ Menu kiri → **Triggers** (ikon jam dengan panah)
- ☐ Harus ada 2 baris:

| Function | Event | Interval |
|---|---|---|
| `warmAllCache` | Time-driven | Every 30 minutes |
| `triggerProcessQueue` | Time-driven | Every 5 minutes |

### 4.5 Jalankan Warm Cache Pertama

- ☐ Dropdown → **`warmAllCache`**
- ☐ Run
- ☐ Cek log — tidak ada error

---

## Fase 5 — Deploy Web App Baru (5 menit)

### 5.1 Buat Deployment

- ☐ Di Apps Script akun baru, klik **Deploy → New deployment**
- ☐ Klik ikon ⚙️ (gear) → pilih **Web app**
- ☐ Isi form:
  - **Description**: `SISPA Production`
  - **Execute as**: **Me** (akun baru)
  - **Who has access**: **Anyone**
- ☐ Klik **Deploy**
- ☐ Izinkan akses lagi
- ☐ **Copy URL Web App** yang muncul

**URL Baru:** `https://script.google.com/macros/s/_______________/exec`

**Catat ID URL baru:** `_______________________` (bagian setelah `/s/` sebelum `/exec`)

### 5.2 Test Curl `admin.health`

```bash
curl -L 'URL_BARU_DARI_LANGKAH_5.1' \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"action":"admin.health"}'
```

- ☐ Harus balik: `{"status":"ok","code":200,"data":{"status":"ok","app":"SISPA",...}}`

### 5.3 Test Curl Login Admin

```bash
curl -L 'URL_BARU' \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"action":"auth.login","npsn":"11111111","password":"11111111"}'
```

- ☐ Harus balik: `{"status":"ok","data":{"token":"...","user":{...}}}`
- ☐ Salin `token` dari respons

### 5.4 Test Data

```bash
curl -L 'URL_BARU' \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"action":"admin.users.list","token":"TOKEN_DARI_5.3"}'
```

- ☐ Harus balik daftar user dengan jumlah sesuai data akun lama

**Kalau semua test OK → Lanjut Fase 6.**

---

## Fase 6 — Update Frontend & Auto-Migrasi (5 menit)

### 6.1 Update `config.js`

- ☐ Buka repo GitHub `onelabszz.github.io`
- ☐ Buka file `sispa/assets/js/config.js` → Edit

**CARI:**
```javascript
DEFAULT_API_URL: 'https://script.google.com/macros/s/URL_LAMA/exec',
API_URL_VERSION: 'v1',
LEGACY_URL_IDS: [],
```

**GANTI:**
```javascript
DEFAULT_API_URL: 'https://script.google.com/macros/s/URL_BARU/exec',
API_URL_VERSION: 'v2',
LEGACY_URL_IDS: [
  'ID_URL_LAMA_1',
  'ID_URL_LAMA_2'
],
```

**Panduan pengisian:**
- `DEFAULT_API_URL` → URL baru dari Fase 5.1
- `API_URL_VERSION` → naikkan dari `v1` ke `v2` (atau `v2-2026-10-07`)
- `LEGACY_URL_IDS` → tambahkan **ID URL lama** (tanpa URL lengkap)

**Contoh:**
- URL lama: `https://script.google.com/macros/s/AKfycbzVF04wBd_ZBA0lnAyid2V4chiWUwEMCQH5eSontQgNNTRam4u43a6DhOzfV9L3JN9Kcw/exec`
- ID yang dimasukkan ke `LEGACY_URL_IDS`:
  ```
  'AKfycbzVF04wBd_ZBA0lnAyid2V4chiWUwEMCQH5eSontQgNNTRam4u43a6DhOzfV9L3JN9Kcw'
  ```

- ☐ **Commit changes**

### 6.2 Auto-Migrasi Otomatis

**Tidak perlu tindakan tambahan.** Setelah push, tunggu ~1 menit (GitHub Pages build), lalu:

- **User baru** → langsung pakai URL baru.
- **User lama** → saat buka aplikasi, browser otomatis:
  - Deteksi `API_URL_VERSION` berubah ATAU URL mengandung `LEGACY_URL_IDS`
  - Ganti `localStorage.sispa_api_url` ke URL baru
  - Bersihkan cache frontend
  - Tampilkan banner "Aplikasi telah diperbarui" selama 4 detik
  - Lanjutkan sesi login (kalau token masih valid)

### 6.3 Verifikasi Auto-Migrasi

Buka browser dengan Console (F12):

```javascript
// Simulasi user lama
localStorage.setItem('sispa_api_url', 'https://script.google.com/macros/s/AKfycbzVF04wBd_ZBA0lnAyid2V4chiWUwEMCQH5eSontQgNNTRam4u43a6DhOzfV9L3JN9Kcw/exec');
localStorage.setItem('sispa_api_url_version', 'v1');

// Refresh halaman → cek Console
// Harus muncul: "[SISPA] Auto-migrate: versi URL berubah dari v1 ke v2"

// Cek localStorage
console.log(localStorage.getItem('sispa_api_url'));
// Harus: URL baru
```

### 6.4 Test Manual

- ☐ Buka `/sispa/settings.html`
- ☐ Cek **URL Default** — harus URL baru
- ☐ Klik **Uji Koneksi** — harus hijau ✅
- ☐ Cek **localStorage.sispa_api_url** — harus URL baru
- ☐ Cek **localStorage.sispa_api_url_version** — harus `v2`

---

## Fase 7 — Verifikasi Fungsional (10 menit)

Login sebagai **Admin** di akun baru → uji:

### 7.1 Dashboard
- ☐ Stat cards tampil
- ☐ Chart aktivitas 7 hari muncul
- ☐ Status sistem "OK"

### 7.2 Users
- ☐ Daftar user tampil
- ☐ Jumlah user sesuai akun lama
- ☐ Tombol "Impor CSV" berfungsi
- ☐ Menu ⋮ berfungsi

### 7.3 Sekolah
- ☐ Daftar sekolah tampil
- ☐ Tombol "Impor CSV" berfungsi

### 7.4 Audit Log
- ☐ Log aktivitas tampil
- ☐ Filter berfungsi

### 7.5 Pengaturan
- ☐ Tab Umum, Kategori, Sistem tampil
- ☐ Tab Reset Data tampil

### 7.6 Login sebagai KS
- ☐ Login `20512345` / `20512345`
- ☐ Dashboard KS tampil
- ☐ Daftar guru tampil
- ☐ Buka supervisi detail
- ☐ **Cetak PDF** → tab baru dengan dokumen

### 7.7 Login sebagai Pengawas
- ☐ Login `99999999` / `99999999`
- ☐ Dashboard pengawas tampil
- ☐ Chart tren muncul
- ☐ Filter periode berfungsi

### 7.8 Import CSV (spot check)
- ☐ Buka Users → Impor CSV → paste 1 baris sample
- ☐ Hasil sukses

---

## Fase 8 — Pembersihan (Opsional)

Lakukan **1 minggu setelah** akun baru stabil.

- ☐ Login akun lama
- ☐ Apps Script lama → **Deploy → Manage deployments** → **Archive**
- ☐ Rename Spreadsheet lama: `SISPA_DB_OLD_JANGAN_HAPUS`
- ☐ **JANGAN HAPUS** dulu — simpan 3 bulan
- ☐ Catat di kalender untuk hapus pada tanggal tertentu

---

## Troubleshooting

### Masalah 1 — `Script function not found: doGet`
**Penyebab:** Deployment belum dibuat atau `Code.gs` tidak ikut ter-copy.  
**Solusi:**
- ☐ Cek panel Files, pastikan `Code.gs` ada
- ☐ Deploy ulang Web App (Fase 5)

### Masalah 2 — `INSTRUMEN_LK1 is not defined`
**Penyebab:** File `Instruments.gs` belum di-paste.  
**Solusi:**
- ☐ Buat file `Instruments.gs` → copy dari backup

### Masalah 3 — Login gagal padahal password benar
**Penyebab:** Spreadsheet copy mengubah format kolom `salt`/`password_hash`.  
**Solusi:**
- ☐ Cek sheet `users` — `salt` harus 32 char, `password_hash` harus 64 char
- ☐ Kalau rusak: File → Import → Replace dari backup Excel

### Masalah 4 — Login berhasil tapi dashboard kosong
**Penyebab:** Cache lama di browser.  
**Solusi:**
- ☐ Hard refresh (Ctrl+Shift+R)
- ☐ Buka `/settings.html` → Reset ke Default → Uji Koneksi

### Masalah 5 — Trigger tidak jalan
**Penyebab:** Trigger tidak terpasang.  
**Solusi:**
- ☐ Cek menu **Triggers** di Apps Script → harus ada 2 baris
- ☐ Jalankan `installTriggers()` dan `installCacheWarmingTrigger()`

### Masalah 6 — `Spreadsheet tidak terdeteksi`
**Penyebab:** Apps Script bukan bound script.  
**Solusi:**
- ☐ Buka Apps Script dari menu **Extensions → Apps Script** di Spreadsheet
- ☐ Atau isi `DB_SPREADSHEET_ID` di `Config.gs` (standalone mode)

### Masalah 7 — PDF tidak muncul
**Penyebab:** `PDF_FOLDER_ID` kosong atau folder tidak ada.  
**Solusi:**
- ☐ Mode HTML (folder kosong): tab baru muncul dengan tombol print
- ☐ Mode Drive: buat folder baru di akun baru → isi `PDF_FOLDER_ID`

### Masalah 8 — User lama tetap pakai URL lama
**Penyebab:** `LEGACY_URL_IDS` belum diisi atau ID salah.  
**Solusi:**
- ☐ Cek `config.js` — pastikan ID URL lama sudah ditambahkan
- ☐ Cek Console F12 → cari log `[SISPA] Auto-migrate: ...`
- ☐ Kalau tidak muncul: user pakai URL custom (bukan legacy) → minta buka `/settings.html` → Reset

### Masalah 9 — Auto-migrasi tidak jalan padahal version naik
**Penyebab:** Browser cache versi lama `config.js`.  
**Solusi:**
- ☐ Tambahkan `?v=2` di URL: `https://onelabszz.github.io/sispa/?v=2`
- ☐ Atau clear cache via `/settings.html` → Reset
- ☐ Atau tunggu CDN refresh (5–10 menit)

### Masalah 10 — Setelah migrasi, ada data yang hilang
**Penyebab:** Kemungkinan file `.xlsx` rusak saat import.  
**Solusi:**
- ☐ Buka `SISPA_DB_BACKUP_YYYY-MM-DD` di akun lama
- ☐ Bandingkan jumlah baris per sheet
- ☐ Kalau beda: ulangi Fase 2 (Make a copy, bukan Excel import)

---

## Checklist Final

### Spreadsheet
- ☐ Salinan ada di akun baru
- ☐ 14 sheet lengkap
- ☐ Data users/guru/supervisi/coaching utuh
- ☐ Hash password valid (64 char)

### Apps Script
- ☐ 30 file `.gs` di-paste
- ☐ `Config.gs` — 3 ID dikosongkan
- ☐ 2 trigger terpasang
- ☐ `setupSpreadsheet` berjalan tanpa error

### Deployment
- ☐ Web App baru di-deploy
- ☐ URL baru dicatat
- ☐ Test `admin.health` OK
- ☐ Test `auth.login` OK
- ☐ Test `admin.users.list` OK

### Frontend
- ☐ `config.js` — `DEFAULT_API_URL` diupdate
- ☐ `config.js` — `API_URL_VERSION` dinaikkan
- ☐ `config.js` — `LEGACY_URL_IDS` diisi
- ☐ GitHub Pages ter-push

### Auto-Migrasi
- ☐ Test di Console: simulasi user lama → auto-reset
- ☐ Banner "Aplikasi telah diperbarui" muncul
- ☐ `localStorage.sispa_api_url_version` = versi baru

### Fungsional
- ☐ Login Admin OK
- ☐ Login KS OK
- ☐ Login Pengawas OK
- ☐ Dashboard semua role tampil
- ☐ Cetak PDF OK
- ☐ Import CSV OK

### Pembersihan
- ☐ Spreadsheet lama di-rename
- ☐ Deployment lama di-archive
- ☐ Backup disimpan 3 bulan
- ☐ Broadcast WA ke user

---

## Rollback Plan

Kalau migrasi gagal di tengah jalan dan harus kembali ke akun lama:

### Skenario 1 — Gagal sebelum Fase 6 (Frontend belum diupdate)

**Akun lama masih utuh. Tinggal lanjutkan pemakaian normal.**

- ☐ Buka Spreadsheet lama
- ☐ User tetap pakai URL lama (tidak ada perubahan)
- ☐ Hapus salinan yang gagal di akun baru

### Skenario 2 — Gagal setelah Fase 6 (Frontend sudah diupdate)

**User sudah diarahkan ke URL baru tapi backend baru bermasalah.**

- ☐ Buka `assets/js/config.js`
- ☐ Kembalikan `DEFAULT_API_URL` ke URL lama
- ☐ Naikkan `API_URL_VERSION` lagi (mis. `v2` → `v3`)
- ☐ Tambahkan ID URL baru ke `LEGACY_URL_IDS`
- ☐ Commit & push
- ☐ User otomatis kembali ke URL lama

### Skenario 3 — Data baru hilang

- ☐ Buka `SISPA_DB_BACKUP_YYYY-MM-DD` di akun lama
- ☐ Restore data dari backup Excel
- ☐ Kalau perlu, lakukan migrasi ulang dari Fase 1

---

## Referensi Teknis

### Struktur `config.js` Relevan

```javascript
const SISPA_CONFIG = {
  APP_VERSION: '1.2.0',

  // URL backend baru
  DEFAULT_API_URL: 'https://script.google.com/macros/s/.../exec',

  // Versi URL — naikkan setiap migrasi
  API_URL_VERSION: 'v1',

  // Daftar ID URL lama untuk auto-migrasi
  LEGACY_URL_IDS: [
    // 'ID_URL_LAMA_1',
    // 'ID_URL_LAMA_2'
  ],

  // Kalau true: token tetap dipakai setelah migrasi
  PRESERVE_SESSION_ON_MIGRATION: true,

  STORAGE_KEYS: {
    API_URL: 'sispa_api_url',
    API_URL_VERSION: 'sispa_api_url_version',
    TOKEN: 'sispa_token',
    USER: 'sispa_user'
  }
};
```

### Alur `getApiUrl()`

```
getApiUrl()
    ↓
Baca localStorage.sispa_api_url + sispa_api_url_version
    ↓
Cek 1: version berubah? → Reset
    ↓
Cek 2: URL kosong? → Pakai default
    ↓
Cek 3: URL sama default? → Pakai
    ↓
Cek 4: Ada di LEGACY_URL_IDS? → Reset
    ↓
Cek 5: URL custom? → Pakai
    ↓
Return URL
```

### Endpoint Wajib Test Setelah Migrasi

```bash
# 1. Health (tanpa token)
curl -L 'URL' -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"action":"admin.health"}'

# 2. Login
curl -L 'URL' -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"action":"auth.login","npsn":"11111111","password":"11111111"}'

# 3. Data users (dengan token dari langkah 2)
curl -L 'URL' -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"action":"admin.users.list","token":"TOKEN"}'

# 4. Dashboard pengawas (dengan token pengawas)
curl -L 'URL' -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"action":"dashboard.pengawas","token":"TOKEN_PENGAWAS"}'
```

### Kapan Naikkan `API_URL_VERSION`?

| Skenario | Naikkan? | Tambah Legacy? |
|---|---|---|
| Pindah akun Gmail | ✅ Ya | ✅ Ya |
| Ganti Spreadsheet backend | ✅ Ya | ✅ Ya |
| Deploy ulang Web App (URL sama) | ❌ Tidak | ❌ Tidak |
| Deploy ulang Web App (URL beda) | ❌ Tidak | ✅ Ya |
| Test URL baru oleh admin | ❌ Tidak | ❌ Tidak |

---

## Kontak & Dukungan

- **Admin aplikasi:** _______________________  
- **Developer:** _______________________  
- **Repo GitHub:** https://github.com/onelabszz/onelabszz.github.io  
- **URL Aplikasi:** https://onelabszz.github.io/sispa/  
- **Backup terakhir:** `SISPA_DB_BACKUP_YYYY-MM-DD`

---

## Changelog

| Tanggal | Versi | Perubahan |
|---|---|---|
| 2026-10-07 | 1.0 | Dokumen awal migrasi |
| 2026-10-07 | 1.1 | Tambah auto-migrasi URL (version + legacy) |
| 2026-10-07 | 1.2 | Lengkapi troubleshooting & rollback |

---

**Dokumen ini terakhir diperbarui:** 7 Oktober 2026
```

---

## Cara Pakai File Ini

1. **Simpan** sebagai `MIGRASI.md` di folder `sispa/` (sejajar dengan `index.html`).
2. **Baca sekilas** seluruhnya sebelum mulai — paling tidak 15 menit.
3. **Ikuti fase 1 → 8** berurutan.
4. **Centang** setiap checkbox `☐` saat selesai.
5. **Jika macet**, buka **Troubleshooting** — 10 masalah umum sudah dibahas.
6. **Backup** file ini juga — berguna untuk migrasi berikutnya.

---

## Yang Perlu Dilengkapi Sendiri

Sebelum commit, isi placeholder berikut dengan data nyata:

### Fase 1.3 — Catat Informasi
Isi tabel dengan data Anda.

### Bagian Kontak
Isi nama & email admin + developer.

### Changelog
Update setiap kali dokumen direvisi.

---

Kalau Anda ingin, saya bisa juga buatkan:
- **`README.md`** — ringkasan aplikasi untuk developer baru
- **`CHANGELOG.md`** — riwayat fitur dan versi
- **`CONTRIBUTING.md`** — panduan kontribusi
- **`PANDUAN_KS.md`** — panduan penggunaan untuk kepala sekolah
- **`PANDUAN_PENGAWAS.md`** — panduan untuk pengawas

Sebutkan mana yang mau dibuat.

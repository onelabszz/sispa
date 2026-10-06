# SISPA — Sistem Informasi Supervisi Pendidikan Akademik

Frontend untuk aplikasi supervisi akademik & coaching KS → Guru, monitoring oleh Pengawas.

**Backend:** Google Apps Script (Web App)
**Frontend:** GitHub Pages (statis)
**URL:** https://onelabszz.github.io/sispa/

## Cara Deploy

1. Clone repo `onelabszz.github.io` (atau buat baru).
2. Buat folder `sispa/` di root repo.
3. Salin semua file di atas ke dalam `sispa/`.
4. Commit & push ke branch `main`.
5. Buka `https://onelabszz.github.io/sispa/`.

## Konfigurasi Backend

URL GAS default ada di `assets/js/config.js`. Bisa diubah kapan saja lewat
`https://onelabszz.github.io/sispa/settings.html` (tersimpan di localStorage).

## Akun Contoh

- NPSN: `20512345`
- Password: `20512345` (default = NPSN)

## Halaman

| URL | Akses |
|---|---|
| `/sispa/` | Login |
| `/sispa/settings.html` | Pengaturan Koneksi (ganti link GAS) |
| `/sispa/ks/dashboard.html` | Dashboard KS |
| `/sispa/ks/guru.html` | CRUD Guru |
| `/sispa/ks/supervisi.html` | Daftar Supervisi |
| `/sispa/ks/supervisi-form.html` | Form LK1 |
| `/sispa/ks/coaching.html` | Daftar Coaching |
| `/sispa/ks/coaching-form.html` | Form LK2 |
| `/sispa/pengawas/dashboard.html` | Dashboard Pengawas |
| `/sispa/pengawas/sekolah.html` | Detail Sekolah |

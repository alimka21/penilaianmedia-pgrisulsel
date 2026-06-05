# Ringkasan Eksekutif PRD

**Nama Produk:** Web Penilaian Lomba Media Pembelajaran
**Tujuan:** Lomba media pembelajaran digital yang adil, transparan, blind-judging.
**Pengguna:** Admin (Pengelola), Juri (TK, SLB, SD, SMP, SMA).

## Fitur Utama:
1. **Landing Page:** Informasi umum publik & Tombol Login.
2. **Login:** Satu pintu untuk Admin dan Juri (dibedakan via role).
3. **Dasbor Juri:** 
   - Daftar peserta (Nama, Media, Kelengkapan Link). Tanpa identitas asal (Blind Judging).
   - Penilaian: Layout 2 kolom (Video/Material vs Form Penilaian).
4. **Dasbor Admin:**
   - Manajemen Peserta (Import Data).
   - Monitoring Progres Penilaian.
   - Manajemen Aspek & Indikator.
   - Manajemen Akun Juri.
   - Monitoring Penilaian & Peringkat.
   - Export Data ke Excel.

## Struktur Data Peserta
- Nama Peserta, Nama Media, Kategori
- Kabupaten/Kota, Nama Sekolah, Nomor HP (Hanya terlihat oleh Admin)
- Link YouTube, Link RPP, Link Media
- Durasi Video, Nilai & Peringkat

## Tech Stack Target
- Frontend: React + Vite + Tailwind CSS
- Routing: React Router
- Data & State: Local State / Backend Express (Tahap awal) 

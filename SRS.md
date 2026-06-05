# Software Requirements Specification (SRS)
## Sistem Penilaian Lomba Media PGRI Sulawesi Selatan

### 1. Deskripsi Umum
Sistem Penilaian Lomba Media Pembelajaran PGRI Sulawesi Selatan adalah aplikasi berbasis web (Single Page Application) yang dibangun untuk memfasilitasi proses penilaian lomba oleh dewan juri dan manajemen data oleh tata usaha/admin.

### 2. Aktor dan Hak Akses (Role-based)
sistem ini memiliki tiga tipe pengguna utama:
1. **Administrator (Admin)**: Mengelola master data (peserta, juri, dan komponen penilaian). Login dengan `admin` / `admin`.
2. **Juri Media**: Juri tahap 1 yang menilai aspek teknis/media sesuai kategori pendidikan (TK, SLB, SD, SMP, SMA).
3. **Juri Presentasi**: Juri tahap 2 yang menilai performa presentasi di semua kategori secara lintas batas.

### 3. Fitur Utama

#### 3.1. Autentikasi & Keamanan
- Login berbasis peran. Jika Juri, login terhubung dengan data di `useDataStore`.
- Logout dengan konfirmasi (SweetAlert2).
- Tombol 'Kembali ke Beranda' di halaman login.

#### 3.2. Modul Admin
- **Dashboard Admin**: Ringkasan data (belum dikembangkan secara detail, saat ini navigasi tab).
- **Manajemen Peserta (AdminPeserta)**: 
  - Tambah data manual.
  - Hapus data peserta berikut nilainya (dengan konfirmasi).
  - Import data dummy.
  - Export data peserta ke format CSV.
- **Manajemen Juri (AdminJuri)**: 
  - Melihat daftar akun juri beserta username, password (fitur hide/show password text), kategori, status.
  - Edit akun juri (Nama, Username, Password) via SweetAlert2.
  - Hapus akun juri (dengan konfirmasi).
- **Pengaturan Penilaian (AdminSettings)**:
  - Mengelola aspek penilaian untuk Tahap 1 (Media) dan Tahap 2 (Presentasi).
  - Validasi bahwa total bobot masing-masing tahap harus tepat 100%.

#### 3.3. Modul Juri
- **Dashboard Juri**: Menampilkan daftar peserta yang sesuai dengan kategori juri (kecuali Juri Presentasi yang bisa melihat semua).
- **Penilaian**: 
  - Memilih peserta.
  - Mengisi form nilai dari 0-100 per aspek.
  - Data penilaian tersimpan dan dihitung status kelulusannya/peringkat (secara internal di client-side state).

### 4. Spesifikasi Teknis
- **Frontend**: React (dengan Vite, TypeScript).
- **Styling**: Tailwind CSS.
- **Iconography**: Lucide React.
- **Notifikasi/Dialog**: SweetAlert2.
- **State Management**: Zustand (dengan fitur `persist` menggunakan Local Storage browser) terbagi atas `useAuthStore` dan `useDataStore`.
- **Navigasi**: React Router DOM.

### 5. Aturan Penting & Data Default
- Data juri disimpan dalam state terpusat (tidak hardcode di page).
- `defaultJuriList` saat reset mengandung akun default per kategori.
- Header dan informasi di aplikasi melampirkan identitas "PGRI Sulawesi Selatan".

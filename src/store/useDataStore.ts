import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Kategori = 'TK' | 'SLB' | 'SD' | 'SMP' | 'SMA';

export interface Indikator {
  id: string;
  deskripsi: string;
}

export interface Aspek {
  id: string;
  nama: string;
  bobot: number;
  indikator: Indikator[];
}

export interface PenilaianDetail {
  scores: Record<string, number>; // AspekID -> score (0-100)
}

export interface JuriAccount {
  id: string;
  name: string;
  username: string;
  passwordText: string;
  kategori: string;
  role: 'juri-media' | 'juri-presentasi';
  status: string;
}

export interface Peserta {
  id: string;
  namaPeserta: string;
  kabupatenKota: string;
  namaSekolah: string;
  nomorHp: string;
  kategori: Kategori;
  namaMedia: string;
  linkYoutube: string;
  linkRpp: string;
  linkMedia: string;
  durasiVideo?: string;
  
  penilaianMedia?: Record<string, PenilaianDetail>; // juriId -> PenilaianDetail
  penilaianPresentasi?: Record<string, PenilaianDetail>; // juriId -> PenilaianDetail
}

const defaultAspekMedia: Aspek[] = [
  {
    id: "m1", nama: "Keinovatifan", bobot: 30,
    indikator: [
      { id: "m1a", deskripsi: "Integrasi Kecerdasan Buatan (AI) secara relevan." },
      { id: "m1b", deskripsi: "Orisinalitas konsep dan kebaruan ide." },
      { id: "m1c", deskripsi: "Pendekatan pemecahan masalah yang unik." }
    ]
  },
  {
    id: "m2", nama: "Kreativitas", bobot: 20,
    indikator: [
      { id: "m2a", deskripsi: "Desain visual dan antarmuka yang menarik." },
      { id: "m2b", deskripsi: "Interaktivitas yang memancing partisipasi aktif." },
      { id: "m2c", deskripsi: "Fleksibilitas penggunaan untuk berbagai gaya belajar." }
    ]
  },
  {
    id: "m3", nama: "Kebermanfaatan", bobot: 20,
    indikator: [
      { id: "m3a", deskripsi: "Kesesuaian materi dengan tujuan pembelajaran." },
      { id: "m3b", deskripsi: "Dampak positif terhadap pemahaman siswa." },
      { id: "m3c", deskripsi: "Meningkatkan motivasi peserta didik." }
    ]
  },
  {
    id: "m4", nama: "Aplikatif", bobot: 15,
    indikator: [
      { id: "m4a", deskripsi: "Kemudahan akses dan penggunaan." },
      { id: "m4b", deskripsi: "Kompatibilitas dengan berbagai perangkat (responsif)." },
      { id: "m4c", deskripsi: "Bebas dari bug/error kritis dan mudah dipandu." }
    ]
  },
  {
    id: "m5", nama: "Efisien", bobot: 15,
    indikator: [
      { id: "m5a", deskripsi: "Optimalisasi penggunaan sumber daya/kuota." },
      { id: "m5b", deskripsi: "Kinerja aplikasi yang lancar tanpa lag." },
      { id: "m5c", deskripsi: "Instruksi yang jelas dalam penggunaan awal." }
    ]
  }
];

const defaultAspekPresentasi: Aspek[] = [
  {
    id: "p1", nama: "Penguasaan Materi", bobot: 40,
    indikator: [
      { id: "p1a", deskripsi: "Kedalaman pemahaman terhadap karya." },
      { id: "p1b", deskripsi: "Kemampuan menjawab pertanyaan dewan juri dengan runut." },
      { id: "p1c", deskripsi: "Kejelasan dasar teori/pendekatan yang digunakan." }
    ]
  },
  {
    id: "p2", nama: "Keterampilan Komunikasi", bobot: 30,
    indikator: [
      { id: "p2a", deskripsi: "Kejelasan artikulasi dan intonasi suara." },
      { id: "p2b", deskripsi: "Penggunaan bahasa yang baik dan profesional." },
      { id: "p2c", deskripsi: "Bahasa tubuh dan kontak mata (jika via video/langsung)." }
    ]
  },
  {
    id: "p3", nama: "Manajemen Waktu", bobot: 30,
    indikator: [
      { id: "p3a", deskripsi: "Efisiensi presentasi dalam batas waktu." },
      { id: "p3b", deskripsi: "Proporsi waktu penjelasan dan demonstrasi seimbang." },
      { id: "p3c", deskripsi: "Tanya jawab diselesaikan sesuai alokasi waktu." }
    ]
  }
];

const defaultJuriList: JuriAccount[] = [
  { id: "j1", name: "Juri Media TK", username: "juritk", passwordText: "juri", kategori: "TK", role: 'juri-media', status: "Aktif" },
  { id: "j2", name: "Juri Media SLB", username: "jurimediaslb", passwordText: "juri", kategori: "SLB", role: 'juri-media', status: "Aktif" },
  { id: "j3", name: "Juri Media SD", username: "jurimediasd", passwordText: "juri", kategori: "SD", role: 'juri-media', status: "Aktif" },
  { id: "j4", name: "Juri Media SMP", username: "jurimediasmp", passwordText: "juri", kategori: "SMP", role: 'juri-media', status: "Aktif" },
  { id: "j5", name: "Juri Media SMA", username: "jurimediasma", passwordText: "juri", kategori: "SMA", role: 'juri-media', status: "Aktif" },
  { id: "j6", name: "Juri Presentasi 1", username: "juripertama", passwordText: "juri", kategori: "Semua", role: 'juri-presentasi', status: "Aktif" },
  { id: "j7", name: "Juri Presentasi 2", username: "jurikedua", passwordText: "juri", kategori: "Semua", role: 'juri-presentasi', status: "Aktif" },
  { id: "j8", name: "Juri Presentasi 3", username: "juriketiga", passwordText: "juri", kategori: "Semua", role: 'juri-presentasi', status: "Aktif" },
];

interface DataState {
  pesertaList: Peserta[];
  juriList: JuriAccount[];
  aspekMedia: Aspek[];
  aspekPresentasi: Aspek[];
  addPeserta: (peserta: Omit<Peserta, 'id' | 'penilaianMedia' | 'penilaianPresentasi'>) => void;
  importPeserta: (pesertas: Omit<Peserta, 'id' | 'penilaianMedia' | 'penilaianPresentasi'>[]) => void;
  updatePeserta: (id: string, update: Partial<Peserta>) => void;
  deletePeserta: (id: string) => void;
  addJuri: (juri: Omit<JuriAccount, 'id'>) => void;
  updateJuri: (id: string, juri: Partial<JuriAccount>) => void;
  deleteJuri: (id: string) => void;
  updatePenilaianMedia: (pesertaId: string, juriId: string, scores: Record<string, number>) => void;
  updatePenilaianPresentasi: (pesertaId: string, juriId: string, scores: Record<string, number>) => void;
  updateAspekMedia: (aspek: Aspek[]) => void;
  updateAspekPresentasi: (aspek: Aspek[]) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      pesertaList: [],
      juriList: defaultJuriList,
      aspekMedia: defaultAspekMedia,
      aspekPresentasi: defaultAspekPresentasi,
      addPeserta: (pesertaInput) => set((state) => ({
        pesertaList: [
          ...state.pesertaList,
          {
            ...pesertaInput,
            id: Math.random().toString(36).substr(2, 9),
            penilaianMedia: {},
            penilaianPresentasi: {}
          }
        ]
      })),
      importPeserta: (pesertasListInput) => set((state) => {
        const newPeserta = pesertasListInput.map(p => ({
          ...p,
          id: Math.random().toString(36).substr(2, 9),
          penilaianMedia: {},
          penilaianPresentasi: {}
        }));
        return { pesertaList: [...state.pesertaList, ...newPeserta] };
      }),
      updatePeserta: (id, update) => set((state) => ({
        pesertaList: state.pesertaList.map(p => p.id === id ? { ...p, ...update } : p)
      })),
      deletePeserta: (id) => set((state) => ({
        pesertaList: state.pesertaList.filter(p => p.id !== id)
      })),
      addJuri: (juriInput) => set((state) => ({
        juriList: [...state.juriList, { ...juriInput, id: Math.random().toString(36).substr(2, 9) }]
      })),
      updateJuri: (id, juriUpdate) => set((state) => ({
        juriList: state.juriList.map(j => j.id === id ? { ...j, ...juriUpdate } : j)
      })),
      deleteJuri: (id) => set((state) => ({
        juriList: state.juriList.filter(j => j.id !== id)
      })),
      updatePenilaianMedia: (pesertaId, juriId, scores) => set((state) => ({
        pesertaList: state.pesertaList.map(p => 
          p.id === pesertaId ? { ...p, penilaianMedia: { ...(p.penilaianMedia || {}), [juriId]: { scores } } } : p
        )
      })),
      updatePenilaianPresentasi: (pesertaId, juriId, scores) => set((state) => ({
        pesertaList: state.pesertaList.map(p => 
          p.id === pesertaId ? { ...p, penilaianPresentasi: { ...(p.penilaianPresentasi || {}), [juriId]: { scores } } } : p
        )
      })),
      updateAspekMedia: (aspekMedia) => set({ aspekMedia }),
      updateAspekPresentasi: (aspekPresentasi) => set({ aspekPresentasi })
    }),
    {
      name: 'lomba-media-storage-v2',
    }
  )
);

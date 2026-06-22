import { create } from 'zustand';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firebaseError';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs
} from 'firebase/firestore';

export type Kategori = 'GURU TK/RA/SEDERAJAT' | 'GURU SD/MI/SEDERAJAT' | 'GURU SMP/MTS/SEDERAJAT' | 'GURU SMA/SMK/MA/SEDERAJAT' | 'GURU SLB';

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
  role: string;
  status: string;
  aspekMediaIds?: string[];
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
  { id: "j2", name: "Juri Media SLB", username: "jurimediaslb", passwordText: "juri", kategori: "GURU SLB", role: 'juri-media', status: "Aktif" },
  { id: "j3", name: "Juri Media SD/MI", username: "jurimediasd", passwordText: "juri", kategori: "GURU SD/MI/SEDERAJAT", role: 'juri-media', status: "Aktif" },
  { id: "j4", name: "Juri Media SMP/MTS", username: "jurimediasmp", passwordText: "juri", kategori: "GURU SMP/MTS/SEDERAJAT", role: 'juri-media', status: "Aktif" },
  { id: "j5", name: "Juri Media SMA/SMK", username: "jurimediasma", passwordText: "juri", kategori: "GURU SMA/SMK/MA/SEDERAJAT", role: 'juri-media', status: "Aktif" },
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

export const useDataStore = create<DataState>()((set) => ({
  pesertaList: [],
  juriList: [],
  aspekMedia: [],
  aspekPresentasi: [],

  addPeserta: async (pesertaInput) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newPeserta: Peserta = {
      ...pesertaInput,
      id,
      penilaianMedia: {},
      penilaianPresentasi: {}
    };
    try {
      await setDoc(doc(db, 'peserta', id), newPeserta);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `peserta/${id}`);
    }
  },

  importPeserta: async (pesertasListInput) => {
    try {
      const batch = writeBatch(db);
      pesertasListInput.forEach(p => {
        const id = Math.random().toString(36).substring(2, 11);
        const newPeserta: Peserta = {
          ...p,
          id,
          penilaianMedia: {},
          penilaianPresentasi: {}
        };
        batch.set(doc(db, 'peserta', id), newPeserta);
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'peserta/batch');
    }
  },

  updatePeserta: async (id, update) => {
    try {
      // Filter out keys that might have undefined values to keep firestore safe
      const cleanUpdate: Record<string, any> = {};
      Object.entries(update).forEach(([key, val]) => {
        if (val !== undefined) {
          cleanUpdate[key] = val;
        }
      });
      await updateDoc(doc(db, 'peserta', id), cleanUpdate);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `peserta/${id}`);
    }
  },

  deletePeserta: async (id) => {
    try {
      await deleteDoc(doc(db, 'peserta', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `peserta/${id}`);
    }
  },

  addJuri: async (juriInput) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newJuri: JuriAccount = { 
      ...juriInput, 
      id 
    };
    try {
      await setDoc(doc(db, 'juri', id), newJuri);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `juri/${id}`);
    }
  },

  updateJuri: async (id, juriUpdate) => {
    try {
      const cleanUpdate: Record<string, any> = {};
      Object.entries(juriUpdate).forEach(([key, val]) => {
        if (val !== undefined) {
          cleanUpdate[key] = val;
        }
      });
      await updateDoc(doc(db, 'juri', id), cleanUpdate);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `juri/${id}`);
    }
  },

  deleteJuri: async (id) => {
    try {
      await deleteDoc(doc(db, 'juri', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `juri/${id}`);
    }
  },

  updatePenilaianMedia: async (pesertaId, juriId, scores) => {
    try {
      // Use dot notation to securely update specific jury's grading without overwriting others
      await updateDoc(doc(db, 'peserta', pesertaId), {
        [`penilaianMedia.${juriId}`]: { scores }
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `peserta/${pesertaId}/penilaianMedia`);
    }
  },

  updatePenilaianPresentasi: async (pesertaId, juriId, scores) => {
    try {
      // Use dot notation to securely update specific jury's grading without overwriting others
      await updateDoc(doc(db, 'peserta', pesertaId), {
        [`penilaianPresentasi.${juriId}`]: { scores }
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `peserta/${pesertaId}/penilaianPresentasi`);
    }
  },

  updateAspekMedia: async (aspekMedia) => {
    try {
      const batch = writeBatch(db);
      aspekMedia.forEach(asp => {
        batch.set(doc(db, 'aspekMedia', asp.id), asp);
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'aspekMedia/batch');
    }
  },

  updateAspekPresentasi: async (aspekPresentasi) => {
    try {
      const batch = writeBatch(db);
      aspekPresentasi.forEach(asp => {
        batch.set(doc(db, 'aspekPresentasi', asp.id), asp);
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'aspekPresentasi/batch');
    }
  }
}));

// Setup Firestore real-time snapshot listeners to keep local state fully updated
onSnapshot(collection(db, 'peserta'), (snapshot) => {
  const pesertas: Peserta[] = [];
  snapshot.forEach((doc) => {
    pesertas.push(doc.data() as Peserta);
  });
  useDataStore.setState({ pesertaList: pesertas });
}, (error) => {
  handleFirestoreError(error, OperationType.LIST, 'peserta');
});

onSnapshot(collection(db, 'juri'), (snapshot) => {
  const juris: JuriAccount[] = [];
  snapshot.forEach((doc) => {
    juris.push(doc.data() as JuriAccount);
  });
  useDataStore.setState({ juriList: juris });
}, (error) => {
  handleFirestoreError(error, OperationType.LIST, 'juri');
});

onSnapshot(collection(db, 'aspekMedia'), (snapshot) => {
  const asps: Aspek[] = [];
  snapshot.forEach((doc) => {
    asps.push(doc.data() as Aspek);
  });
  asps.sort((a, b) => a.id.localeCompare(b.id));
  useDataStore.setState({ aspekMedia: asps });
}, (error) => {
  handleFirestoreError(error, OperationType.LIST, 'aspekMedia');
});

onSnapshot(collection(db, 'aspekPresentasi'), (snapshot) => {
  const asps: Aspek[] = [];
  snapshot.forEach((doc) => {
    asps.push(doc.data() as Aspek);
  });
  asps.sort((a, b) => a.id.localeCompare(b.id));
  useDataStore.setState({ aspekPresentasi: asps });
}, (error) => {
  handleFirestoreError(error, OperationType.LIST, 'aspekPresentasi');
});

// Seed function to initialize Firestore on very first load
const seedInitialDataIfNeeded = async () => {
  try {
    const aspekMediaSnap = await getDocs(collection(db, 'aspekMedia'));
    if (aspekMediaSnap.empty) {
      console.log('Seeding default aspekMedia...');
      for (const asp of defaultAspekMedia) {
        await setDoc(doc(db, 'aspekMedia', asp.id), asp);
      }
    }

    const aspekPresSnap = await getDocs(collection(db, 'aspekPresentasi'));
    if (aspekPresSnap.empty) {
      console.log('Seeding default aspekPresentasi...');
      for (const asp of defaultAspekPresentasi) {
        await setDoc(doc(db, 'aspekPresentasi', asp.id), asp);
      }
    }

    const juriSnap = await getDocs(collection(db, 'juri'));
    if (juriSnap.empty) {
      console.log('Seeding default juriList...');
      for (const jr of defaultJuriList) {
        await setDoc(doc(db, 'juri', jr.id), jr);
      }
    }
  } catch (error) {
    console.warn('Seeding was bypassed or failed:', error);
  }
};

seedInitialDataIfNeeded();

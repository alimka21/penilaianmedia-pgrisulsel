import React, { useState } from "react";
import { useDataStore, Aspek } from "@/store/useDataStore";
import { Plus, Trash2, Save } from "lucide-react";
import Swal from 'sweetalert2';

export function AdminSettings() {
  const { aspekMedia, aspekPresentasi, updateAspekMedia, updateAspekPresentasi } = useDataStore();
  
  // Local states to handle editing before saving
  const [localMedia, setLocalMedia] = useState<Aspek[]>([...aspekMedia]);
  const [localPresentasi, setLocalPresentasi] = useState<Aspek[]>([...aspekPresentasi]);
  
  const calculateTotal = (aspekList: Aspek[]) => aspekList.reduce((sum, a) => sum + a.bobot, 0);

  const handleSave = () => {
     if (calculateTotal(localMedia) !== 100 || calculateTotal(localPresentasi) !== 100) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyimpan',
          text: 'Total bobot masing-masing kelompok (Media Pembelajaran & Presentasi) harus bernilai tepat 100%.'
        });
        return;
     }
     updateAspekMedia(localMedia);
     updateAspekPresentasi(localPresentasi);
     Swal.fire({
       icon: 'success',
       title: 'Tersimpan',
       text: 'Konfigurasi aspek penilaian 1 tahap berhasil disimpan!',
       timer: 1500,
       showConfirmButton: false
     });
  };

  const renderEditor = (
    title: string, 
    items: Aspek[], 
    setter: React.Dispatch<React.SetStateAction<Aspek[]>>
  ) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8">
       <div className="flex justify-between items-center mb-6">
          <div>
             <h2 className="text-lg font-bold text-slate-900">{title}</h2>
             <p className="text-sm text-slate-500">Konfigurasi aspek, indikator penilaian, dan bobot internal.</p>
          </div>
          <button 
             onClick={() => setter([...items, { id: Math.random().toString(), nama: "Aspek Baru", bobot: 0, indikator: [] }])}
             className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
          >
             <Plus size={16} /> Tambah Aspek
          </button>
       </div>

       <div className="space-y-4">
          {items.map((aspek, i) => (
             <div key={aspek.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
               <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 pb-4 border-b border-slate-200">
                 <div className="flex-1 w-full relative">
                   <label className="text-xs font-semibold text-slate-500 mb-1 block">Nama Aspek</label>
                   <input 
                     type="text" 
                     value={aspek.nama} 
                     onChange={e => {
                        const newItems = [...items];
                        newItems[i].nama = e.target.value;
                        setter(newItems);
                     }}
                     className="font-bold text-slate-800 bg-white border border-slate-300 w-full p-2 rounded-lg"
                   />
                 </div>
                 <div className="flex items-end h-full gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-medium">Bobot:</span>
                       <input 
                         type="number" 
                         value={aspek.bobot}
                         onChange={e => {
                            const newItems = [...items];
                            newItems[i].bobot = Number(e.target.value);
                            setter(newItems);
                         }}
                         className="w-20 p-2 border border-slate-300 rounded-lg text-center text-sm bg-white font-bold" 
                       />
                       <span className="text-sm font-medium">%</span>
                    </div>
                    <button 
                       onClick={() => setter(items.filter(a => a.id !== aspek.id))}
                       className="text-red-500 hover:text-red-700 bg-red-50 border border-red-100 p-2 rounded-lg"
                    >
                       <Trash2 size={16}/>
                    </button>
                 </div>
               </div>
               
               <div>
                 <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-500">Daftar Kriteria Indikator (Nilai 1-5)</label>
                    <button 
                       disabled={false}
                       onClick={() => {
                          const newItems = [...items];
                          newItems[i].indikator.push({ id: Math.random().toString(), deskripsi: "Indikator Baru" });
                          setter(newItems);
                       }}
                       className="text-xs bg-slate-200 px-2.5 py-1 rounded font-semibold text-slate-700 hover:bg-slate-300"
                    >
                       + Tambah Indikator
                    </button>
                 </div>
                 <div className="space-y-2">
                    {aspek.indikator.map((ind, j) => (
                       <div key={ind.id} className="flex gap-2 relative">
                         <div className="w-1.5 bg-blue-500 rounded-l-sm"></div>
                         <input
                           type="text"
                           value={ind.deskripsi}
                           onChange={e => {
                              const newItems = [...items];
                              newItems[i].indikator[j].deskripsi = e.target.value;
                              setter(newItems);
                           }}
                           className="flex-1 border-y border-r border-slate-300 bg-white p-2 text-sm rounded-r-lg"
                         />
                         <button 
                           onClick={() => {
                              const newItems = [...items];
                              newItems[i].indikator = newItems[i].indikator.filter(x => x.id !== ind.id);
                              setter(newItems);
                           }}
                           className="text-slate-400 hover:text-red-500 p-2 font-bold text-lg"
                         >
                           &times;
                         </button>
                       </div>
                    ))}
                 </div>
               </div>
             </div>
          ))}

          <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-xl mt-6">
             <span className="font-semibold text-blue-900">Total Akumulasi Bobot Internal</span>
             <span className={`font-extrabold text-xl ${calculateTotal(items) === 100 ? 'text-blue-700' : 'text-red-600'}`}>
                {calculateTotal(items)}%
             </span>
          </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12 text-sm">
      <div className="bg-slate-900 rounded-xl p-6 text-slate-300 shadow-lg border border-slate-800">
         <h2 className="text-lg font-bold text-white mb-1">Pengaturan Penilaian Terintegrasi (1 Tahap Lomba)</h2>
         <p className="text-xs opacity-80 leading-relaxed">
            Sistem saat ini dikonfigurasi menggunakan skema satu tahap tunggal. Skor akhir dihitung secara otomatis menggunakan gabungan aspek <b>Media Pembelajaran (Kontribusi Lomba 60%)</b> dan aspek <b>Presentasi (Kontribusi Lomba 40%)</b>.
         </p>
      </div>

      {renderEditor("Kriteria Kelompok 1: Media Pembelajaran (Kontribusi Lomba 60%)", localMedia, setLocalMedia)}
      {renderEditor("Kriteria Kelompok 2: Presentasi (Kontribusi Lomba 40%)", localPresentasi, setLocalPresentasi)}

      <div className="sticky bottom-6 flex justify-end">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
          >
             <Save size={18} /> Simpan Pengaturan Kriteria
          </button>
      </div>
    </div>
  );
}

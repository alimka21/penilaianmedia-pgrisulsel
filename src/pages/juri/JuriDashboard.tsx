import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const logoPgri = "https://upload.wikimedia.org/wikipedia/commons/2/2a/Persatuan_Guru_Republik_Indonesia.png";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore, Peserta, Aspek } from "@/store/useDataStore";
import { getStatus } from "@/lib/scoreUtils";
import { LogOut, ListTodo, CheckCircle2, XCircle, FileText, Play, ArrowLeft, Maximize, ChevronDown, ChevronUp } from "lucide-react";
import Swal from 'sweetalert2';

export function JuriDashboard() {
  const { user, logout } = useAuthStore();
  const { pesertaList, updatePenilaianMedia, updatePenilaianPresentasi, aspekMedia, aspekPresentasi } = useDataStore();
  const navigate = useNavigate();
  
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  
  // Store dynamic scores based on aspect id
  const [formScores, setFormScores] = useState<Record<string, number>>({});
  
  const [expandedAspekIds, setExpandedAspekIds] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleAspek = (id: string) => {
    setExpandedAspekIds(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Keluar?',
      text: "Anda akan keluar dari sesi juri.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate("/");
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Keluar',
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  };

  if (!user || user.role === "admin") return null;

  const isPresentasi = user.role === 'juri-presentasi';
  const juriTitle = isPresentasi ? 'Juri Presentasi' : `Juri Media (${user.kategori})`;
  const juriKategori = user.kategori;
  const activeAspek = isPresentasi ? aspekPresentasi : aspekMedia;

  // Filter list: Media judges see their category. Presentasi judges see everyone who completed media judging.
  // We can just show everyone to Presentasi judges, or everyone who is done with Media. Let's say presentasi judges see everyone.
  const filteredPeserta = isPresentasi 
      ? pesertaList 
      : pesertaList.filter(p => p.kategori === juriKategori);

  const handleSelectPeserta = (p: Peserta) => {
    setSelectedPeserta(p);
    // Initialize scores based on existing if any
    const existingPenilaian = isPresentasi 
      ? p.penilaianPresentasi?.[user.username]?.scores 
      : p.penilaianMedia?.[user.username]?.scores;
      
    if (existingPenilaian) {
       setFormScores({ ...existingPenilaian });
    } else {
       const initialScores: Record<string, number> = {};
       activeAspek.forEach(a => initialScores[a.id] = 0);
       setFormScores(initialScores);
    }
  };

  const handleScoreChange = (aspekId: string, value: number) => {
     setFormScores(prev => ({ ...prev, [aspekId]: value }));
  };

  const handleSavePenilaian = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPeserta) {
       if (isPresentasi) {
          updatePenilaianPresentasi(selectedPeserta.id, user.username, formScores);
       } else {
          updatePenilaianMedia(selectedPeserta.id, user.username, formScores);
       }
       setSelectedPeserta(null);
       Swal.fire({
         icon: 'success',
         title: 'Tersimpan',
         text: 'Penilaian berhasil disimpan!',
         timer: 1500,
         showConfirmButton: false
       });
    }
  };

  const calculateFinalLocal = () => {
      let total = 0;
      activeAspek.forEach(a => {
         const score = formScores[a.id] || 0;
         total += (score * (a.bobot / 100));
      });
      return total;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <img 
                 src={logoPgri} 
                 alt="Logo PGRI" 
                 className="w-10 h-10 object-contain rounded-full border border-slate-100 p-0.5 shadow-sm"
              />
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none">Dasbor Juri</h1>
                <p className="text-xs text-slate-500 mt-1">{juriTitle}</p>
              </div>
           </div>
           
           <button 
             onClick={handleLogout}
             className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
           >
             <LogOut size={16} />
             Keluar
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0 ${selectedPeserta ? '' : 'max-w-7xl'}`}>
        
        {selectedPeserta ? (
           // TAMPILAN PENILAIAN
           <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
             <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                 <button onClick={() => setSelectedPeserta(null)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
                    <ArrowLeft size={16} /> Kembali ke Daftar
                 </button>
                 <div className="font-semibold text-slate-900">{selectedPeserta.namaPeserta} - {selectedPeserta.namaMedia}</div>
             </div>
             <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Visual Media Viewer */}
                <div className={`border-r border-slate-200 bg-slate-100 p-6 flex flex-col items-center justify-center overflow-y-auto transition-all ${isFullscreen ? 'fixed inset-0 z-50 bg-black/90' : 'flex-1'}`}>
                   {isFullscreen && (
                      <button onClick={() => setIsFullscreen(false)} className="absolute top-4 right-4 text-white hover:text-slate-300">
                         <XCircle size={32} />
                      </button>
                   )}
                   <div className={`${isFullscreen ? 'w-full max-w-5xl h-[80vh]' : 'max-w-full w-full aspect-video'} bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 mb-6 relative overflow-hidden shadow-lg group`}>
                       {getYoutubeEmbedUrl(selectedPeserta.linkYoutube) ? (
                           <iframe 
                             src={getYoutubeEmbedUrl(selectedPeserta.linkYoutube)!} 
                             className="w-full h-full border-0" 
                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                             allowFullScreen
                           />
                       ) : (
                           <>
                             <Play size={48} className="opacity-50" />
                             <div className="absolute bottom-4 left-4 right-4 text-center text-xs opacity-70">
                                (Tidak dapat memuat embed YouTube otomatis: {selectedPeserta.linkYoutube})
                             </div>
                           </>
                       )}
                       {!isFullscreen && (
                           <button onClick={() => setIsFullscreen(true)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                               <Maximize size={20} />
                           </button>
                       )}
                   </div>
                   <div className="flex gap-4">
                      <a href={selectedPeserta.linkYoutube} target="_blank" rel="noreferrer" className={`flex items-center gap-2 px-4 py-2 ${isFullscreen ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-200'} rounded-lg shadow-sm border hover:bg-slate-50 hover:text-slate-900 transition`}>
                         <Play size={16} className={isFullscreen ? "text-red-400" : "text-red-600"} /> Buka di YouTube
                      </a>
                      <a href={selectedPeserta.linkRpp} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition">
                         <FileText size={16} className="text-blue-600" /> Buka RPP
                      </a>
                   </div>
                </div>

                {/* Penilaian Form */}
                <div className="w-full lg:w-[400px] flex flex-col items-stretch bg-white shrink-0">
                    <div className="p-6 pb-2 shrink-0 border-b border-slate-100">
                        <h3 className="font-bold text-lg">Form Penilaian ({isPresentasi ? 'Tahap Presentasi' : 'Tahap Media'})</h3>
                        <p className="text-xs text-slate-500 mt-1">Bobot Total: 100% dari tahap ini.</p>
                    </div>
                    <form id="penilaian-form" onSubmit={handleSavePenilaian} className="flex-1 overflow-y-auto p-6 space-y-4">
                        {activeAspek.map(aspek => {
                            const isExpanded = expandedAspekIds.includes(aspek.id);
                            return (
                             <div key={aspek.id} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden transition-all">
                                <div 
                                   className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-100"
                                   onClick={() => toggleAspek(aspek.id)}
                                >
                                   <div className="flex items-center gap-2">
                                     <button type="button" className="text-slate-400 p-1 hover:text-slate-700">
                                       {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                     </button>
                                     <label className="text-sm font-bold text-slate-800 cursor-pointer">{aspek.nama}</label>
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{aspek.bobot}%</span>
                                   </div>
                                </div>
                                {isExpanded && (
                                  <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                                     <ul className="list-disc list-inside text-xs text-slate-500 mb-4 space-y-1">
                                        {aspek.indikator.map(ind => (
                                           <li key={ind.id}>{ind.deskripsi}</li>
                                        ))}
                                     </ul>
                                  </div>
                                )}
                                <div className="px-4 pb-4 flex items-center justify-end gap-3 pt-2">
                                      <span className="text-xs font-medium text-slate-600">Nilai (0-100):</span>
                                      <input type="number" min="0" max="100" required 
                                         className="w-20 border border-slate-300 p-2 rounded-lg text-sm bg-white font-medium text-center focus:ring-2 focus:ring-blue-500 outline-none" 
                                         value={formScores[aspek.id] || 0} 
                                         onChange={e => handleScoreChange(aspek.id, Number(e.target.value))} 
                                         onClick={e => e.stopPropagation()}
                                      />
                                </div>
                             </div>
                            );
                        })}
                    </form>
                    <div className="shrink-0 pt-4 border-t border-slate-100 flex justify-between items-center bg-white p-6 sticky bottom-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                        <div>
                           <p className="text-xs font-medium text-slate-500 mb-1">Sub-total Tahap Ini</p>
                           <p className="text-2xl font-bold text-slate-900">{calculateFinalLocal().toFixed(2)}</p>
                        </div>
                        <button form="penilaian-form" type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm">
                           Simpan Penilaian
                        </button>
                    </div>
                </div>
             </div>
           </div>
        ) : (
           // DAFTAR PESERTA
           <div>
             <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900">Daftar Peserta</h2>
                <p className="text-slate-500 mt-1">
                   {isPresentasi 
                      ? 'Silakan pilih peserta yang sedang melangsungkan presentasi.' 
                      : `Pilih peserta di Kategori ${juriKategori} untuk melakukan penilaian karya.`
                   }
                </p>
             </div>

             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Nama Peserta / Media</th>
                      {isPresentasi && <th className="px-6 py-4">Kategori</th>}
                      <th className="px-6 py-4 text-center">Berkas</th>
                      <th className="px-6 py-4 text-center">Status Keseluruhan</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPeserta.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            Belum ada peserta yang perlu dinilai.
                         </td>
                       </tr>
                    ) : filteredPeserta.map((p) => {
                       const linksLengkap = p.linkYoutube && p.linkRpp && p.linkMedia;
                       // Check if current user already scored this stage
                       const sudahDinilaiSaya = isPresentasi 
                         ? !!p.penilaianPresentasi?.[user.username]
                         : !!p.penilaianMedia?.[user.username];
                         
                       return (
                         <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${sudahDinilaiSaya ? 'bg-slate-50/50' : ''}`}>
                           <td className="px-6 py-4">
                             <div className="font-medium text-slate-900">{p.namaPeserta}</div>
                             <div className="text-xs text-slate-500 truncate max-w-[250px]" title={p.namaMedia}>{p.namaMedia}</div>
                           </td>
                           {isPresentasi && (
                             <td className="px-6 py-4 font-semibold text-xs text-indigo-700">
                               <span className="bg-indigo-50 px-2 py-1 rounded">{p.kategori}</span>
                             </td>
                           )}
                           <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-1.5 focus:outline-none">
                                {linksLengkap ? (
                                   <CheckCircle2 size={16} className="text-green-500" />
                                ) : (
                                   <XCircle size={16} className="text-red-500" />
                                )}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                                 {getStatus(p)}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                             <button
                               disabled={!linksLengkap}
                               onClick={() => handleSelectPeserta(p)}
                               className={`font-medium px-4 py-1.5 rounded-lg transition-colors shadow-sm ${
                                  !linksLengkap 
                                   ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                   : sudahDinilaiSaya
                                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer'
                               }`}
                             >
                               {sudahDinilaiSaya ? 'Edit Nilai' : 'Beri Nilai'}
                             </button>
                           </td>
                         </tr>
                       )
                    })}
                  </tbody>
                </table>
             </div>
           </div>
        )}
      </main>
    </div>
  );
}

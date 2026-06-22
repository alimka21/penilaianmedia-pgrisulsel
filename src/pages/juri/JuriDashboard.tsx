import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const logoPgri = "https://upload.wikimedia.org/wikipedia/commons/2/2a/Persatuan_Guru_Republik_Indonesia.png";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore, Peserta, Aspek } from "@/store/useDataStore";
import { getStatus } from "@/lib/scoreUtils";
import { LogOut, ListTodo, CheckCircle2, XCircle, FileText, Play, ArrowLeft, Maximize, ChevronDown, ChevronUp, Monitor } from "lucide-react";
import Swal from 'sweetalert2';

export function JuriDashboard() {
  const { user, logout } = useAuthStore();
  const { pesertaList, updatePenilaianMedia, updatePenilaianPresentasi, aspekMedia, aspekPresentasi, juriList } = useDataStore();
  const navigate = useNavigate();
  
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  const [formScores, setFormScores] = useState<Record<string, number>>({});
  const [expandedAspekIds, setExpandedAspekIds] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle dropdown / accordions for criteria
  const toggleAspek = (id: string) => {
    setExpandedAspekIds(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const getMediaEmbedUrl = (url: string) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^\/]+)\//i);
    if (driveMatch) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    return null;
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

  // Resolve current jury account & assigned aspect parameters
  const currentJuri = juriList.find(j => j.username === user.username);
  const juriKategori = currentJuri ? currentJuri.kategori : (user.kategori || 'Semua');
  const allowedMediaIds = currentJuri?.aspekMediaIds || [];

  // Allowed aspects to evaluate
  const juriMediaAspek = aspekMedia.filter(a => allowedMediaIds.includes(a.id));
  const juriPresentasiAspek = aspekPresentasi; // presentasi is fully open
  const activeAspek = [...juriMediaAspek, ...juriPresentasiAspek];

  // Auto-expand all aspects for convenience on entry
  useEffect(() => {
    if (activeAspek.length > 0) {
      setExpandedAspekIds(activeAspek.map(a => a.id));
    }
  }, [selectedPeserta]);

  // Filter participant list based on category jenjang
  const filteredPeserta = juriKategori === 'Semua'
      ? pesertaList 
      : pesertaList.filter(p => p.kategori === juriKategori);

  const handleSelectPeserta = (p: Peserta) => {
    setSelectedPeserta(p);
    
    // Combine existing ratings for Media and Presentasi
    const existingMedia = p.penilaianMedia?.[user.username]?.scores || {};
    const existingPresentasi = p.penilaianPresentasi?.[user.username]?.scores || {};
    const combinedScores = { ...existingMedia, ...existingPresentasi };
    
    // Default initial scores if unassessed
    activeAspek.forEach(a => {
      a.indikator.forEach(ind => {
        if (combinedScores[ind.id] === undefined) {
          combinedScores[ind.id] = 0;
        }
      });
    });
    setFormScores(combinedScores);
  };

  const handleScoreChange = (indId: string, value: number) => {
     setFormScores(prev => ({ ...prev, [indId]: value }));
  };

  const handleSavePenilaian = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPeserta) {
        let isValid = true;
        for (const a of activeAspek) {
           for (const ind of a.indikator) {
              if (!formScores[ind.id] || formScores[ind.id] === 0) {
                 isValid = false;
                 break;
              }
           }
           if (!isValid) break;
        }

        if (!isValid) {
           Swal.fire({
             icon: 'warning',
             title: 'Penilaian Belum Lengkap',
             text: 'Mohon isi semua indikator penilaian (wajib) sebelum menyimpan.',
           });
           return;
        }

        // Split form scores back to Media and Presentasi buckets
        const mediaScores: Record<string, number> = {};
        const presentasiScores: Record<string, number> = {};

        juriMediaAspek.forEach(a => {
           a.indikator.forEach(ind => {
              if (formScores[ind.id] !== undefined) {
                 mediaScores[ind.id] = formScores[ind.id];
              }
           });
        });

        juriPresentasiAspek.forEach(a => {
           a.indikator.forEach(ind => {
              if (formScores[ind.id] !== undefined) {
                 presentasiScores[ind.id] = formScores[ind.id];
              }
           });
        });

        // Submit to firestore via store
        updatePenilaianMedia(selectedPeserta.id, user.username, mediaScores);
        updatePenilaianPresentasi(selectedPeserta.id, user.username, presentasiScores);

        setSelectedPeserta(null);
        Swal.fire({
          icon: 'success',
          title: 'Tersimpan',
          text: 'Penilaian integrasi berhasil disimpan!',
          timer: 1500,
          showConfirmButton: false
        });
    }
  };

  const calculateFinalLocal = () => {
     let mediaWeightedSum = 0;
     let presentasiWeightedSum = 0;
     
     juriMediaAspek.forEach(a => {
        const numIndikator = a.indikator.length;
        if (numIndikator > 0) {
           let sumIndikator = 0;
           a.indikator.forEach(ind => {
              sumIndikator += (formScores[ind.id] || 0);
           });
           const aspectScore100 = (sumIndikator / (numIndikator * 5)) * 100;
           mediaWeightedSum += (aspectScore100 * (a.bobot / 100));
        }
     });

     juriPresentasiAspek.forEach(a => {
        const numIndikator = a.indikator.length;
        if (numIndikator > 0) {
           let sumIndikator = 0;
           a.indikator.forEach(ind => {
              sumIndikator += (formScores[ind.id] || 0);
           });
           const aspectScore100 = (sumIndikator / (numIndikator * 5)) * 100;
           presentasiWeightedSum += (aspectScore100 * (a.bobot / 100));
        }
     });

     // Combine Media (60%) & Presentasi (40%)
     if (juriMediaAspek.length === 0) {
        return presentasiWeightedSum; // Handle if they only have Presentasi role setup
     }
     return (mediaWeightedSum * 0.6) + (presentasiWeightedSum * 0.4);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-sm">
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
                <h1 className="text-sm font-bold text-slate-900 leading-none">Dasbor Dewan Juri</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Kategori: <b className="text-blue-600">{juriKategori}</b>
                </p>
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
           // SCORES ENTRY
           <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                  <button onClick={() => setSelectedPeserta(null)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
                     <ArrowLeft size={16} /> Kembali ke Daftar
                  </button>
                  <div className="font-semibold text-slate-900">{selectedPeserta.namaPeserta} - {selectedPeserta.namaMedia}</div>
             </div>
             <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50">
                {/* Visual Media Viewer */}
                <div className={`border-b border-slate-200 bg-slate-100 p-6 flex flex-col items-center justify-center transition-all ${isFullscreen ? 'fixed inset-0 z-50 bg-black/90' : 'shrink-0'}`}>
                   {isFullscreen && (
                      <button onClick={() => setIsFullscreen(false)} className="absolute top-4 right-4 text-white hover:text-slate-300">
                         <XCircle size={32} />
                      </button>
                   )}
                   <div className={`${isFullscreen ? 'w-full max-w-5xl h-[80vh]' : 'max-w-2xl w-full aspect-video'} bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 mb-6 relative overflow-hidden shadow-lg group`}>
                       {getMediaEmbedUrl(selectedPeserta.linkYoutube) ? (
                           <iframe 
                             src={getMediaEmbedUrl(selectedPeserta.linkYoutube)!} 
                             className="w-full h-full border-0" 
                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                             allowFullScreen
                           />
                       ) : (
                           <>
                             <Play size={48} className="opacity-50" />
                             <div className="absolute bottom-4 left-4 right-4 text-center text-xs opacity-70">
                                (Tidak dapat memuat embed otomatis: {selectedPeserta.linkYoutube})
                             </div>
                           </>
                       )}
                       {!isFullscreen && (
                           <button onClick={() => setIsFullscreen(true)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                               <Maximize size={20} />
                           </button>
                       )}
                   </div>
                   <div className="flex flex-wrap gap-4 justify-center">
                      <a href={selectedPeserta.linkYoutube} target="_blank" rel="noreferrer" className={`flex items-center gap-2 px-4 py-2 ${isFullscreen ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-200'} rounded-lg shadow-sm border hover:bg-slate-50 hover:text-slate-900 transition`}>
                         <Play size={16} className={isFullscreen ? "text-red-400" : "text-red-600"} /> Buka Video di Tab Baru
                      </a>
                      <a href={selectedPeserta.linkRpp} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition">
                         <FileText size={16} className="text-blue-600" /> Buka RPP
                      </a>
                      <a href={selectedPeserta.linkMedia} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition">
                         <Monitor size={16} className="text-indigo-600" /> Buka Media
                      </a>
                   </div>
                </div>

                {/* Penilaian Form */}
                <div className="w-full max-w-4xl mx-auto flex flex-col items-stretch bg-white border-x border-slate-200 min-h-full">
                    <div className="p-6 pb-2 shrink-0 border-b border-slate-100">
                        <h3 className="font-bold text-lg">Format Penilaian Terintegrasi (1 Tahap Lomba)</h3>
                        <p className="text-xs text-slate-500 mt-1 mb-3">
                           Anda menilai aspek <b>Media Lomba</b> yang ditugaskan kepada Anda, serta menilai aspek <b>Presentasi</b>.
                        </p>
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 space-y-1 mb-2">
                          <p className="font-bold">Keterangan Skor Penilaian (1-5):</p>
                          <ul className="grid grid-cols-2 md:grid-cols-5 gap-x-2 gap-y-1 ml-1 text-[11px] font-medium">
                            <li><b>1</b> = Sangat Kurang</li>
                            <li><b>2</b> = Kurang</li>
                            <li><b>3</b> = Cukup</li>
                            <li><b>4</b> = Baik</li>
                            <li><b>5</b> = Sangat Baik</li>
                          </ul>
                        </div>
                    </div>
                    
                    <form id="penilaian-form" onSubmit={handleSavePenilaian} className="flex-1 p-6 space-y-6">
                        {/* SECTION: MEDIA CRITERIA */}
                        {juriMediaAspek.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">Media Penilaian (Kontribusi 60%)</h4>
                            <div className="space-y-4">
                              {juriMediaAspek.map(aspek => {
                                  const isExpanded = expandedAspekIds.includes(aspek.id);
                                  return (
                                   <div key={aspek.id} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden transition-all shadow-sm">
                                      <div 
                                         className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-100 bg-slate-100/50"
                                         onClick={() => toggleAspek(aspek.id)}
                                      >
                                         <div className="flex items-center gap-2">
                                           <span className="text-slate-400 p-1">
                                             {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                           </span>
                                           <label className="text-sm font-semibold text-slate-800 cursor-pointer">{aspek.nama}</label>
                                         </div>
                                         <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">{aspek.bobot}% Weight</span>
                                      </div>
                                      
                                      {isExpanded && (
                                        <div className="p-4 border-t border-slate-100 bg-white">
                                           <div className="space-y-4">
                                              {aspek.indikator.map(ind => (
                                                 <div key={ind.id} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 transition-all hover:bg-white">
                                                    <p className="text-sm font-medium text-slate-800 mb-3">{ind.deskripsi}</p>
                                                    <div className="flex gap-2">
                                                       {[
                                                         { v: 1, label: 'Sangat Kurang' },
                                                         { v: 2, label: 'Kurang' },
                                                         { v: 3, label: 'Cukup' },
                                                          { v: 4, label: 'Baik' },
                                                          { v: 5, label: 'Sangat Baik' }
                                                       ].map(({ v, label }) => (
                                                          <button
                                                             key={v}
                                                             type="button"
                                                             onClick={() => handleScoreChange(ind.id, v)}
                                                             className={`flex-1 min-w-0 flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all shadow-sm ${
                                                                formScores[ind.id] === v 
                                                                   ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600 outline-none' 
                                                                   : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:bg-slate-100'
                                                             }`}
                                                          >
                                                             <span className="text-lg font-bold block leading-none mb-1">{v}</span>
                                                             <span className="text-[10px] text-center leading-tight">{label}</span>
                                                          </button>
                                                       ))}
                                                    </div>
                                                 </div>
                                              ))}
                                           </div>
                                        </div>
                                      )}
                                   </div>
                                  );
                              })}
                            </div>
                          </div>
                        )}

                        {/* SECTION: PRESENTATION CRITERIA */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-6 mb-3 block">Presentasi Penilaian (Kontribusi 40%)</h4>
                          <div className="space-y-4">
                            {juriPresentasiAspek.map(aspek => {
                                const isExpanded = expandedAspekIds.includes(aspek.id);
                                return (
                                 <div key={aspek.id} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden transition-all shadow-sm">
                                    <div 
                                       className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-100 bg-sky-50"
                                       onClick={() => toggleAspek(aspek.id)}
                                    >
                                       <div className="flex items-center gap-2">
                                         <span className="text-slate-400 p-1">
                                           {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                         </span>
                                         <label className="text-sm font-semibold text-slate-800 cursor-pointer">{aspek.nama}</label>
                                       </div>
                                       <span className="text-xs font-semibold bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full">{aspek.bobot}% Weight</span>
                                    </div>
                                    
                                    {isExpanded && (
                                      <div className="p-4 border-t border-slate-100 bg-white">
                                         <div className="space-y-4">
                                            {aspek.indikator.map(ind => (
                                               <div key={ind.id} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 transition-all hover:bg-white">
                                                  <p className="text-sm font-medium text-slate-800 mb-3">{ind.deskripsi}</p>
                                                  <div className="flex gap-2">
                                                     {[
                                                       { v: 1, label: 'Sangat Kurang' },
                                                       { v: 2, label: 'Kurang' },
                                                       { v: 3, label: 'Cukup' },
                                                        { v: 4, label: 'Baik' },
                                                        { v: 5, label: 'Sangat Baik' }
                                                     ].map(({ v, label }) => (
                                                        <button
                                                           key={v}
                                                           type="button"
                                                           onClick={() => handleScoreChange(ind.id, v)}
                                                           className={`flex-1 min-w-0 flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all shadow-sm ${
                                                              formScores[ind.id] === v 
                                                                 ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600' 
                                                                 : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:bg-slate-100'
                                                           }`}
                                                        >
                                                           <span className="text-lg font-bold block leading-none mb-1">{v}</span>
                                                           <span className="text-[10px] text-center leading-tight">{label}</span>
                                                        </button>
                                                     ))}
                                                  </div>
                                               </div>
                                            ))}
                                         </div>
                                      </div>
                                    )}
                                 </div>
                                );
                            })}
                          </div>
                        </div>
                    </form>

                    <div className="shrink-0 pt-4 border-t border-slate-100 flex justify-between items-center bg-white p-6 sticky bottom-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                        <div>
                           <p className="text-xs font-medium text-slate-500 mb-1">Kalkulasi Skor Lokal (Estimasi)</p>
                           <p className="text-2xl font-bold text-slate-900">{calculateFinalLocal().toFixed(2)}</p>
                        </div>
                        <button form="penilaian-form" type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all text-sm">
                           Simpan & Kirim Nilai
                        </button>
                    </div>
                </div>
             </div>
           </div>
        ) : (
           // PARTICIPANTS LIST
           <div>
             <div className="mb-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Peserta Lomba Jenjang {juriKategori}</h2>
                  <p className="text-slate-500 mt-1">
                     Silakan pilih peserta untuk menginput penilaian aspek yang ditugaskan kepada Anda.
                  </p>
                </div>
                <div className="bg-slate-100/80 px-4 py-2.5 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 block uppercase mb-1">Tugas Nilai Media Anda:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                     {allowedMediaIds.length > 0 ? (
                       aspekMedia.filter(a => allowedMediaIds.includes(a.id)).map(a => (
                         <span key={a.id} className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                           {a.nama}
                         </span>
                       ))
                     ) : (
                       <span className="text-xs font-semibold text-slate-600">Hanya Presentasi</span>
                     )}
                  </div>
                </div>
             </div>

             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                <table className="w-full text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Nama Peserta / Media</th>
                      <th className="px-6 py-4 text-center">Persyaratan Berkas</th>
                      <th className="px-6 py-4 text-center">Status Anda</th>
                      <th className="px-6 py-4 text-center">Status Umum</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPeserta.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            Belum ada peserta terdaftar untuk jenjang kategori ini.
                         </td>
                       </tr>
                    ) : filteredPeserta.map((p) => {
                       const linksLengkap = p.linkYoutube && p.linkRpp && p.linkMedia;
                       // Verify if current logged-in jury has scored both media (at least one) and presentasi parameters
                       const hasMediaScore = p.penilaianMedia?.[user.username];
                       const hasPresentasiScore = p.penilaianPresentasi?.[user.username];
                       const sudahDinilaiSaya = !!hasMediaScore || !!hasPresentasiScore;
                       
                       return (
                         <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${sudahDinilaiSaya ? 'bg-slate-50/30' : ''}`}>
                           <td className="px-6 py-4">
                             <div className="font-semibold text-slate-900">{p.namaPeserta}</div>
                             <div className="text-xs text-slate-500 truncate max-w-[280px] mt-0.5" title={p.namaMedia}>{p.namaMedia}</div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-1.5 font-medium">
                                {linksLengkap ? (
                                   <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                     <CheckCircle2 size={13} className="text-green-600" /> Lengkap
                                   </span>
                                ) : (
                                   <span className="inline-flex items-center gap-1.5 text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">
                                     <XCircle size={13} className="text-red-600" /> Belum Lengkap
                                   </span>
                                )}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              {sudahDinilaiSaya ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-full border border-emerald-200">
                                   Sudah Dinilai
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-amber-700 bg-amber-50 rounded-full border border-amber-100">
                                   Belum Dinilai
                                </span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                 {getStatus(p)}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                             <button
                               disabled={!linksLengkap}
                               onClick={() => handleSelectPeserta(p)}
                               className={`font-semibold text-xs px-4 py-2 rounded-lg transition-all shadow-sm ${
                                  !linksLengkap 
                                   ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                   : sudahDinilaiSaya
                                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer'
                                      : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
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

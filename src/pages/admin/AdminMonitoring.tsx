import React, { useState } from "react";
import { useDataStore, Kategori } from "@/store/useDataStore";
import { calculateNilaiAkhir, getStatus, calculateNilaiTahap } from "@/lib/scoreUtils";
import { Download } from "lucide-react";

export function AdminMonitoring() {
  const { pesertaList, aspekMedia, aspekPresentasi } = useDataStore();
  const [activeKategori, setActiveKategori] = useState<Kategori | 'ALL'>('ALL');
  const [tahapFilter, setTahapFilter] = useState<'ALL' | 'MEDIA' | 'PRESENTASI'>('ALL');

  // Filter peserta by category
  const filteredPeserta = activeKategori === 'ALL' 
    ? pesertaList 
    : pesertaList.filter(p => p.kategori === activeKategori);

  // Kalkulasi nilai berdasar tahap
  const getScore = (p: any) => {
     if (tahapFilter === 'MEDIA') return calculateNilaiTahap(p.penilaianMedia, aspekMedia);
     if (tahapFilter === 'PRESENTASI') return calculateNilaiTahap(p.penilaianPresentasi, aspekPresentasi);
     return calculateNilaiAkhir(p, aspekMedia, aspekPresentasi);
  };

  // Peringkat (sorted)
  const rankedPeserta = [...filteredPeserta].sort((a, b) => getScore(b) - getScore(a));

  // Export ke Excel (CSV)
  const handleExport = () => {
    const headers = [
      "Peringkat", "Nama Peserta", "Asal Sekolah", "Kabupaten/Kota", "Kategori", "Nama Media", 
      "Nilai Media", "Nilai Presentasi", "Nilai Akhir", "Status"
    ];
    
    const rows = rankedPeserta.map((p, index) => {
      const nMedia = calculateNilaiTahap(p.penilaianMedia, aspekMedia).toFixed(2);
      const nPresentasi = calculateNilaiTahap(p.penilaianPresentasi, aspekPresentasi).toFixed(2);
      const nAkhir = calculateNilaiAkhir(p, aspekMedia, aspekPresentasi).toFixed(2);
      const status = getStatus(p);
      
      return [
        index + 1,
        `"${p.namaPeserta}"`,
        `"${p.namaSekolah}"`,
        `"${p.kabupatenKota}"`,
        p.kategori,
        `"${p.namaMedia}"`,
        nMedia,
        nPresentasi,
        nAkhir,
        `"${status}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Nilai_${activeKategori}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Progres Kab/Kota
  const progresData = pesertaList.reduce((acc, p) => {
    if (!acc[p.kabupatenKota]) {
      acc[p.kabupatenKota] = { total: 0, dinilai: 0, kab: p.kabupatenKota };
    }
    acc[p.kabupatenKota].total += 1;
    
    if (Object.keys(p.penilaianMedia || {}).length > 0) {
      acc[p.kabupatenKota].dinilai += 1;
    }
    return acc;
  }, {} as Record<string, { total: number, dinilai: number, kab: string }>);

  const progresList = Object.values(progresData);

  return (
    <div className="space-y-8">
      {/* SECTION: Progres per Kab/Kota */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6">
         <h2 className="text-lg font-bold text-slate-900 mb-4">Progres Penilaian Per Kabupaten/Kota</h2>
         
         {progresList.length === 0 ? (
            <div className="text-center text-slate-500 py-4">Belum ada data progres.</div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progresList.map(item => {
                 const percentage = Math.round((item.dinilai / item.total) * 100) || 0;
                 return (
                   <div key={item.kab} className="border border-slate-200 rounded-lg p-4">
                      <div className="font-semibold text-slate-800 mb-1">{item.kab}</div>
                      <div className="flex justify-between text-sm text-slate-500 mb-2">
                         <span>{item.dinilai} / {item.total} Dinilai</span>
                         <span>{percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div 
                           className={`h-full ${percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                           style={{ width: `${percentage}%` }}
                         />
                      </div>
                   </div>
                 );
              })}
            </div>
         )}
      </div>

      {/* SECTION: Tabel Peringkat */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Tabel Rekapitulasi & Peringkat</h2>
              <div className="flex flex-wrap gap-2">
                 <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                    {[
                      { id: 'ALL', label: 'Semua Tahap' },
                      { id: 'MEDIA', label: 'Tahap 1 (Media)' },
                      { id: 'PRESENTASI', label: 'Tahap 2 (Presentasi)' }
                    ].map(t => (
                       <button
                         key={t.id}
                         onClick={() => setTahapFilter(t.id as any)}
                         className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${tahapFilter === t.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                       >
                          {t.label}
                       </button>
                    ))}
                 </div>
                 
                 <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                    {['ALL', 'GURU SD/MI/SEDERAJAT', 'GURU SMP/MTS/SEDERAJAT', 'GURU SMA/SMK/MA/SEDERAJAT', 'GURU SLB'].map(k => (
                       <button
                         key={k}
                         onClick={() => setActiveKategori(k as Kategori | 'ALL')}
                         className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeKategori === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                       >
                          {k}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
           
           <button 
             onClick={handleExport}
             className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition shadow-sm whitespace-nowrap"
           >
             <Download size={16} /> Export Excel
           </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-16 text-center">Rank</th>
                <th className="px-6 py-4">Nama Peserta</th>
                <th className="px-6 py-4">Sekolah / Asal</th>
                <th className="px-6 py-4">Kategori</th>
                {tahapFilter === 'ALL' && (
                   <>
                     <th className="px-6 py-4 text-center">Nilai Tahap 1</th>
                     <th className="px-6 py-4 text-center">Nilai Tahap 2</th>
                   </>
                )}
                {tahapFilter === 'MEDIA' && <th className="px-6 py-4 text-center">Nilai Tahap 1</th>}
                {tahapFilter === 'PRESENTASI' && <th className="px-6 py-4 text-center">Nilai Tahap 2</th>}
                {tahapFilter === 'ALL' && <th className="px-6 py-4 text-center">Nilai Akhir</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankedPeserta.length === 0 ? (
                 <tr>
                   <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      Belum ada data peserta untuk ditampilkan.
                   </td>
                 </tr>
              ) : rankedPeserta.map((p, index) => {
                 const score = getScore(p);
                 return (
                   <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4 text-center font-bold text-slate-900">
                        #{index + 1}
                     </td>
                     <td className="px-6 py-4">
                       <div className="font-medium text-slate-900">{p.namaPeserta}</div>
                       <div className="text-xs text-slate-500 truncate max-w-[250px]">{p.namaMedia}</div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="font-medium text-slate-700">{p.namaSekolah}</div>
                       <div className="text-xs text-slate-500">{p.kabupatenKota}</div>
                     </td>
                     <td className="px-6 py-4">
                       <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                         {p.kategori}
                       </span>
                     </td>
                     
                     {/* Dynamic Columns */}
                     {tahapFilter === 'ALL' && (
                        <>
                          <td className="px-6 py-4 text-center font-medium text-slate-600">{calculateNilaiTahap(p.penilaianMedia, aspekMedia).toFixed(2)}</td>
                          <td className="px-6 py-4 text-center font-medium text-slate-600">{calculateNilaiTahap(p.penilaianPresentasi, aspekPresentasi).toFixed(2)}</td>
                        </>
                     )}
                     {tahapFilter === 'MEDIA' && (
                        <td className="px-6 py-4 text-center font-medium text-slate-600">{calculateNilaiTahap(p.penilaianMedia, aspekMedia).toFixed(2)}</td>
                     )}
                     {tahapFilter === 'PRESENTASI' && (
                        <td className="px-6 py-4 text-center font-medium text-slate-600">{calculateNilaiTahap(p.penilaianPresentasi, aspekPresentasi).toFixed(2)}</td>
                     )}
                     
                     {tahapFilter === 'ALL' && (
                       <td className="px-6 py-4 text-center">
                          {score > 0 ? (
                            <span className="font-bold text-slate-900 text-lg">{score.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-400 text-xs bg-slate-100 px-2 py-1 rounded">Belum Dinilai</span>
                          )}
                          <div className="text-xs text-slate-500 mt-1">{getStatus(p)}</div>
                       </td>
                     )}
                   </tr>
                 );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

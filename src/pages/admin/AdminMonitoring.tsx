import React, { useState } from "react";
import { useDataStore, Kategori } from "@/store/useDataStore";
import { 
  calculateNilaiAkhir, 
  getStatus, 
  calculateCategoryScore, 
  calculateAspectScore, 
  calculateAspectScoreForJuri 
} from "@/lib/scoreUtils";
import { Download } from "lucide-react";

export function AdminMonitoring() {
  const { pesertaList, aspekMedia, aspekPresentasi, juriList, bobotMedia, bobotPresentasi } = useDataStore();
  const [activeKategori, setActiveKategori] = useState<Kategori | 'ALL'>('ALL');

  // Filter peserta by category
  const filteredPeserta = activeKategori === 'ALL' 
    ? pesertaList 
    : pesertaList.filter(p => p.kategori === activeKategori);

  // Kalkulasi nilai akhir
  const getScore = (p: any) => {
     return calculateNilaiAkhir(p, aspekMedia, aspekPresentasi, bobotMedia, bobotPresentasi);
  };

  // Peringkat (sorted by highest final score)
  const rankedPeserta = [...filteredPeserta].sort((a, b) => getScore(b) - getScore(a));

  // Export ke Excel (CSV)
  const handleExport = () => {
    // 1. Dapatkan daftar juri yang relevan dengan kategori peserta yang sedang di-ekspor
    const exportedCategories = new Set<string>(rankedPeserta.map(p => p.kategori));
    const relevantJuries = juriList.filter(juri => 
      exportedCategories.has(juri.kategori) || juri.kategori === 'Semua'
    );

    // Helper untuk memformat kolom CSV dengan aman dari koma atau kutip ganda
    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '""';
      const val = String(str);
      return `"${val.replace(/"/g, '""')}"`;
    };

    // 2. Tentukan Header Utama
    const headers = [
      "Peringkat", 
      "Nama Peserta", 
      "Asal Sekolah", 
      "Kabupaten/Kota", 
      "Kategori", 
      "Nama Media"
    ];

    // Tambah kolom Aspek Media Pembelajaran (60%)
    aspekMedia.forEach(aspek => {
      headers.push(`"Media - ${aspek.nama} (Nilai)"`);
      // Tambah kolom terperinci untuk masing-masing juri
      relevantJuries.forEach(juri => {
         headers.push(`"Media - ${aspek.nama} (Juri: ${juri.name})"`);
      });
    });

    // Tambah kolom Aspek Presentasi (40%)
    aspekPresentasi.forEach(aspek => {
      headers.push(`"Presentasi - ${aspek.nama} (Rata-rata)"`);
      // Tambah kolom terperinci untuk masing-masing juri
      relevantJuries.forEach(juri => {
         headers.push(`"Presentasi - ${aspek.nama} (Juri: ${juri.name})"`);
      });
    });

    // Tambah kolom Total & Status Terintegrasi
    headers.push(`Nilai Akhir Media (${bobotMedia}%)`);
    headers.push(`Nilai Akhir Presentasi (${bobotPresentasi}%)`);
    headers.push("Nilai Akhir Gabungan");
    headers.push("Status Penilaian");

    // 3. Masukkan Data Peserta dan Nilai
    const rows = rankedPeserta.map((p, index) => {
      const rowData = [
        index + 1,
        escapeCSV(p.namaPeserta),
        escapeCSV(p.namaSekolah),
        escapeCSV(p.kabupatenKota),
        p.kategori,
        escapeCSV(p.namaMedia)
      ];

      // Nilai per aspek Media Pembelajaran
      aspekMedia.forEach(aspek => {
         const aspectScore = calculateAspectScore(p.penilaianMedia, aspek);
         rowData.push(aspectScore > 0 ? aspectScore.toFixed(2) : '"-"');

         relevantJuries.forEach(juri => {
            const juriScore = calculateAspectScoreForJuri(p.penilaianMedia, aspek, juri.username);
            rowData.push(juriScore > 0 ? juriScore.toFixed(2) : '"-"');
         });
      });

      // Nilai per aspek Presentasi
      aspekPresentasi.forEach(aspek => {
         const aspectScore = calculateAspectScore(p.penilaianPresentasi, aspek);
         rowData.push(aspectScore > 0 ? aspectScore.toFixed(2) : '"-"');

         relevantJuries.forEach(juri => {
            const juriScore = calculateAspectScoreForJuri(p.penilaianPresentasi, aspek, juri.username);
            rowData.push(juriScore > 0 ? juriScore.toFixed(2) : '"-"');
         });
      });

      // Skor keseluruhan
      const nMedia = calculateCategoryScore(p.penilaianMedia, aspekMedia);
      const nPresentasi = calculateCategoryScore(p.penilaianPresentasi, aspekPresentasi);
      const nAkhir = calculateNilaiAkhir(p, aspekMedia, aspekPresentasi, bobotMedia, bobotPresentasi);
      const status = getStatus(p);

      rowData.push(nMedia > 0 ? nMedia.toFixed(2) : '"-"');
      rowData.push(nPresentasi > 0 ? nPresentasi.toFixed(2) : '"-"');
      rowData.push(nAkhir > 0 ? nAkhir.toFixed(2) : '"-"');
      rowData.push(escapeCSV(status));

      return rowData.join(",");
    });

    // 4. Bangun dan trigger download menggunakan Blob & UTF-8 BOM agar terbaca sempurna di Microsoft Excel (Bahasa Indonesia)
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Nilai_Lengkap_${activeKategori}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Progres Kab/Kota
  const progresData = pesertaList.reduce((acc, p) => {
    if (!acc[p.kabupatenKota]) {
      acc[p.kabupatenKota] = { total: 0, dinilai: 0, kab: p.kabupatenKota };
    }
    acc[p.kabupatenKota].total += 1;
    
    const hasMedia = Object.keys(p.penilaianMedia || {}).length > 0;
    const hasPresentasi = Object.keys(p.penilaianPresentasi || {}).length > 0;
    
    if (hasMedia || hasPresentasi) {
      acc[p.kabupatenKota].dinilai += 1;
    }
    return acc;
  }, {} as Record<string, { total: number, dinilai: number, kab: string }>);

  const progresList = Object.values(progresData);

  return (
    <div className="space-y-8 text-sm">
      {/* SECTION: Progres per Kab/Kota */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6">
         <h2 className="text-lg font-bold text-slate-900 mb-1">Progres Penilaian Per Kabupaten/Kota</h2>
         <p className="text-xs text-slate-500 mb-4">Grafik tingkat penyelesaian penilaian oleh Dewan Juri setempat.</p>
         
         {progresList.length === 0 ? (
            <div className="text-center text-slate-500 py-4">Belum ada data progres.</div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progresList.map(item => {
                 const percentage = Math.round((item.dinilai / item.total) * 100) || 0;
                 return (
                   <div key={item.kab} className="border border-slate-100 rounded-lg p-4 bg-slate-50 shadow-sm">
                      <div className="font-semibold text-slate-800 mb-1">{item.kab}</div>
                      <div className="flex justify-between text-xs text-slate-500 mb-2">
                         <span>{item.dinilai} / {item.total} Peserta dinilai</span>
                         <span className="font-bold">{percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                         <div 
                           className={`h-full transition-all duration-500 ${percentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} 
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
              <h2 className="text-lg font-bold text-slate-900 mb-2">Tabel Rekapitulasi & Peringkat (1 Tahap Lomba)</h2>
              <div className="flex flex-wrap gap-2">
                  <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden">
                     <select
                       value={activeKategori}
                       onChange={(e) => setActiveKategori(e.target.value as Kategori | 'ALL')}
                       className="px-3 py-1.5 text-xs font-semibold bg-transparent text-slate-700 outline-none w-full min-w-[220px]"
                     >
                       <option value="ALL">Semua Kategori</option>
                       <option value="GURU TK/RA/SEDERAJAT">GURU TK/RA/SEDERAJAT</option>
                       <option value="GURU SD/MI/SEDERAJAT">GURU SD/MI/SEDERAJAT</option>
                       <option value="GURU SMP/MTS/SEDERAJAT">GURU SMP/MTS/SEDERAJAT</option>
                       <option value="GURU SMA/SMK/MA/SEDERAJAT">GURU SMA/SMK/MA/SEDERAJAT</option>
                       <option value="GURU SLB">GURU SLB</option>
                     </select>
                  </div>
              </div>
           </div>
           
           <button 
             onClick={handleExport}
             className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition shadow-sm whitespace-nowrap"
           >
             <Download size={14} /> Export File Excel
           </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-16 text-center">Rank</th>
                <th className="px-6 py-4">Nama Peserta</th>
                <th className="px-6 py-4">Sekolah / Asal</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4 text-center">Nilai Media ({bobotMedia}%)</th>
                <th className="px-6 py-4 text-center">Nilai Presentasi ({bobotPresentasi}%)</th>
                <th className="px-6 py-4 text-center">Nilai Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rankedPeserta.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Belum ada data peserta untuk ditampilkan.
                   </td>
                 </tr>
              ) : rankedPeserta.map((p, index) => {
                 const mediaScore = calculateCategoryScore(p.penilaianMedia, aspekMedia);
                 const presScore = calculateCategoryScore(p.penilaianPresentasi, aspekPresentasi);
                 const score = getScore(p);
                 
                 return (
                   <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                     <td className="px-6 py-4 text-center font-bold text-slate-900 text-base">
                        #{index + 1}
                     </td>
                     <td className="px-6 py-4">
                       <div className="font-semibold text-slate-900">{p.namaPeserta}</div>
                       <div className="text-xs text-slate-500 truncate max-w-[250px] mt-0.5">{p.namaMedia}</div>
                     </td>
                     <td className="px-6 py-4 max-w-[200px]">
                       <div className="font-semibold text-slate-700 truncate">{p.namaSekolah}</div>
                       <div className="text-xs text-slate-500">{p.kabupatenKota}</div>
                     </td>
                     <td className="px-6 py-4">
                       <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full text-center">
                         {p.kategori}
                       </span>
                     </td>
                     
                     <td className="px-6 py-4 text-center font-semibold text-slate-600">
                       {mediaScore > 0 ? mediaScore.toFixed(2) : <span className="text-slate-400 italic font-normal text-xs">-</span>}
                     </td>
                     
                     <td className="px-6 py-4 text-center font-semibold text-slate-600">
                       {presScore > 0 ? presScore.toFixed(2) : <span className="text-slate-400 italic font-normal text-xs">-</span>}
                     </td>
                     
                     <td className="px-6 py-4 text-center">
                        {score > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="font-extrabold text-slate-900 text-base">{score.toFixed(2)}</span>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mt-0.5 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                              {getStatus(p)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs bg-slate-100 px-2 py-1 rounded">Belum Dinilai</span>
                        )}
                     </td>
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

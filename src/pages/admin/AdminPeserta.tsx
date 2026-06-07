import React, { useState, useRef } from "react";
import { useDataStore, Peserta, Kategori } from "@/store/useDataStore";
import { getStatus } from "@/lib/scoreUtils";
import { Trash2, Plus, Download, Upload, FileText, Edit2 } from "lucide-react";
import Swal from 'sweetalert2';
import Papa from 'papaparse';
import { YouTubeDurationFetcher } from "@/components/YouTubeDurationFetcher";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AdminPeserta() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pesertaList, addPeserta, deletePeserta, importPeserta, updatePeserta } = useDataStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Peserta>>({
    namaPeserta: '',
    kabupatenKota: '',
    namaSekolah: '',
    nomorHp: '',
    kategori: 'TK',
    namaMedia: '',
    linkYoutube: '',
    linkRpp: '',
    linkMedia: ''
  });

  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  };

  const handleAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePeserta(editingId, form);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Data peserta berhasil diperbarui!'
      });
    } else {
      addPeserta(form as Omit<Peserta, 'id' | 'penilaianMedia' | 'penilaianPresentasi'>);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Data peserta manual berhasil ditambahkan!'
      });
    }
    closeModal();
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      namaPeserta: '',
      kabupatenKota: '',
      namaSekolah: '',
      nomorHp: '',
      kategori: 'TK',
      namaMedia: '',
      linkYoutube: '',
      linkRpp: '',
      linkMedia: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (peserta: Peserta) => {
    setEditingId(peserta.id);
    setForm(peserta);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm({kategori: 'TK'});
  };

  const handleDownloadTemplate = () => {
    const headers = ['Nama Peserta', 'Kabupaten/Kota', 'Nama Sekolah', 'Nomor HP', 'Kategori', 'Nama Media', 'Link YouTube', 'Link RPP', 'Link Media'];
    const exampleRow = ['Budi Santoso', 'Kota Surabaya', 'SDN 1 Surabaya', '081234567890', 'SD', 'Media Belajar Asik', 'https://youtu.be/contoh', 'https://drive.google.com/contoh-rpp', 'https://drive.google.com/contoh-media'];
    const csvContent = [headers.join(','), exampleRow.map(field => `"${field}"`).join(',')].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_import_peserta.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedData = results.data as any[];
          const newPeserta: Omit<Peserta, 'id' | 'penilaianMedia' | 'penilaianPresentasi'>[] = parsedData.map(row => ({
            namaPeserta: row['Nama Peserta'] || '',
            kabupatenKota: row['Kabupaten/Kota'] || '',
            namaSekolah: row['Nama Sekolah'] || '',
            nomorHp: row['Nomor HP'] || '',
            kategori: (row['Kategori'] || 'TK') as Kategori,
            namaMedia: row['Nama Media'] || '',
            linkYoutube: row['Link YouTube'] || '',
            linkRpp: row['Link RPP'] || '',
            linkMedia: row['Link Media'] || ''
          })).filter(p => p.namaPeserta && p.kategori); // minimal validation

          if (newPeserta.length > 0) {
            importPeserta(newPeserta);
            Swal.fire('Berhasil', `${newPeserta.length} data peserta berhasil diimpor!`, 'success');
          } else {
            Swal.fire('Gagal', 'Tidak ada data valid yang dapat diimpor. Pastikan format sesuai template.', 'error');
          }
        } catch (error) {
           Swal.fire('Error', 'Terjadi kesalahan saat memproses file CSV.', 'error');
        }
        
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        Swal.fire('Error parsing CSV', error.message, 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handleDelete = (id: string, nama: string) => {
    Swal.fire({
      title: 'Hapus Peserta?',
      text: `Anda yakin ingin menghapus data peserta ${nama}? Data penilaian juga akan hilang.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
    }).then((result) => {
      if (result.isConfirmed) {
        deletePeserta(id);
        Swal.fire('Terhapus!', 'Data peserta telah dihapus.', 'success');
      }
    });
  };

  const handleExport = () => {
    // Basic CSV export
    const headers = ['Nama Peserta', 'Kabupaten/Kota', 'Sekolah', 'Kategori', 'Media', 'Status'];
    const rows = pesertaList.map(p => {
      const status = getStatus(p);
      return [
        p.namaPeserta, p.kabupatenKota, p.namaSekolah, p.kategori, p.namaMedia, status
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "data_penilaian_media.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    Swal.fire({
      icon: 'success',
      title: 'Berhasil',
      text: 'Data berhasil diekspor ke format CSV!',
      timer: 1500,
      showConfirmButton: false
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50">
        <div>
           <h2 className="text-lg font-bold text-slate-900">Data Peserta</h2>
           <p className="text-sm text-slate-500">Kelola data peserta lomba dari berbagai kategori.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
              <FileText size={16} /> Download Template
           </button>
           <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
           />
           <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
              <Upload size={16} /> Import CSV
           </button>
           <button onClick={handleExport} className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
              <Download size={16} /> Export CSV
           </button>
           <button onClick={openAddModal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
              <Plus size={16} /> Tambah Manual
           </button>
        </div>
      </div>


      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Nama / Kontak</th>
              <th className="px-6 py-4">Sekolah / Asal</th>
              <th className="px-6 py-4">Kategori</th>
              <th className="px-6 py-4">Media & Durasi</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pesertaList.length === 0 ? (
               <tr>
                 <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Belum ada data peserta. Silakan tambah data atau jalankan import.
                 </td>
               </tr>
            ) : pesertaList.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{p.namaPeserta}</div>
                  <div className="text-xs text-slate-500">{p.nomorHp}</div>
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
                <td className="px-6 py-4">
                  <div className="truncate max-w-[200px] font-medium text-slate-800" title={p.namaMedia}>{p.namaMedia}</div>
                  <div className="text-xs text-slate-500 mt-1">
                     Durasi: <span className="font-mono bg-slate-100 px-1 rounded text-slate-600">
                       {p.durasiVideo ? p.durasiVideo : (
                         <span className="text-slate-400 italic">Menganalisis...</span>
                       )}
                     </span>
                     {!p.durasiVideo && getYoutubeVideoId(p.linkYoutube) && (
                       <YouTubeDurationFetcher 
                          videoId={getYoutubeVideoId(p.linkYoutube)!} 
                          onDurationFetched={(dur) => updatePeserta(p.id, { durasiVideo: formatDuration(dur) })} 
                       />
                     )}
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700`}>
                      {getStatus(p)}
                   </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(p)} className="text-blue-500 hover:text-blue-700 transition-colors p-1 flex items-center" title="Edit Data">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id, p.namaPeserta)} className="text-red-500 hover:text-red-700 transition-colors p-1 flex items-center" title="Hapus Data">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
                <h3 className="text-lg font-bold">{editingId ? 'Edit Data Peserta' : 'Tambah Peserta Manual'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">&times;</button>
             </div>
             <form onSubmit={handleAddOrEdit} className="p-6 grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                   <label className="block text-sm font-medium mb-1">Nama Peserta</label>
                   <input required type="text" className="w-full border p-2 rounded" value={form.namaPeserta} onChange={e => setForm({...form, namaPeserta: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                   <label className="block text-sm font-medium mb-1">Kab/Kota</label>
                   <input required type="text" className="w-full border p-2 rounded" value={form.kabupatenKota} onChange={e => setForm({...form, kabupatenKota: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                   <label className="block text-sm font-medium mb-1">Nama Sekolah</label>
                   <input required type="text" className="w-full border p-2 rounded" value={form.namaSekolah} onChange={e => setForm({...form, namaSekolah: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                   <label className="block text-sm font-medium mb-1">Kategori</label>
                   <select className="w-full border p-2 rounded" value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value as Kategori})}>
                      {['TK', 'SLB', 'SD', 'SMP', 'SMA'].map(k => <option key={k} value={k}>{k}</option>)}
                   </select>
                </div>
                <div className="col-span-2">
                   <label className="block text-sm font-medium mb-1">Nama Media Pembelajaran</label>
                   <input required type="text" className="w-full border p-2 rounded" value={form.namaMedia} onChange={e => setForm({...form, namaMedia: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                   <label className="block text-sm font-medium mb-1">Link YouTube</label>
                   <input required type="url" className="w-full border p-2 rounded" value={form.linkYoutube} onChange={e => setForm({...form, linkYoutube: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                   <label className="block text-sm font-medium mb-1">Link RPP</label>
                   <input required type="url" className="w-full border p-2 rounded" value={form.linkRpp} onChange={e => setForm({...form, linkRpp: e.target.value})} />
                </div>
                <div className="col-span-2">
                   <label className="block text-sm font-medium mb-1">Link Media</label>
                   <input required type="url" className="w-full border p-2 rounded" value={form.linkMedia} onChange={e => setForm({...form, linkMedia: e.target.value})} />
                </div>
                <div className="col-span-2 text-right mt-4 pt-4 border-t">
                   <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">Simpan Data</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

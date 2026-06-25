import React, { useState } from "react";
import { UserPlus, Trash2, Edit2, Eye, EyeOff } from "lucide-react";
import Swal from 'sweetalert2';
import { useDataStore, JuriAccount } from "@/store/useDataStore";

export function AdminJuri() {
  const { juriList, updateJuri, deleteJuri, addJuri, aspekMedia } = useDataStore();
  const [showPasswordMap, setShowPasswordMap] = React.useState<Record<string, boolean>>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<JuriAccount>>({
    name: '',
    username: '',
    passwordText: '',
    kategori: 'GURU TK/RA/SEDERAJAT',
    role: 'juri',
    status: 'Aktif',
    aspekMediaIds: []
  });

  const togglePassword = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      name: '',
      username: '',
      passwordText: '',
      kategori: 'GURU TK/RA/SEDERAJAT',
      role: 'juri',
      status: 'Aktif',
      aspekMediaIds: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (juri: JuriAccount) => {
    setEditingId(juri.id);
    setForm({
      ...juri,
      aspekMediaIds: juri.aspekMediaIds || []
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleToggleAspect = (aspectId: string) => {
    const currentList = form.aspekMediaIds || [];
    if (currentList.includes(aspectId)) {
      setForm({ ...form, aspekMediaIds: currentList.filter(id => id !== aspectId) });
    } else {
      setForm({ ...form, aspekMediaIds: [...currentList, aspectId] });
    }
  };

  const handleAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = form.kategori === 'Semua' ? 'juri-presentasi' : 'juri-media';
    const finalForm = { ...form, role: finalRole };

    if (editingId) {
      updateJuri(editingId, finalForm as Partial<JuriAccount>);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Data Juri berhasil diperbarui',
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      addJuri(finalForm as Omit<JuriAccount, 'id'>);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Akun Juri berhasil ditambahkan',
        timer: 1500,
        showConfirmButton: false
      });
    }
    closeModal();
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: 'Hapus Juri?',
      text: `Anda yakin ingin menghapus akun ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteJuri(id);
        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Akun juri telah dihapus.',
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  };

  // Logic to find already taken aspects for current selected category
  const selectedKategori = form.kategori || 'Semua';
  const otherJuriesInKategori = juriList.filter(
    j => j.kategori === selectedKategori && j.id !== editingId
  );
  
  const takenAspectIds = new Set<string>();
  otherJuriesInKategori.forEach(j => {
    if (j.aspekMediaIds) {
      j.aspekMediaIds.forEach(id => takenAspectIds.add(id));
    }
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in text-sm">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
           <h2 className="text-lg font-bold text-slate-900">Manajemen Akun Juri</h2>
           <p className="text-sm text-slate-500">Kelola akun juri beserta hak akses penilaian aspek Media.</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
           <UserPlus size={16} /> Buat Akun Juri
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Nama / Username</th>
              <th className="px-6 py-4">Password</th>
              <th className="px-6 py-4">Kategori Tugas</th>
              <th className="px-6 py-4">Hak Akses Penilaian</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {juriList.map((j) => (
              <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{j.name}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">@{j.username}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                     <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 text-xs tracking-wider">
                        {showPasswordMap[j.id] ? j.passwordText : '••••••••'}
                     </span>
                     <button onClick={() => togglePassword(j.id)} className="text-slate-400 hover:text-slate-600 focus:outline-none shrink-0" title={showPasswordMap[j.id] ? "Sembunyikan" : "Tampilkan"}>
                       {showPasswordMap[j.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                     </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full text-center">
                    {j.kategori}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {j.kategori !== "Semua" ? (
                    <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                      Semua Aspek Media ({aspekMedia.length} Aspek)
                    </span>
                  ) : (
                    <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-2.5 py-1 rounded border border-purple-100">
                      Semua Aspek Presentasi
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                   <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      {j.status}
                   </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                     <button onClick={() => openEditModal(j)} className="text-blue-500 hover:text-blue-700 transition-colors p-1" title="Edit Juri">
                       <Edit2 size={16} />
                     </button>
                     <button onClick={() => handleDelete(j.id, j.name)} className="text-red-500 hover:text-red-700 transition-colors p-1" title="Hapus Juri">
                       <Trash2 size={16} />
                     </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="text-lg font-bold">{editingId ? 'Edit Akun Juri' : 'Buat Akun Juri'}</h3>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-700 text-xl font-bold">&times;</button>
             </div>
             
             <form onSubmit={handleAddOrEdit} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
                <div>
                   <label className="block text-sm font-medium mb-1">Nama Juri</label>
                   <input required type="text" className="w-full border p-2 rounded" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">Username</label>
                   <input required type="text" className="w-full border p-2 rounded" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">Password</label>
                   <input required type="text" className="w-full border p-2 rounded" value={form.passwordText} onChange={e => setForm({...form, passwordText: e.target.value})} />
                </div>
                
                <div>
                   <label className="block text-sm font-medium mb-1">Kategori Tugas</label>
                   <select 
                     className="w-full border p-2 rounded" 
                     value={form.kategori} 
                     onChange={e => {
                       // Reset assigned aspects when category rotates, to prevent crossing categories
                       setForm({
                         ...form, 
                         kategori: e.target.value,
                         aspekMediaIds: []
                       });
                     }}
                   >
                      <option value="Semua">Semua</option>
                      <option value="GURU TK/RA/SEDERAJAT">GURU TK/RA/SEDERAJAT</option>
                      <option value="GURU SD/MI/SEDERAJAT">GURU SD/MI/SEDERAJAT</option>
                      <option value="GURU SMP/MTS/SEDERAJAT">GURU SMP/MTS/SEDERAJAT</option>
                      <option value="GURU SMA/SMK/MA/SEDERAJAT">GURU SMA/SMK/MA/SEDERAJAT</option>
                      <option value="GURU SLB">GURU SLB</option>
                   </select>
                </div>

                 {/* Informative Privileges Display */}
                 <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                   <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                     Akses Hak Penilaian ({selectedKategori})
                   </label>
                   
                   {selectedKategori === "Semua" ? (
                     <div className="text-xs text-purple-700 bg-purple-50 p-3 rounded-lg border border-purple-100 space-y-1">
                       <p className="font-bold">Akses: Juri Presentasi</p>
                       <p className="leading-relaxed text-slate-600 font-normal">
                         Juri ini secara otomatis berwenang menilai seluruh aspek kelompok <b>Presentasi</b> untuk seluruh jenjang peserta yang terdaftar.
                       </p>
                     </div>
                   ) : (
                     <div className="text-xs text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-1">
                       <p className="font-bold">Akses: Juri Media Pembelajaran</p>
                       <p className="leading-relaxed text-slate-600 font-normal">
                         Juri ini secara otomatis berwenang menilai <b>seluruh aspek Media Pembelajaran</b> ({aspekMedia.length} aspek) khusus untuk kategori/jenjang peserta: <b className="text-slate-800">{selectedKategori}</b>.
                       </p>
                     </div>
                   )}
                 </div>

                <div>
                   <label className="block text-sm font-medium mb-1">Status</label>
                   <select className="w-full border p-2 rounded" value={form.status} onChange={e => setForm({...form, status: e.target.value})} border-slate-300>
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                   </select>
                </div>

                <div className="text-right pt-4 border-t shrink-0">
                   <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition">Simpan Data</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

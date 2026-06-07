import React, { useState } from "react";
import { UserPlus, Trash2, Edit2, Eye, EyeOff } from "lucide-react";
import Swal from 'sweetalert2';
import { useDataStore, JuriAccount } from "@/store/useDataStore";

export function AdminJuri() {
  const { juriList, updateJuri, deleteJuri, addJuri } = useDataStore();
  const [showPasswordMap, setShowPasswordMap] = React.useState<Record<string, boolean>>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<JuriAccount>>({
    name: '',
    username: '',
    passwordText: '',
    kategori: 'Semua',
    role: 'juri-media',
    status: 'Aktif'
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
      role: 'juri-media',
      status: 'Aktif'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (juri: JuriAccount) => {
    setEditingId(juri.id);
    setForm(juri);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateJuri(editingId, form as Partial<JuriAccount>);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Data Juri berhasil diperbarui',
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      addJuri(form as Omit<JuriAccount, 'id'>);
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
           <h2 className="text-lg font-bold text-slate-900">Manajemen Akun Juri</h2>
           <p className="text-sm text-slate-500">Kelola akun untuk dewan juri tiap kategori.</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
           <UserPlus size={16} /> Buat Akun Juri
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Nama / Username</th>
              <th className="px-6 py-4">Password</th>
              <th className="px-6 py-4">Kategori Tugas</th>
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
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                    {j.kategori}
                  </span>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
                <h3 className="text-lg font-bold">{editingId ? 'Edit Akun Juri' : 'Buat Akun Juri'}</h3>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-700">&times;</button>
             </div>
             <form onSubmit={handleAddOrEdit} className="p-6 space-y-4">
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
                   <label className="block text-sm font-medium mb-1">Peran (Role)</label>
                   <select className="w-full border p-2 rounded" value={form.role} onChange={e => setForm({...form, role: e.target.value as 'juri-media' | 'juri-presentasi'})}>
                      <option value="juri-media">Juri Media</option>
                      <option value="juri-presentasi">Juri Presentasi</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">Kategori</label>
                   <select className="w-full border p-2 rounded" value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})}>
                      <option value="Semua">Semua</option>
                      <option value="GURU TK/RA/SEDERAJAT">GURU TK/RA/SEDERAJAT</option>
                      <option value="GURU SD/MI/SEDERAJAT">GURU SD/MI/SEDERAJAT</option>
                      <option value="GURU SMP/MTS/SEDERAJAT">GURU SMP/MTS/SEDERAJAT</option>
                      <option value="GURU SMA/SMK/MA/SEDERAJAT">GURU SMA/SMK/MA/SEDERAJAT</option>
                      <option value="GURU SLB">GURU SLB</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">Status</label>
                   <select className="w-full border p-2 rounded" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                   </select>
                </div>
                <div className="text-right pt-4 border-t">
                   <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">Simpan Data</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

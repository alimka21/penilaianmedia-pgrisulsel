import React from "react";
import { UserPlus, Trash2, Edit2, Eye, EyeOff } from "lucide-react";
import Swal from 'sweetalert2';
import { useDataStore, JuriAccount } from "@/store/useDataStore";

export function AdminJuri() {
  const { juriList, updateJuri, deleteJuri, addJuri } = useDataStore();
  const [showPasswordMap, setShowPasswordMap] = React.useState<Record<string, boolean>>({});

  const togglePassword = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreate = () => {
    Swal.fire({
      icon: 'info',
      title: 'Fitur Belum Tersedia',
      text: 'Fitur pembuatan akun juri kustom akan hadir pada versi selanjutnya.'
    });
  };

  const handleEdit = async (juri: JuriAccount) => {
    const { value: formValues } = await Swal.fire({
      title: `Edit Akun ${juri.name}`,
      html: `
        <div class="space-y-4 text-left p-2">
           <div>
             <label class="block text-sm font-medium mb-1">Nama Juri</label>
             <input id="swal-input1" class="swal2-input !w-full !m-0" value="${juri.name}">
           </div>
           <div>
             <label class="block text-sm font-medium mb-1">Username</label>
             <input id="swal-input2" class="swal2-input !w-full !m-0" value="${juri.username}">
           </div>
           <div>
             <label class="block text-sm font-medium mb-1">Password</label>
             <input id="swal-input3" class="swal2-input !w-full !m-0" value="${juri.passwordText}">
           </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return {
          name: (document.getElementById('swal-input1') as HTMLInputElement).value,
          username: (document.getElementById('swal-input2') as HTMLInputElement).value,
          passwordText: (document.getElementById('swal-input3') as HTMLInputElement).value
        };
      }
    });

    if (formValues) {
      updateJuri(juri.id, formValues);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Data Juri berhasil diperbarui',
        timer: 1500,
        showConfirmButton: false
      });
    }
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
        <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
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
                     <button onClick={() => handleEdit(j)} className="text-blue-500 hover:text-blue-700 transition-colors p-1" title="Edit Juri">
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
    </div>
  );
}

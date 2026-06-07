import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, LayoutDashboard, Users, Settings, Activity, UserCog } from "lucide-react";
import { AdminPeserta } from "./AdminPeserta";
import { AdminMonitoring } from "./AdminMonitoring";
import { AdminSettings } from "./AdminSettings";
import { AdminJuri } from "./AdminJuri";
import { useState } from "react";
const logoPgri = "https://upload.wikimedia.org/wikipedia/commons/2/2a/Persatuan_Guru_Republik_Indonesia.png";
import Swal from 'sweetalert2';

export function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('peserta');

  const handleLogout = () => {
    Swal.fire({
      title: 'Keluar?',
      text: "Anda akan keluar dari sesi administrator.",
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

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col fixed h-full z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
             <img 
                src={logoPgri} 
                alt="Logo PGRI" 
                className="w-10 h-10 object-contain bg-white rounded-full p-1"
             />
             <div>
                <h2 className="text-xl font-bold text-white tracking-tight leading-none">Admin Area</h2>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">PGRI Sulsel</p>
             </div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <button onClick={() => setActiveTab('peserta')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeTab === 'peserta' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
             <Users size={18} />
             Manajemen Peserta
          </button>
          <button onClick={() => setActiveTab('monitoring')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeTab === 'monitoring' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
             <Activity size={18} />
             Monitoring & Peringkat
          </button>
          <button onClick={() => setActiveTab('juri')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeTab === 'juri' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
             <UserCog size={18} />
             Manajemen Akun Juri
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
             <Settings size={18} />
             Pengaturan Penilaian
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button 
             onClick={handleLogout}
             className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-slate-800 hover:bg-slate-700 text-white transition-colors"
           >
             <LogOut size={16} />
             Keluar
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 ml-64">
         <header className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Selamat datang, Administrator</h1>
            <p className="text-slate-500 mt-1">Pantau progres penilaian dan kelola data lomba secara real-time.</p>
         </header>

         {activeTab === 'peserta' && <AdminPeserta />}
         {activeTab === 'monitoring' && <AdminMonitoring />}
         {activeTab === 'juri' && <AdminJuri />}
         {activeTab === 'settings' && <AdminSettings />}
      </main>
    </div>
  );
}


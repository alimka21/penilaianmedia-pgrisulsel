import React, { useState } from "react";
import logoPgri from "@/assets/logo.png";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore, Role } from "@/store/useAuthStore";
import { Lock, User, ArrowLeft } from "lucide-react";
import { useDataStore } from "@/store/useDataStore";
import Swal from 'sweetalert2';

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((state) => state.login);
  const { juriList } = useDataStore();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let userRole: Role = null;
    let userName = "";
    let userKategori = "";

    if (username === "admin" && password === "admin") {
      userRole = "admin";
      userName = "Administrator";
    } else {
      const foundJuri = juriList.find(j => j.username === username && j.passwordText === password);
      
      if (foundJuri) {
        userRole = foundJuri.role;
        userName = foundJuri.name;
        userKategori = foundJuri.kategori;
      } else {
        setError("Username atau password salah");
        return;
      }
    }

    login({
      id: Math.random().toString(36).substr(2, 9),
      name: userName,
      role: userRole,
      username: username,
      kategori: userKategori
    });
    
    Swal.fire({
      icon: 'success',
      title: 'Login Berhasil',
      text: `Selamat datang, ${userName}`,
      timer: 1500,
      showConfirmButton: false,
    });

    if (userRole === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/juri/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative">
      <Link to="/" className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors">
         <ArrowLeft size={16} /> Kembali ke Beranda
      </Link>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
             <img 
                src={logoPgri} 
                alt="Logo PGRI" 
                className="w-16 h-16 object-contain drop-shadow-sm"
             />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Masuk ke Sistem</h2>
          <p className="text-slate-500 mt-2 text-center text-sm">
            Gunakan kredensial yang telah diberikan oleh panitia.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm bg-slate-50"
                placeholder="Masukkan username Anda"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm bg-slate-50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
          >
            Masuk
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
                Lupa kata sandi? Hubungi administrator panitia perlombaan.
            </p>
        </div>
      </div>
    </div>
  );
}

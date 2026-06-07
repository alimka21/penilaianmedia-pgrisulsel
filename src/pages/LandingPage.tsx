const logoPgri = "https://upload.wikimedia.org/wikipedia/commons/2/2a/Persatuan_Guru_Republik_Indonesia.png";
import { Link } from "react-router-dom";
import { BookOpen, Trophy, Users, CheckCircle, Video, Monitor } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navbar Minimalis */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src={logoPgri} alt="Logo PGRI" className="w-8 h-8 object-contain" />
             <span className="font-bold text-slate-800 tracking-tight">PGRI Sulsel</span>
          </div>
          <div>
            <Link 
              to="/login"
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-sm shadow-blue-200"
            >
              Masuk
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-medium text-sm mb-6 border border-blue-100">
             <Trophy size={16} />
             <span>Lomba Media Pembelajaran Tingkat Provinsi</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6 max-w-4xl mx-auto">
             Inovasi Pendidikan <br className="hidden md:block"/> 
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Era Digital.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Platform penilaian karya kreasi media pembelajaran. Ciptakan pengalaman belajar yang interaktif, menyenangkan, dan berpusat pada peserta didik.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Link 
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_24px_-6px_rgba(37,99,235,0.5)] transition-all"
             >
               Sistem Penilaian
             </Link>
          </div>
        </div>
      </section>

      {/* Features/Educational Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-bold text-slate-900 mb-4">Mengapa Media Pembelajaran Penting?</h2>
               <p className="text-slate-600 max-w-2xl mx-auto">Media yang tepat tidak hanya menyampaikan informasi, tetapi juga merangsang minat, perhatian, dan kemauan siswa untuk belajar secara aktif.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                     <Monitor size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Interaktif & Menarik</h3>
                  <p className="text-slate-600 leading-relaxed">Merubah proses belajar pasif menjadi eksplorasi aktif. Media interaktif memancing rasa ingin tahu peserta didik.</p>
               </div>
               <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                     <BookOpen size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Keterpahaman Tinggi</h3>
                  <p className="text-slate-600 leading-relaxed">Visualisasi konsep abstrak menjadi konkret. Memudahkan pencernaan informasi kompleks melalui grafik, animasi, dan audio.</p>
               </div>
               <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-6">
                     <Users size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Kolaborasi</h3>
                  <p className="text-slate-600 leading-relaxed">Memungkinkan pembelajaran kolaboratif. Peserta didik dapat berdiskusi dan memecahkan masalah bersama melalui simulasi.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white text-center">
         <div className="flex justify-center mb-4">
            <img src={logoPgri} alt="Logo PGRI" className="w-12 h-12 object-contain grayscale opacity-50" />
         </div>
         <p className="text-slate-500 font-medium">PGRI Provinsi Sulawesi Selatan</p>
         <p className="text-slate-400 text-sm mt-2">&copy; {new Date().getFullYear()} Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}


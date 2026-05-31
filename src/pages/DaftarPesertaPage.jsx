import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import { listenToParticipants } from '../firebase/db';
import {
  Users,
  CheckCircle,
  Clock,
  Search,
  GraduationCap,
  UserCheck,
  AlertTriangle,
  BadgeCheck,
  TrendingUp,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/export';

/**
 * Halaman Daftar Peserta Workshop — menampilkan peserta reguler (bukan Tamu)
 * yang sudah di-ACC admin, dengan status kehadiran mereka.
 */
const DaftarPesertaPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const navigate = useNavigate();

  // Route Guard
  useEffect(() => {
    if (sessionStorage.getItem('admin_session') !== 'active') {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToParticipants((data) => {
      setParticipants(data);
      setLoading(false);
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // Hanya peserta reguler (bukan Tamu) yang sudah di-ACC (Lunas)
  const pesertaList = participants.filter(
    p => p.category !== 'Tamu' && p.paymentStatus === 'Lunas'
  );

  const filteredList = pesertaList.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nim.includes(searchTerm) ||
      (p.prodi && p.prodi.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.faculty && p.faculty.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;
    if (filterStatus === 'Hadir') return p.status === 'Hadir';
    if (filterStatus === 'Belum Hadir') return p.status !== 'Hadir';
    return true;
  });

  const pesertaHadir = pesertaList.filter(p => p.status === 'Hadir').length;
  const pesertaBelum = pesertaList.length - pesertaHadir;
  const persentase = pesertaList.length > 0
    ? Math.round((pesertaHadir / pesertaList.length) * 100)
    : 0;

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }) + ' WIB';
    } catch { return '-'; }
  };

  return (
    <div className="min-h-screen bg-brand-bg-dark flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} title="Daftar Peserta" />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brand-cyan/10 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-wide flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-brand-cyan" />
                <span>Daftar Peserta Workshop</span>
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Peserta reguler yang telah diverifikasi pembayarannya beserta status kehadiran mereka.
              </p>
            </div>

            {/* Export buttons */}
            {!loading && pesertaList.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => exportToExcel(pesertaList)}
                  className="btn-glass px-3.5 py-2 text-xs flex items-center space-x-2 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => exportToPDF(pesertaList)}
                  className="btn-glass px-3.5 py-2 text-xs flex items-center space-x-2 text-rose-600 border-rose-500/20 hover:bg-rose-500/5"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Stat Cards */}
          {!loading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Peserta ACC',
                  value: pesertaList.length,
                  icon: <Users className="w-5 h-5" />,
                  color: 'from-brand-blue/5 to-brand-blue/10 text-brand-blue border-brand-blue/10',
                  glow: 'shadow-md'
                },
                {
                  label: 'Sudah Hadir',
                  value: pesertaHadir,
                  icon: <UserCheck className="w-5 h-5" />,
                  color: 'from-emerald-600/5 to-emerald-600/10 text-emerald-700 border-emerald-600/10',
                  glow: 'shadow-md'
                },
                {
                  label: 'Belum Hadir',
                  value: pesertaBelum,
                  icon: <Clock className="w-5 h-5" />,
                  color: 'from-amber-600/5 to-amber-600/10 text-amber-700 border-amber-600/10',
                  glow: 'shadow-md'
                },
                {
                  label: 'Tingkat Kehadiran',
                  value: `${persentase}%`,
                  icon: <TrendingUp className="w-5 h-5" />,
                  color: 'from-brand-cyan/5 to-brand-cyan/10 text-brand-cyan border-brand-cyan/10',
                  glow: 'shadow-md'
                }
              ].map((s, i) => (
                <div key={i} className={`relative overflow-hidden rounded-xl border p-5 bg-gradient-to-br glass-panel ${s.color} ${s.glow} animate-slide-up`} style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-current opacity-[0.03] blur-xl" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.label}</span>
                    <div className="p-2 rounded-lg bg-white/50 border border-brand-cyan/10">{s.icon}</div>
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-800">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Attendance Progress Bar */}
          {!loading && pesertaList.length > 0 && (
            <div className="rounded-xl border border-brand-cyan/10 glass-panel p-4 bg-white/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progress Kehadiran</span>
                <span className="text-xs font-extrabold text-brand-cyan">{pesertaHadir} / {pesertaList.length} peserta</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-emerald-600 transition-all duration-700"
                  style={{ width: `${persentase}%` }}
                />
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Cari Nama, NIM, Prodi, Fakultas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 glass-input text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="flex bg-white/80 p-1 rounded-lg border border-brand-cyan/10">
              {['Semua', 'Hadir', 'Belum Hadir'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                    filterStatus === s
                      ? s === 'Hadir'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : s === 'Belum Hadir'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-brand-cyan text-white shadow-sm'
                      : 'text-slate-500 hover:text-brand-blue'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="glass-panel rounded-xl p-12 border border-brand-cyan/10">
              <Loader message="Memuat Data Peserta..." />
            </div>
          ) : filteredList.length > 0 ? (
            <div className="w-full rounded-xl border border-brand-cyan/10 glass-panel overflow-hidden">
              {/* Table strip header */}
              <div className="flex items-center px-5 py-3 border-b border-brand-cyan/10 bg-brand-cyan/5">
                <GraduationCap className="w-4 h-4 text-brand-cyan mr-2" />
                <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest">
                  Peserta Workshop {filterStatus !== 'Semua' ? `— ${filterStatus}` : ''}
                </span>
                <span className="ml-auto text-[10px] text-slate-650 font-semibold">
                  {filteredList.length} peserta
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-cyan/10 bg-brand-cyan/5">
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">No</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Peserta</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">NIM</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Program Studi</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Fakultas</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status Kehadiran</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Jam Hadir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-cyan/10">
                    {filteredList.map((p, index) => (
                      <tr
                        key={p.nim}
                        className={`transition-colors ${
                          p.status === 'Hadir'
                            ? 'hover:bg-emerald-500/[0.02]'
                            : 'hover:bg-brand-cyan/[0.01]'
                        }`}
                      >
                        <td className="px-5 py-4 text-sm font-semibold text-slate-500">{index + 1}</td>

                        {/* Nama + Avatar */}
                        <td className="px-5 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-extrabold border ${
                              p.status === 'Hadir'
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600'
                                : 'bg-slate-100 border-slate-300 text-slate-600'
                            }`}>
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 leading-tight">{p.name}</p>
                              {p.phoneNumber && (
                                <p className="text-[10px] text-slate-600 font-mono mt-0.5">+{p.phoneNumber}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* NIM */}
                        <td className="px-5 py-4 text-sm font-mono font-bold text-slate-700">
                          {p.nim}
                        </td>

                        {/* Prodi */}
                        <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                          {p.prodi || <span className="text-slate-400">-</span>}
                        </td>

                        {/* Fakultas */}
                        <td className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          {p.faculty}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 text-center">
                          {p.status === 'Hadir' ? (
                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-emerald-500/25 bg-emerald-500/10 text-emerald-600">
                              <BadgeCheck className="w-3 h-3" />
                              <span>Hadir</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-slate-300 bg-slate-100 text-slate-600">
                              <Clock className="w-3 h-3" />
                              <span>Belum Hadir</span>
                            </span>
                          )}
                        </td>

                        {/* Jam */}
                        <td className="px-5 py-4">
                          {p.status === 'Hadir' ? (
                            <span className="font-mono text-emerald-600 font-bold text-xs">
                              {formatTime(p.scannedAt)}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-brand-cyan/10 bg-brand-cyan/5 text-xs text-slate-500 font-medium flex items-center justify-between">
                <span>Menampilkan {filteredList.length} dari {pesertaList.length} peserta</span>
                <span className="text-brand-cyan font-bold">{pesertaHadir} sudah hadir</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-brand-cyan/10 glass-panel p-16 text-center flex flex-col items-center space-y-4">
              {pesertaList.length === 0 ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center">
                    <Users className="w-8 h-8 text-brand-cyan/50" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500">Belum Ada Peserta yang Diverifikasi</p>
                    <p className="text-xs text-slate-650 mt-1">ACC peserta dari tab "Pendaftar Baru" di Dashboard untuk mereka muncul di sini.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-amber-500/50" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">Tidak ada peserta yang cocok.</p>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DaftarPesertaPage;

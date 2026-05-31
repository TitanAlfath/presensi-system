import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import { listenToParticipants, deleteParticipant } from '../firebase/db';
import {
  Star,
  Users,
  CheckCircle,
  Clock,
  Search,
  Trash2,
  UserX,
  BadgeCheck,
  AlertTriangle
} from 'lucide-react';
import Toast from '../components/Toast';

/**
 * Halaman khusus Tamu Undangan — menampilkan daftar tamu yang telah presensi
 * dan tamu yang belum hadir. Admin dapat menghapus tamu yang dianggap tidak sah.
 */
const TamuUndanganPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [toast, setToast] = useState(null);
  const [deletingNim, setDeletingNim] = useState(null);
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

  // Filter: hanya Tamu Undangan
  const tamuList = participants.filter(p => p.category === 'Tamu');

  const filteredList = tamuList.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nim.includes(searchTerm) ||
      (p.faculty && p.faculty.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;
    if (filterStatus === 'Hadir') return p.status === 'Hadir';
    if (filterStatus === 'Belum Hadir') return p.status !== 'Hadir';
    return true;
  });

  const tamuHadir = tamuList.filter(p => p.status === 'Hadir').length;
  const tamuBelum = tamuList.length - tamuHadir;

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }) + ' WIB';
    } catch { return '-'; }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Hapus tamu "${p.name}" (${p.nim})?\n\nTamu ini akan dihapus dari sistem dan tidak mendapatkan sertifikat.`)) return;
    setDeletingNim(p.nim);
    try {
      await deleteParticipant(p.nim);
      setToast({ message: `Tamu "${p.name}" berhasil dihapus.`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Gagal menghapus tamu.', type: 'error' });
    } finally {
      setDeletingNim(null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg-dark flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} title="Tamu Undangan" />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brand-cyan/10 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-wide flex items-center space-x-2">
                <Star className="w-5 h-5 text-purple-600" />
                <span>Daftar Tamu Undangan</span>
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Tamu yang sudah presensi akan tampil di sini. Admin dapat menghapus tamu yang tidak sah.
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: 'Total Tamu Diundang',
                  value: tamuList.length,
                  icon: <Users className="w-5 h-5" />,
                  color: 'from-purple-600/5 to-purple-600/10 text-purple-700 border-purple-600/10',
                  glow: 'shadow-md'
                },
                {
                  label: 'Sudah Hadir',
                  value: tamuHadir,
                  icon: <CheckCircle className="w-5 h-5" />,
                  color: 'from-emerald-600/5 to-emerald-600/10 text-emerald-700 border-emerald-600/10',
                  glow: 'shadow-md'
                },
                {
                  label: 'Belum Hadir',
                  value: tamuBelum,
                  icon: <Clock className="w-5 h-5" />,
                  color: 'from-amber-600/5 to-amber-600/10 text-amber-700 border-amber-600/10',
                  glow: 'shadow-md'
                }
              ].map((s, i) => (
                <div key={i} className={`relative overflow-hidden rounded-xl border p-5 bg-gradient-to-br glass-panel ${s.color} ${s.glow}`}>
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-current opacity-[0.04] blur-xl" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</span>
                    <div className="p-2 rounded-lg bg-white/50 border border-brand-cyan/10">{s.icon}</div>
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-800">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Cari Nama, NIM, Instansi..."
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
                          : 'bg-purple-600 text-white shadow-sm'
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
              <Loader message="Memuat Data Tamu Undangan..." />
            </div>
          ) : filteredList.length > 0 ? (
            <div className="w-full rounded-xl border border-brand-cyan/10 glass-panel overflow-hidden">
              {/* Table header strip */}
              <div className="flex items-center px-5 py-3 border-b border-brand-cyan/10 bg-purple-500/5">
                <Star className="w-4 h-4 text-purple-600 mr-2" />
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">
                  Tamu Undangan yang {filterStatus === 'Semua' ? 'Terdaftar' : filterStatus}
                </span>
                <span className="ml-auto text-[10px] text-slate-500 font-semibold">
                  {filteredList.length} tamu
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-cyan/10 bg-brand-cyan/5">
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">No</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">NIM / ID</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Instansi / Fakultas</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status Presensi</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Jam Hadir</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-cyan/10">
                    {filteredList.map((p, index) => (
                      <tr key={p.nim} className="hover:bg-brand-cyan/[0.01] transition-colors">
                        <td className="px-5 py-4 text-sm font-semibold text-slate-500">{index + 1}</td>

                        {/* Nama */}
                        <td className="px-5 py-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                              <Star className="w-3.5 h-3.5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{p.name}</p>
                              {p.prodi && (
                                <p className="text-[10px] text-slate-650 font-medium">{p.prodi}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* NIM/ID */}
                        <td className="px-5 py-4 text-sm font-mono font-bold text-slate-700">
                          {p.nim}
                        </td>

                        {/* Instansi */}
                        <td className="px-5 py-4 text-xs font-semibold text-slate-600 uppercase">
                          {p.faculty || '-'}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 text-center">
                          {p.status === 'Hadir' ? (
                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-emerald-500/25 bg-emerald-500/10 text-emerald-600">
                              <BadgeCheck className="w-3 h-3" />
                              <span>Sudah Hadir</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-amber-500/20 bg-amber-500/5 text-amber-600 animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>Belum Hadir</span>
                            </span>
                          )}
                        </td>

                        {/* Jam */}
                        <td className="px-5 py-4 text-sm font-medium">
                          {p.status === 'Hadir' ? (
                            <span className="font-mono text-emerald-600 font-bold text-xs">
                              {formatTime(p.scannedAt)}
                            </span>
                          ) : (
                            <span className="text-slate-650 text-xs">-</span>
                          )}
                        </td>

                        {/* Aksi Hapus */}
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleDelete(p)}
                            disabled={deletingNim === p.nim}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-rose-600/20 bg-rose-600/5 text-rose-600 hover:bg-rose-600/10 hover:border-rose-600/30 text-xs font-bold transition-all disabled:opacity-50"
                            title="Hapus tamu ini — tidak akan mendapat sertifikat"
                          >
                            {deletingNim === p.nim ? (
                              <div className="w-3 h-3 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>Hapus</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-brand-cyan/10 bg-brand-cyan/5 text-xs text-slate-500 font-medium">
                Menampilkan {filteredList.length} dari {tamuList.length} tamu undangan
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="rounded-xl border border-brand-cyan/10 glass-panel p-16 text-center flex flex-col items-center space-y-4">
              {tamuList.length === 0 ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <UserX className="w-8 h-8 text-purple-500/60" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500">Belum Ada Tamu Undangan</p>
                    <p className="text-xs text-slate-650 mt-1">Tambahkan tamu melalui "Registrasi Manual" di Dashboard dengan kategori Tamu.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-amber-500/60" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">Tidak ada tamu yang cocok dengan filter.</p>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default TamuUndanganPage;

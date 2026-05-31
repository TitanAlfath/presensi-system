import React, { useState } from 'react';
import { 
  Search, 
  FileSpreadsheet, 
  FileDown, 
  Plus, 
  Check, 
  Clock, 
  Users,
  Image as ImageIcon,
  X,
  Maximize2,
  Edit,
  Trash2,
  CheckCircle,
  XOctagon,
  MessageSquare
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/export';
import { updatePaymentStatus, deleteParticipant } from '../firebase/db';
import EditParticipantModal from './EditParticipantModal';

/**
 * Premium Datagrid showing participants, contact info, payment receipts, and attendance.
 */
const ParticipantTable = ({ 
  participants = [], 
  onAddClick,
  onResetClick,
  onSuccessToast,
  onErrorToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [activeTab, setActiveTab] = useState('Peserta'); // 'Peserta' (Verified) or 'Pendaftar' (Pending)
  
  // Interactive full-size receipt viewer modal state
  const [activeReceiptUrl, setActiveReceiptUrl] = useState(null);
  const [activeReceiptOwner, setActiveReceiptOwner] = useState('');
  const [activeReceiptNim, setActiveReceiptNim] = useState('');
  const [activeReceiptPhone, setActiveReceiptPhone] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Edit Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // Format scanning date
  const formatTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }) + ' WIB';
    } catch (e) {
      return '-';
    }
  };

  // Filter & Search Logic
  const filteredList = participants.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nim.includes(searchTerm) ||
      (p.phoneNumber && p.phoneNumber.includes(searchTerm)) ||
      (p.prodi && p.prodi.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.faculty.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'Pendaftar') {
      // Pending inbox: semua yang belum di-ACC (paymentStatus bukan Lunas)
      // Tamu Undangan dengan paymentStatus='Menunggu Verifikasi' juga masuk sini
      return p.paymentStatus !== 'Lunas';
    } else {
      // Tab "Daftar Peserta": 
      // - Peserta biasa: harus sudah Lunas
      // - Tamu Undangan: hanya tampil jika sudah Hadir (tidak tampil sebelum absen)
      if (p.category === 'Tamu') {
        // Tamu tersembunyi sampai mereka hadir
        if (p.status !== 'Hadir') return false;
        return true;
      }
      
      // Peserta biasa
      if (p.paymentStatus !== 'Lunas') return false;
      if (filterStatus === 'Semua') return true;
      return p.status === filterStatus;
    }
  });

  // Action: Quick approve payment from receipt modal
  const handleVerifyPayment = async (nim, status) => {
    setLoadingAction(true);
    try {
      await updatePaymentStatus(nim, status);
      const isApproved = status === 'Lunas';
      
      onSuccessToast(
        isApproved 
          ? `Pembayaran untuk peserta ${activeReceiptOwner.split('(')[0]} berhasil DISETUJUI!` 
          : `Pembayaran untuk peserta ${activeReceiptOwner.split('(')[0]} telah DITOLAK!`
      );
      
      setActiveReceiptUrl(null);
    } catch (err) {
      onErrorToast(err.message || 'Gagal memproses status pembayaran.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Action: Delete Participant CRUD operation
  const handleDeleteParticipant = async (p) => {
    if (window.confirm(`Apakah Anda yakin ingin MENGHAPUS peserta "${p.name}" (${p.nim}) secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await deleteParticipant(p.nim);
        onSuccessToast(`Peserta "${p.name}" berhasil dihapus dari database.`);
      } catch (err) {
        onErrorToast(err.message || 'Gagal menghapus data peserta.');
      }
    }
  };

  const handleEditClick = (p) => {
    setSelectedParticipant(p);
    setIsEditOpen(true);
  };

  return (
    <>
      <div className="w-full rounded-xl border border-brand-cyan/10 glass-panel shadow-cyan-glow overflow-hidden flex flex-col">
        {/* PRIMARY WORKSPACE TABS */}
        <div className="flex border-b border-brand-cyan/10 bg-brand-cyan/[0.02] p-1">
          <button
            onClick={() => {
              setActiveTab('Peserta');
              setFilterStatus('Semua');
            }}
            className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 border-r border-brand-cyan/10 cursor-pointer ${
              activeTab === 'Peserta'
                ? 'bg-gradient-to-r from-brand-cyan/10 to-brand-blue/5 text-brand-cyan border-b-2 border-b-brand-cyan font-black'
                : 'text-slate-500 hover:text-slate-800 hover:bg-brand-cyan/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Peserta (Sudah ACC) ({
              participants.filter(p => 
                p.paymentStatus === 'Lunas' && p.category !== 'Tamu'
              ).length + participants.filter(p => p.category === 'Tamu' && p.status === 'Hadir').length
            })</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('Pendaftar');
            }}
            className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 relative cursor-pointer ${
              activeTab === 'Pendaftar'
                ? 'bg-gradient-to-r from-purple-500/10 to-indigo-500/5 text-purple-700 border-b-2 border-b-purple-500 font-black'
                : 'text-slate-500 hover:text-slate-800 hover:bg-brand-cyan/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pendaftar Baru (Belum ACC) ({participants.filter(p => p.paymentStatus !== 'Lunas').length})</span>
            {participants.filter(p => p.paymentStatus === 'Menunggu Verifikasi').length > 0 && (
              <span className="absolute top-2 right-4 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>
        </div>
        {/* Table Toolbar controls */}
        <div className="p-5 border-b border-brand-cyan/10 bg-brand-cyan/[0.01] flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Cari Nama, NIM, No WA, Prodi, atau Fakultas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 glass-input text-sm"
            />
          </div>

          {/* Buttons / Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Tabs (Attendees view only) */}
            {activeTab === 'Peserta' && (
              <div className="flex bg-slate-100 p-1 rounded-lg border border-brand-cyan/10">
                {['Semua', 'Hadir', 'Belum Hadir'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all cursor-pointer ${
                      filterStatus === status
                        ? 'bg-brand-cyan text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}

            {/* Export Actions */}
            <button
              onClick={() => exportToExcel(participants)}
              className="btn-glass px-3.5 py-2 text-xs flex items-center space-x-2 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-700 border-emerald-500/20"
              title="Ekspor ke spreadsheet Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline font-bold">Excel</span>
            </button>

            <button
              onClick={() => exportToPDF(participants)}
              className="btn-glass px-3.5 py-2 text-xs flex items-center space-x-2 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-700 border-rose-500/20"
              title="Ekspor Laporan PDF"
            >
              <FileDown className="w-4 h-4 text-rose-600" />
              <span className="hidden md:inline font-bold">PDF</span>
            </button>

            {/* Registration */}
            <button
              onClick={onAddClick}
              className="btn-cyan px-3.5 py-2 text-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Registrasi Manual</span>
            </button>
          </div>
        </div>

        {/* Table Viewport */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-cyan/10 bg-brand-cyan/[0.04]">
                <th className="px-6 py-4 text-xs font-black text-slate-650 uppercase tracking-wider">No</th>
                <th className="px-6 py-4 text-xs font-black text-slate-650 uppercase tracking-wider">NIM</th>
                <th className="px-6 py-4 text-xs font-black text-slate-650 uppercase tracking-wider">Nama Lengkap</th>
                <th className="px-6 py-4 text-xs font-black text-slate-650 uppercase tracking-wider">Prodi / Fakultas</th>
                <th className="px-6 py-4 text-xs font-black text-slate-650 uppercase tracking-wider">Nomor WhatsApp</th>
                <th className="px-6 py-4 text-xs font-black text-slate-650 uppercase tracking-wider text-center">Bukti Bayar</th>
                <th className="px-6 py-4 text-xs font-black text-slate-650 uppercase tracking-wider text-center">Status Bayar</th>
                <th className="px-6 py-4 text-xs font-black text-slate-650 uppercase tracking-wider">Kehadiran</th>
                <th className="px-6 py-4 text-xs font-black text-slate-650 uppercase tracking-wider">Jam Hadir</th>
                <th className="px-6 py-4 text-xs font-black text-slate-650 uppercase tracking-wider text-center">Aksi (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cyan/10">
              {filteredList.length > 0 ? (
                filteredList.map((p, index) => (
                  <tr 
                    key={p.nim} 
                    className="hover:bg-brand-cyan/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono font-bold text-slate-700">
                      {p.nim}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800">
                      <div className="flex flex-col space-y-1">
                        <span className="font-bold text-slate-800">{p.name}</span>
                        {p.category === 'Tamu' ? (
                          <span className="self-start inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border border-purple-500/20 bg-purple-50 text-purple-700">
                            Tamu Undangan
                          </span>
                        ) : (
                          <span className="self-start inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border border-brand-cyan/25 bg-brand-cyan/[0.04] text-brand-cyan">
                            Peserta
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                      <span className="font-semibold">{p.prodi || 'Program Studi'}</span>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mt-0.5">{p.faculty}</span>
                    </td>
                    
                    {/* Phone Number & WhatsApp quick redirect link */}
                    <td className="px-6 py-4 text-sm font-semibold font-mono text-slate-700">
                      {p.phoneNumber ? (
                        <div className="flex items-center space-x-2">
                          <span>+{p.phoneNumber}</span>
                          <a
                            href={`https://wa.me/${p.phoneNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-500 transition-colors"
                            title="Kirim pesan langsung via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-450">-</span>
                      )}
                    </td>

                    {/* Clickable Payment Receipt column */}
                    <td className="px-6 py-4 text-center">
                      {p.category === 'Tamu' ? (
                        <span className="text-[10px] text-purple-700 font-extrabold uppercase tracking-wider">BEBAS BIAYA</span>
                      ) : p.paymentReceipt ? (
                        <button
                          onClick={() => {
                            setActiveReceiptUrl(p.paymentReceipt);
                            setActiveReceiptOwner(`${p.name} (${p.nim})`);
                            setActiveReceiptNim(p.nim);
                            setActiveReceiptPhone(p.phoneNumber || '');
                          }}
                          className="btn-glass px-2.5 py-1 rounded-md text-[10px] bg-brand-cyan/[0.04] hover:bg-brand-cyan/10 hover:border-brand-cyan/25 text-brand-cyan border border-brand-cyan/20 inline-flex items-center space-x-1.5 shadow-xs"
                          title="Lihat bukti transfer pembayaran"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-brand-cyan" />
                          <span>Lihat Bukti</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-450 font-semibold">-</span>
                      )}
                    </td>

                    {/* Payment Status Badges */}
                    <td className="px-6 py-4 text-center">
                      {p.paymentStatus === 'Lunas' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border border-emerald-500/20 bg-emerald-50 text-emerald-700">
                          Lunas
                        </span>
                      ) : p.paymentStatus === 'Ditolak' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border border-rose-500/20 bg-rose-50 text-rose-700">
                          Ditolak
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border border-amber-500/20 bg-amber-50 text-amber-700 animate-pulse">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {p.status === 'Hadir' ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-emerald-500/25 bg-emerald-50 text-emerald-700 shadow-xs">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Hadir</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-slate-350 bg-slate-100 text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Belum Hadir</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {p.status === 'Hadir' ? (
                        <span className="font-mono text-emerald-600 font-bold">
                          {formatTime(p.scannedAt)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* ACTIONS CRUD COLUMN */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {p.paymentStatus !== 'Lunas' && (
                          <button
                            onClick={async () => {
                              setActiveReceiptOwner(`${p.name} (${p.nim})`);
                              setActiveReceiptNim(p.nim);
                              setActiveReceiptPhone(p.phoneNumber || '');
                              setLoadingAction(true);
                              try {
                                await updatePaymentStatus(p.nim, 'Lunas');
                                onSuccessToast(`Peserta "${p.name}" berhasil DISETUJUI!`);
                              } catch (err) {
                                onErrorToast(err.message || 'Gagal memproses pendaftaran.');
                              } finally {
                                setLoadingAction(false);
                              }
                            }}
                            className="p-1.5 rounded-md border border-emerald-500/20 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/50 hover:border-emerald-500/40 transition-all cursor-pointer"
                            title="Setujui Pendaftaran (ACC)"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 rounded-md border border-brand-cyan/10 bg-slate-100 text-slate-500 hover:text-brand-cyan hover:border-brand-cyan/40 transition-all cursor-pointer"
                          title="Edit Data Peserta"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteParticipant(p)}
                          className="p-1.5 rounded-md border border-brand-cyan/10 bg-slate-100 text-slate-500 hover:text-rose-600 hover:border-rose-500/40 transition-all cursor-pointer"
                          title="Hapus Peserta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Users className="w-8 h-8 text-slate-400 animate-pulse" />
                      <p className="text-sm font-semibold text-slate-500">
                        Tidak ada peserta ditemukan.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info strip */}
        <div className="p-4 border-t border-brand-cyan/10 bg-brand-cyan/[0.02] flex items-center justify-between text-xs text-slate-500 font-medium">
          <p>Menampilkan {filteredList.length} dari {participants.length} total peserta</p>
          <button 
            onClick={onResetClick}
            className="text-slate-500 hover:text-brand-cyan hover:underline transition-colors cursor-pointer font-bold"
          >
            Reset Presensi (Untuk Pengujian)
          </button>
        </div>
      </div>

      {/* POP-UP MODAL: Full-size Payment Receipt Viewer with Approval Controls */}
      {activeReceiptUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="absolute inset-0" onClick={() => setActiveReceiptUrl(null)} />
          
          <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-brand-cyan/10 glass-panel bg-[#FFFDF9]/95 shadow-cyan-glow-intense animate-slide-up flex flex-col">
            {/* Header bar */}
            <div className="flex items-center justify-between p-4 border-b border-brand-cyan/10">
              <div className="flex items-center space-x-2 text-slate-800">
                <ImageIcon className="w-5 h-5 text-brand-cyan" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">Bukti Pembayaran Transfer</h3>
                  <p className="text-[10px] text-slate-500 font-bold block truncate max-w-xs">{activeReceiptOwner}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveReceiptUrl(null)}
                className="text-slate-500 hover:text-slate-800 p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image viewport */}
            <div className="p-6 flex items-center justify-center bg-slate-50/50 border border-brand-cyan/5 min-h-[280px] max-h-[380px] overflow-y-auto">
              <img 
                src={activeReceiptUrl} 
                alt="Payment Receipt Complete" 
                className="max-w-full max-h-full rounded-lg border border-brand-cyan/10 shadow-xs object-contain bg-white"
              />
            </div>

            {/* Verification Actions bar */}
            <div className="p-4 bg-[#FFFDF9] border-t border-brand-cyan/10 flex items-center justify-end space-x-3">
              <button
                onClick={() => handleVerifyPayment(activeReceiptNim, 'Ditolak')}
                disabled={loadingAction}
                className="btn-glass px-4 py-2 text-xs flex items-center space-x-1.5 border-rose-500/20 bg-rose-50 text-rose-600 hover:bg-rose-100"
              >
                <XOctagon className="w-4 h-4" />
                <span>Tolak Transfer</span>
              </button>
              
              <button
                onClick={() => handleVerifyPayment(activeReceiptNim, 'Lunas')}
                disabled={loadingAction}
                className="btn-cyan px-4 py-2 text-xs flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/15"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Setujui Pembayaran</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Edit Participant Modal */}
      <EditParticipantModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        participant={selectedParticipant}
        onSuccess={(msg) => onSuccessToast(msg)}
        onError={(msg) => onErrorToast(msg)}
      />
    </>
  );
};

export default ParticipantTable;

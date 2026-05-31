import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import StatCards from '../components/StatCards';
import ParticipantTable from '../components/ParticipantTable';
import AddParticipantModal from '../components/AddParticipantModal';
import Toast from '../components/Toast';
import Loader from '../components/Loader';
import { 
  listenToParticipants, 
  resetAttendance, 
  seedInitialData,
  importParticipantsFromExcel
} from '../firebase/db';
import { 
  RefreshCcw, 
  Database, 
  FileSpreadsheet,
  QrCode,
  Monitor
} from 'lucide-react';
import * as XLSX from 'xlsx';

/**
 * Main Administrative Dashboard Workspace with CRUD & Background WhatsApp Dispatcher.
 */
const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Toast notifications states
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Route Guard: Verify active admin session
  useEffect(() => {
    if (sessionStorage.getItem('admin_session') !== 'active') {
      navigate('/login');
    }
  }, [navigate]);

  // Subscribe to Firestore / simulation database
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToParticipants((data) => {
      setParticipants(data);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleResetPresensi = async () => {
    if (window.confirm('Apakah Anda yakin ingin me-reset SEMUA data kehadiran peserta kembali ke "Belum Hadir"?')) {
      try {
        await resetAttendance();
        showToast('Status kehadiran semua peserta berhasil di-reset!', 'success');
      } catch (err) {
        showToast('Gagal me-reset status kehadiran.', 'error');
      }
    }
  };

  const handleSeedDatabase = async () => {
    if (window.confirm('Apakah Anda ingin memuat ulang 10 Data Peserta Bawaan? Langkah ini akan memperbarui daftar.')) {
      try {
        await seedInitialData(true);
        showToast('Database berhasil diperbarui dengan data peserta bawaan!', 'success');
      } catch (err) {
        showToast('Gagal memperbarui database.', 'error');
      }
    }
  };

  // CLIENT-SIDE EXCEL SHEET PARSER & BATCH IMPORTER
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        if (!json || json.length === 0) {
          throw new Error('Berkas Excel kosong atau tidak terbaca.');
        }

        // Flexibly map column headers dynamically
        const cleanedRows = json.map((row) => {
          const keys = Object.keys(row);
          
          const nimKey = keys.find(k => k.toLowerCase().trim() === 'nim');
          const nameKey = keys.find(k => ['nama', 'name', 'nama lengkap', 'fullname'].includes(k.toLowerCase().trim()));
          const prodiKey = keys.find(k => ['prodi', 'program studi', 'jurusan', 'study program'].includes(k.toLowerCase().trim()));
          const facultyKey = keys.find(k => ['fakultas', 'faculty'].includes(k.toLowerCase().trim()));
          const phoneKey = keys.find(k => ['phone', 'phonenumber', 'whatsapp', 'telp', 'no hp', 'nomor hp'].includes(k.toLowerCase().replace(/[^a-z]/g, '')));

          if (!nimKey || !nameKey) return null;

          return {
            nim: row[nimKey].toString().trim(),
            name: row[nameKey].toString().trim(),
            prodi: prodiKey ? row[prodiKey].toString().trim() : 'Teknik Informatika',
            faculty: facultyKey ? row[facultyKey].toString().trim() : 'Fakultas Ilmu Komputer',
            phone: phoneKey ? row[phoneKey].toString().trim() : '6281234567890'
          };
        }).filter(Boolean);

        if (cleanedRows.length === 0) {
          throw new Error("Format Excel salah. Lembar wajib memiliki kolom 'NIM' dan 'Nama'!");
        }

        const count = await importParticipantsFromExcel(cleanedRows);
        showToast(`Berhasil mengimpor ${count} peserta baru dari Excel!`, 'success');
      } catch (err) {
        showToast(err.message || 'Gagal mengimpor berkas Excel.', 'error');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      showToast('Gagal membaca berkas Excel.', 'error');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };



  return (
    <div className="min-h-screen bg-brand-bg-dark flex">
      {/* Navigation Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Navbar 
          onOpenSidebar={() => setSidebarOpen(true)} 
          title="Panel Dashboard Utama"
        />

        {/* Dashboard Content Grid */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Quick Header Summary */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brand-cyan/10 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-wide">
                Workshop Karya Tulis Ilmiah
              </h2>
              <p className="text-xs text-brand-cyan font-bold mt-1">
                Dies Natalis FASTIKOM XXV — "Problematika dan Solusi Cerdas KTI Mahasiswa"
              </p>
            </div>

            {/* Quick Actions Row */}
            <div className="flex items-center gap-3">
              {/* HIDDEN FILE SELECTOR */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx, .xls"
                className="hidden"
              />

              {/* Terminal Scanner button */}
              <button
                onClick={() => navigate('/admin/scanner')}
                className="btn-cyan px-3.5 py-2 text-xs flex items-center space-x-2 shadow-md shadow-brand-cyan/15 text-white"
                title="Buka Terminal Scan QR Kehadiran"
              >
                <QrCode className="w-3.5 h-3.5 text-white" />
                <span>Terminal Scan</span>
              </button>

              {/* Live Projector Screen button */}
              <button
                onClick={() => window.open('/live', '_blank')}
                className="btn-glass px-3.5 py-2 text-xs flex items-center space-x-2 text-brand-blue border-brand-blue/20 bg-brand-blue/[0.01] hover:bg-brand-blue/5"
                title="Buka Layar Proyektor Live Kehadiran"
              >
                <Monitor className="w-3.5 h-3.5 text-brand-blue" />
                <span>Layar Proyektor</span>
              </button>
              
              {/* Excel Import button */}
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="btn-glass px-3.5 py-2 text-xs flex items-center space-x-2 text-emerald-700 border-emerald-500/20 bg-emerald-50/50 hover:bg-emerald-100/50"
                title="Impor Daftar Peserta dari File Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Impor Excel</span>
              </button>

              <button
                onClick={handleSeedDatabase}
                className="btn-glass px-3.5 py-2 text-xs flex items-center space-x-2 text-brand-cyan border-brand-cyan/20 bg-brand-cyan/[0.01] hover:bg-brand-cyan/5"
                title="Muat Ulang Peserta Default"
              >
                <Database className="w-3.5 h-3.5 text-brand-cyan" />
                <span className="hidden sm:inline">Seed DB</span>
              </button>
              
              <button
                onClick={handleResetPresensi}
                className="btn-glass px-3.5 py-2 text-xs flex items-center space-x-2 text-rose-700 border-rose-500/20 bg-rose-50/50 hover:bg-rose-100"
                title="Reset Status Presensi Kehadiran"
              >
                <RefreshCcw className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Reset Presensi</span>
              </button>
            </div>
          </div>

          {/* Statistics Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-xl glass-panel animate-pulse bg-white/40 border border-brand-cyan/10" />
              ))}
            </div>
          ) : (
            <StatCards participants={participants} />
          )}

          {/* Realtime Attendance Table */}
          {loading ? (
            <div className="glass-panel rounded-xl p-12 border border-brand-cyan/10">
              <Loader message="Sinkronisasi Data Kehadiran..." />
            </div>
          ) : (
            <ParticipantTable
              participants={participants}
              onAddClick={() => setIsAddModalOpen(true)}
              onResetClick={handleResetPresensi}
              onSuccessToast={(msg) => showToast(msg, 'success')}
              onErrorToast={(msg) => showToast(msg, 'error')}
            />
          )}
        </main>
      </div>

      {/* Modals and Toasts Overlay layers */}
      <AddParticipantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(msg) => showToast(msg, 'success')}
        onError={(msg) => showToast(msg, 'error')}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}


    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import { listenToParticipants } from '../firebase/db';
import { Search, Download, Printer, User, QrCode, Star } from 'lucide-react';

/**
 * QR Code Generator Page — shows verified Peserta + all Tamu Undangan cards.
 * Each card displays category badge (Peserta Workshop / Tamu Undangan).
 */
const QRGenerator = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua'); // 'Semua' | 'Peserta' | 'Tamu'
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
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filter: Peserta harus sudah Lunas, Tamu Undangan semua tampil
  const eligibleParticipants = participants.filter(p => {
    if (p.category === 'Tamu') return true;       // Tamu selalu tampil
    return p.paymentStatus === 'Lunas';            // Peserta hanya jika Lunas
  });

  const filteredList = eligibleParticipants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nim.includes(searchTerm) ||
      p.faculty.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterCategory === 'Semua') return true;
    if (filterCategory === 'Tamu') return p.category === 'Tamu';
    return p.category !== 'Tamu';
  });

  const getQRUrl = (nim) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(nim)}&bgcolor=255-255-255`;
  };

  const handlePrintCard = (p) => {
    const printWindow = window.open('', '_blank');
    const qrUrl = getQRUrl(p.nim);
    const isTamu = p.category === 'Tamu';
    const accentColor = isTamu ? '#a855f7' : '#8C1D1D';
    const categoryLabel = isTamu ? '⭐ Tamu Undangan' : '🎓 Peserta Workshop';
    const categoryBg = isTamu ? '#f3e8ff' : '#FAF8F3';
    const categoryText = isTamu ? '#7e22ce' : '#8C1D1D';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Tiket Presensi - ${p.name}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f3f4f6;
            }
            .ticket-card {
              width: 380px;
              padding: 24px;
              border: 2px solid ${accentColor};
              border-radius: 16px;
              background-color: white;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
              text-align: center;
            }
            .header {
              border-bottom: 2px dashed #e5e7eb;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .title {
              font-size: 14px;
              font-weight: 800;
              color: #1B365D;
              letter-spacing: 1px;
              margin: 0;
            }
            .subtitle {
              font-size: 9px;
              font-weight: 700;
              color: ${accentColor};
              text-transform: uppercase;
              margin-top: 4px;
              letter-spacing: 0.5px;
            }
            .category-badge {
              display: inline-block;
              background: ${categoryBg};
              color: ${categoryText};
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 4px 12px;
              border-radius: 99px;
              border: 1px solid ${accentColor};
              margin: 10px 0;
            }
            .qr-container {
              margin: 14px 0;
            }
            .qr-image {
              width: 180px;
              height: 180px;
              border: 2px solid ${accentColor};
              padding: 4px;
              border-radius: 8px;
            }
            .student-name {
              font-size: 16px;
              font-weight: 700;
              color: #1e293b;
              margin: 0 0 6px 0;
            }
            .student-nim {
              font-family: monospace;
              font-size: 13px;
              color: #64748b;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .student-prodi {
              font-size: 10px;
              color: #475569;
              font-weight: 600;
              margin-bottom: 2px;
            }
            .student-fac {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0f172a;
              font-weight: bold;
            }
            .footer-note {
              margin-top: 14px;
              font-size: 8px;
              color: #94a3b8;
              border-top: 1px dashed #e5e7eb;
              padding-top: 10px;
            }
            @media print {
              body { background: none; }
              .ticket-card { box-shadow: none; border-color: ${accentColor}; }
            }
          </style>
        </head>
        <body>
          <div class="ticket-card">
            <div class="header">
              <h1 class="title">DIES NATALIS FASTIKOM XXV</h1>
              <div class="subtitle">Workshop Karya Tulis Ilmiah</div>
            </div>
            <div class="category-badge">${categoryLabel}</div>
            <div class="qr-container">
              <img class="qr-image" src="${qrUrl}" alt="QR Code NIM" />
            </div>
            <div class="student-name">${p.name}</div>
            <div class="student-nim">${p.nim}</div>
            ${p.prodi ? `<div class="student-prodi">${p.prodi}</div>` : ''}
            <div class="student-fac">${p.faculty}</div>
            <div class="footer-note">Tunjukkan QR Code ini kepada panitia untuk presensi kehadiran</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadQR = async (p) => {
    try {
      const qrUrl = getQRUrl(p.nim);
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QR_${p.nim}_${p.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(getQRUrl(p.nim), '_blank');
    }
  };

  const pesertaCount = eligibleParticipants.filter(p => p.category !== 'Tamu').length;
  const tamuCount = eligibleParticipants.filter(p => p.category === 'Tamu').length;

  return (
    <div className="min-h-screen bg-brand-bg-dark flex">
      {/* Drawer */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Navbar 
          onOpenSidebar={() => setSidebarOpen(true)} 
          title="Tiket QR Peserta"
        />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brand-cyan/10 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-wide">
                Tiket QR Masuk Acara
              </h2>
              <p className="text-xs text-slate-550 font-semibold mt-1">
                Unduh atau Cetak kartu presensi ber-QR Code. Peserta & Tamu Undangan cukup scan QR untuk absen.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Cari Nama, NIM, Fakultas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 glass-input text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Stats + Category Filter */}
          {!loading && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-white/80 p-1 rounded-lg border border-brand-cyan/10">
                {[
                  { label: `Semua (${eligibleParticipants.length})`, key: 'Semua' },
                  { label: `🎓 Peserta (${pesertaCount})`, key: 'Peserta' },
                  { label: `⭐ Tamu (${tamuCount})`, key: 'Tamu' },
                ].map(({ label, key }) => (
                  <button
                    key={key}
                    onClick={() => setFilterCategory(key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                      filterCategory === key
                        ? key === 'Tamu'
                          ? 'bg-purple-650 text-white shadow-sm'
                          : 'bg-brand-cyan text-white shadow-sm'
                        : 'text-slate-500 hover:text-brand-blue'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cards Grid */}
          {loading ? (
            <div className="glass-panel rounded-xl p-12 border border-brand-cyan/10">
              <Loader message="Sinkronisasi Barcode Peserta..." />
            </div>
          ) : filteredList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredList.map((p) => {
                const isTamu = p.category === 'Tamu';
                return (
                  <div 
                    key={p.nim}
                    className={`relative overflow-hidden rounded-xl border glass-panel p-5 bg-white/60 shadow-md transition-all duration-300 flex flex-col ${
                      isTamu
                        ? 'border-purple-500/30 hover:border-purple-500/60'
                        : 'border-brand-cyan/10 hover:border-brand-cyan/30'
                    }`}
                  >
                    {/* Top accent line */}
                    <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r ${
                      isTamu ? 'from-purple-500/70 to-violet-500/30' : 'from-brand-cyan/60 to-brand-blue/30'
                    }`} />

                    {/* Body Content */}
                    <div className="flex items-start justify-between space-x-4 mb-4">
                      <div className="flex-1 space-y-2">
                        {/* Category Badge */}
                        {isTamu ? (
                          <div className="flex items-center space-x-1.5 text-purple-600 font-bold text-[10px] uppercase tracking-widest">
                            <Star className="w-3.5 h-3.5" />
                            <span>TAMU UNDANGAN</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5 text-brand-cyan font-bold text-[10px] uppercase tracking-widest">
                            <User className="w-3.5 h-3.5" />
                            <span>PESERTA WORKSHOP</span>
                          </div>
                        )}
                        <h4 className="text-base font-extrabold text-slate-800 leading-tight">
                          {p.name}
                        </h4>
                        <p className="text-xs font-bold text-slate-700 font-mono">
                          {p.nim}
                        </p>
                        {p.prodi && (
                          <p className="text-[10px] text-slate-600 font-semibold">
                            {p.prodi}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 font-bold uppercase">
                          {p.faculty}
                        </p>
                      </div>

                      {/* QR Preview */}
                      <div className={`relative flex-shrink-0 w-24 h-24 bg-white p-1 rounded-lg shadow-inner overflow-hidden border ${
                        isTamu ? 'border-purple-500/30' : 'border-brand-cyan/20'
                      }`}>
                        <img 
                          src={getQRUrl(p.nim)} 
                          alt="Preview QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-4 border-t border-brand-cyan/10 flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handlePrintCard(p)}
                        className="btn-glass px-3 py-2 text-xs flex items-center space-x-1.5 hover:text-brand-blue"
                        title="Cetak Tiket Fisik"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Cetak</span>
                      </button>
                      <button
                        onClick={() => handleDownloadQR(p)}
                        className={`px-3 py-2 text-xs flex items-center space-x-1.5 shadow-md rounded-lg font-medium transition-all active:scale-[0.98] ${
                          isTamu
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'btn-cyan'
                        }`}
                        title="Unduh Gambar QR Code"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh QR</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel border border-brand-cyan/10 rounded-xl p-12 text-center text-slate-500">
              Tidak ada peserta yang cocok dengan kriteria pencarian Anda.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default QRGenerator;

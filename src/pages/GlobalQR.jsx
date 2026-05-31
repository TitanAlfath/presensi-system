import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { QrCode, Download, Printer, ZoomIn, ZoomOut, Link as LinkIcon, Edit2 } from 'lucide-react';

/**
 * Event-wide central QR Code projector console page.
 * Allows admins to dynamically customize the link encoded in the QR.
 */
const GlobalQR = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [qrSize, setQrSize] = useState(300); // Default QR size in pixels
  const [originUrl, setOriginUrl] = useState('http://localhost:5173');
  const navigate = useNavigate();

  // Route Guard & Address Binding
  useEffect(() => {
    if (sessionStorage.getItem('admin_session') !== 'active') {
      navigate('/login');
    }
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
    }
  }, [navigate]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(originUrl)}&bgcolor=255-255-255`;

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code Presensi - BEM FASTIKOM</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: white;
              text-align: center;
            }
            .container {
              border: 3px solid #8C1D1D;
              border-radius: 24px;
              padding: 40px;
              max-width: 500px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            }
            .title {
              font-size: 24px;
              font-weight: 800;
              color: #1B365D;
              margin: 0 0 8px 0;
              letter-spacing: 0.5px;
            }
            .subtitle {
              font-size: 14px;
              font-weight: 700;
              color: #8C1D1D;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 30px;
            }
            .qr-image {
              width: 320px;
              height: 320px;
              border: 1px solid #e2e8f0;
              padding: 10px;
              border-radius: 12px;
            }
            .footer-text {
              margin-top: 30px;
              font-size: 13px;
              font-weight: 600;
              color: #64748b;
            }
            .url-link {
              font-family: monospace;
              font-size: 12px;
              color: #1e293b;
              background-color: #f1f5f9;
              padding: 6px 12px;
              border-radius: 6px;
              margin-top: 8px;
              display: inline-block;
            }
            @media print {
              .container { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="title">DIES NATALIS FASTIKOM XXV</h1>
            <div class="subtitle">Scan Presensi Workshop KTI</div>
            <img class="qr-image" src="${qrImageUrl}" alt="Presensi QR Link" />
            <p class="footer-text">Arahkan kamera HP Anda untuk masuk ke sistem kehadiran.</p>
            <div class="url-link">${originUrl}</div>
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

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QR_Presensi_BEM_FASTIKOM.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(qrImageUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg-dark flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Navbar 
          onOpenSidebar={() => setSidebarOpen(true)} 
          title="QR Acara Utama"
        />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="border-b border-brand-cyan/10 pb-4">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-wide">
              Proyektor QR Code Kehadiran
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Tampilkan QR Code ini pada layar proyektor atau cetak di meja registrasi. Peserta melakukan scan mandiri menggunakan HP mereka masing-masing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Col: QR Display Board */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="relative rounded-2xl border border-brand-cyan/10 glass-panel p-8 bg-white/60 shadow-lg text-center flex flex-col items-center max-w-full">
                <h4 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase">
                  DIES NATALIS FASTIKOM XXV
                </h4>
                <p className="text-xs font-bold text-brand-cyan uppercase tracking-wider mt-1 mb-6">
                  PRESENSI WORKSHOP KARYA TULIS ILMIAH
                </p>

                {/* QR Code Container */}
                <div 
                  className="bg-white p-4 rounded-xl border border-brand-cyan/20 shadow-inner flex items-center justify-center transition-all duration-300"
                  style={{ width: `${qrSize}px`, height: `${qrSize}px` }}
                >
                  <img 
                    src={qrImageUrl} 
                    alt="Global QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <p className="mt-6 text-xs text-slate-650 font-semibold max-w-xs leading-relaxed">
                  Arahkan kamera HP Anda ke barcode ini untuk masuk ke halaman halaman presensi mandiri.
                </p>
              </div>
            </div>

            {/* Right Col: Controls & Actions */}
            <div className="lg:col-span-5 space-y-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                Pengaturan Layar Proyektor
              </h3>

              {/* Editable URL Input */}
              <div className="rounded-xl border border-brand-cyan/10 glass-panel p-4 bg-white/40 space-y-2">
                <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-widest flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Kustomisasi Tautan QR</span>
                </span>
                <div className="relative">
                  <input
                    type="text"
                    value={originUrl}
                    onChange={(e) => setOriginUrl(e.target.value)}
                    className="w-full glass-input text-xs font-mono pr-8 bg-white/80 focus:ring-brand-cyan/10 border-brand-cyan/10 text-slate-800"
                    placeholder="Masukkan Tautan Kustom"
                  />
                  <Edit2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  *Barcode QR akan beregenerasi secara instan mengikuti tautan URL yang panitia masukkan di atas.
                </p>
              </div>

              {/* Size Slider controls */}
              <div className="rounded-xl border border-brand-cyan/10 glass-panel p-4 bg-white/40 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Ukuran Barcode</span>
                  <span className="text-brand-cyan">{qrSize}px</span>
                </div>
                <div className="flex items-center space-x-3">
                  <ZoomOut className="w-4 h-4 text-slate-500" />
                  <input
                    type="range"
                    min="200"
                    max="450"
                    step="10"
                    value={qrSize}
                    onChange={(e) => setQrSize(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                  />
                  <ZoomIn className="w-4 h-4 text-slate-500" />
                </div>
              </div>

              {/* Actions drawer buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handlePrintQR}
                  className="flex-1 btn-glass py-3.5 text-xs flex items-center justify-center space-x-2 border-slate-350 hover:text-brand-blue"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Banner QR</span>
                </button>
                <button
                  onClick={handleDownloadQR}
                  className="flex-1 btn-cyan py-3.5 text-xs flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh PNG</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GlobalQR;

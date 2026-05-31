import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { Html5Qrcode } from 'html5-qrcode';
import { markAttendance } from '../firebase/db';
import { 
  Camera, 
  CheckCircle2, 
  XCircle, 
  CameraOff, 
  RefreshCw,
  QrCode,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';

/**
 * High-performance administrative Camera QR Scanner terminal.
 */
const ScannerPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  // Realtime scanning results states
  const [scanResult, setScanResult] = useState(null); // { success: boolean, student: object, error: string }
  const [toast, setToast] = useState(null);
  
  const qrScannerRef = useRef(null);
  const isMountedRef = useRef(true);
  const cooldownTimeoutRef = useRef(null);
  const scannerContainerId = 'qr-reader-target';
  const navigate = useNavigate();

  // Route Guard
  useEffect(() => {
    if (sessionStorage.getItem('admin_session') !== 'active') {
      navigate('/login');
    }
  }, [navigate]);

  // Audio synthesizer using native browser Web Audio API (Offline friendly!)
  const playSound = (type = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        // High dual-tone positive chime
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        osc.start();
        
        // Second chime tone
        setTimeout(() => {
          osc.frequency.setValueAtTime(1320, audioCtx.currentTime); // E6
        }, 80);

        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.stop(audioCtx.currentTime + 0.25);
      } else {
        // Low cautionary buzzer
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime); // C3
        gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
        osc.start();
        
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('Audio synthesis context blocked by browser policy.', e);
    }
  };

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#3b82f6', '#10b981', '#ffffff']
    });
  };

  // Discover and list available cameras on mount
  useEffect(() => {
    isMountedRef.current = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMountedRef.current) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          setSelectedCameraId(devices[0].id);
          setCameraPermission(true);
        } else {
          setCameraPermission(false);
          setToast({ message: 'Tidak ada kamera terdeteksi di perangkat ini.', type: 'warning' });
        }
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        setCameraPermission(false);
        console.error('Camera query error:', err);
      });

    return () => {
      isMountedRef.current = false;
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
      
      // Stop scanner instance directly on unmount without state update
      if (qrScannerRef.current) {
        const isScanningInstance = qrScannerRef.current.isScanning;
        if (isScanningInstance) {
          qrScannerRef.current
            .stop()
            .catch((err) => console.error('Error stopping scanner on unmount:', err));
        }
        qrScannerRef.current = null;
      }
    };
  }, []);

  const startScanner = async () => {
    if (!selectedCameraId) return;
    
    // Clear scanner container before restarting to prevent dual instances
    stopScanner();
    setIsScanning(true);
    setScanResult(null);

    const html5QrCode = new Html5Qrcode(scannerContainerId);
    qrScannerRef.current = html5QrCode;

    const config = {
      fps: 15,
      qrbox: (width, height) => {
        const size = Math.min(width, height) * 0.7;
        return { width: size, height: size };
      }
    };

    try {
      await html5QrCode.start(
        selectedCameraId,
        config,
        async (decodedText) => {
          try {
            // Prevent multiple concurrent scans during validation cooldown
            html5QrCode.pause();
          } catch (e) {
            console.warn('Failed to pause scanner:', e);
          }
          
          await processScannedNIM(decodedText);

          if (cooldownTimeoutRef.current) {
            clearTimeout(cooldownTimeoutRef.current);
          }

          // Cooldown of 2.5 seconds before resuming camera capture
          cooldownTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && qrScannerRef.current && qrScannerRef.current.isScanning) {
              try {
                qrScannerRef.current.resume();
              } catch (e) {
                console.warn('Failed to resume scanner:', e);
              }
            }
          }, 2500);
        },
        () => {
          // Silent scan diagnostic failure catch
        }
      );
    } catch (err) {
      if (isMountedRef.current) {
        setIsScanning(false);
        setToast({ message: 'Gagal mengaktifkan kamera. Periksa izin browser.', type: 'error' });
      }
    }
  };

  const stopScanner = () => {
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
      cooldownTimeoutRef.current = null;
    }

    if (qrScannerRef.current) {
      const isScanningInstance = qrScannerRef.current.isScanning;
      if (isScanningInstance) {
        qrScannerRef.current
          .stop()
          .then(() => {
            if (isMountedRef.current) {
              setIsScanning(false);
            }
            qrScannerRef.current = null;
          })
          .catch((err) => {
            console.error('Error stopping scanner:', err);
            if (isMountedRef.current) {
              setIsScanning(false);
            }
          });
      } else {
        if (isMountedRef.current) {
          setIsScanning(false);
        }
        qrScannerRef.current = null;
      }
    } else {
      if (isMountedRef.current) {
        setIsScanning(false);
      }
    }
  };

  const processScannedNIM = async (nim) => {
    try {
      const student = await markAttendance(nim);
      
      if (!isMountedRef.current) return;

      // Success feedback triggers
      playSound('success');
      triggerConfetti();
      
      setScanResult({
        success: true,
        student,
        error: null
      });

      setToast({ 
        message: `Presensi Berhasil! Halo ${student.name}.`, 
        type: 'success' 
      });
    } catch (err) {
      if (!isMountedRef.current) return;

      // Failure/Duplicate scan feedback triggers
      playSound('error');
      
      setScanResult({
        success: false,
        student: null,
        error: err.message || 'Presensi Gagal.'
      });

      setToast({ 
        message: err.message || 'Presensi Gagal.', 
        type: 'error' 
      });
    }
  };

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
          title="Terminal Scan QR"
        />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="border-b border-brand-cyan/10 pb-4">
            <h2 className="text-xl font-black text-slate-800 tracking-wide">
              Scanner Presensi Realtime
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Arahkan QR Code kartu peserta di depan lensa kamera laptop atau HP Anda untuk melakukan presensi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Col: Camera & Controls */}
            <div className="lg:col-span-7 space-y-5">
              {/* Controls bar */}
              <div className="p-4 rounded-xl border border-brand-cyan/10 glass-panel bg-white/70 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Camera selector list */}
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <Camera className="w-4 h-4 text-brand-cyan flex-shrink-0" />
                  <select
                    disabled={isScanning}
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="w-full sm:w-56 glass-input py-1.5 px-3 text-xs bg-white text-slate-800 cursor-pointer"
                  >
                    {cameras.map((cam) => (
                      <option key={cam.id} value={cam.id} className="bg-white text-slate-800">
                        {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start / Stop Toggle */}
                <button
                  onClick={isScanning ? stopScanner : startScanner}
                  className={`w-full sm:w-auto px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                    isScanning
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border border-rose-500/30'
                      : 'btn-cyan shadow-md shadow-brand-cyan/15'
                  }`}
                >
                  {isScanning ? (
                    <>
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Matikan Kamera</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Aktifkan Kamera</span>
                    </>
                  )}
                </button>
              </div>

              {/* QR Code Scanner Viewer Screen */}
              <div className="relative rounded-2xl border border-brand-cyan/10 overflow-hidden glass-panel bg-slate-50 aspect-video w-full flex items-center justify-center shadow-xs">
                {/* Simulated Grid overlay lines */}
                {isScanning && (
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(140,29,29,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(140,29,29,0.01)_1px,transparent_1px)] bg-[size:30px_30px] z-10 pointer-events-none" />
                )}

                {/* html5-qrcode target anchor */}
                <div 
                  id={scannerContainerId} 
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isScanning ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
                  }`}
                />

                {/* Static Mock backdrop */}
                {!isScanning && (
                  <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center z-10 animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">Kamera Belum Aktif</p>
                      <p className="text-xs text-slate-450 mt-1 max-w-xs font-semibold">
                        Pilih kamera yang valid lalu tekan tombol "Aktifkan Kamera" di atas untuk memulai pemindaian.
                      </p>
                    </div>
                  </div>
                )}

                {/* Holographic glowing scan brackets */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-2xl border-2 border-brand-cyan/20 scanner-target">
                      {/* L-shaped corner notches */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-brand-cyan rounded-tl-md" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-brand-cyan rounded-tr-md" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-brand-cyan rounded-bl-md" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-brand-cyan rounded-br-md" />
                      
                      {/* Cyber laser horizontal line */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-cyan to-transparent shadow-[0_0_12px_#8c1d1d] animate-scanner-laser" />
                    </div>
                  </div>
                )}
              </div>

              {/* Sound Audio warning notice badge */}
              <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span>Indikator audio scanner aktif otomatis</span>
              </div>
            </div>

            {/* Right Col: Diagnosis Realtime Terminal */}
            <div className="lg:col-span-5 space-y-5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">
                Status Diagnosis Presensi
              </h3>

              {/* Idle screen */}
              {!scanResult && (
                <div className="rounded-xl border border-brand-cyan/10 glass-panel p-8 text-center bg-brand-cyan/[0.01] flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-slate-400 animate-spin-slow" />
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xs">
                    Menunggu pemindaian QR Code... Log status presensi kehadiran akan dicatat secara realtime di panel ini.
                  </p>
                </div>
              )}

              {/* Diagnosis: Success Details screen */}
              {scanResult && scanResult.success && (
                <div className={`rounded-xl border glass-panel p-6 space-y-5 animate-slide-up relative overflow-hidden ${
                  scanResult.student.category === 'Tamu'
                    ? 'border-purple-500/25 bg-purple-50/50 shadow-xs'
                    : 'border-emerald-500/25 bg-emerald-50/50 shadow-xs'
                }`}>
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl -mr-6 -mt-6 ${
                    scanResult.student.category === 'Tamu' ? 'bg-purple-500/5' : 'bg-emerald-500/5'
                  }`} />
                  
                  <div className={`flex items-center space-x-3 ${
                    scanResult.student.category === 'Tamu' ? 'text-purple-700' : 'text-emerald-700'
                  }`}>
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-extrabold text-sm uppercase tracking-widest">
                      PRESENSI BERHASIL
                    </span>
                  </div>

                  {/* KATEGORI BADGE */}
                  <div>
                    {scanResult.student.category === 'Tamu' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-purple-500/25 bg-purple-50 text-purple-700">
                        ⭐ Tamu Undangan
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-brand-cyan/25 bg-brand-cyan/[0.04] text-brand-cyan">
                        🎓 Peserta Workshop
                      </span>
                    )}
                  </div>

                  <div className={`space-y-3 pt-3 border-t ${
                    scanResult.student.category === 'Tamu' ? 'border-purple-500/10' : 'border-emerald-500/10'
                  }`}>
                    <div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        scanResult.student.category === 'Tamu' ? 'text-purple-600' : 'text-brand-cyan'
                      }`}>Nama Lengkap</span>
                      <p className="text-lg font-black text-slate-800 leading-tight mt-0.5">
                        {scanResult.student.name}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          scanResult.student.category === 'Tamu' ? 'text-purple-600' : 'text-brand-cyan'
                        }`}>NIM</span>
                        <p className="text-sm font-extrabold text-slate-700 font-mono mt-0.5">
                          {scanResult.student.nim}
                        </p>
                      </div>
                      <div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          scanResult.student.category === 'Tamu' ? 'text-purple-600' : 'text-brand-cyan'
                        }`}>Jam Masuk</span>
                        <p className="text-sm font-extrabold text-slate-700 mt-0.5">
                          {new Date(scanResult.student.scannedAt).toLocaleTimeString('id-ID')} WIB
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        scanResult.student.category === 'Tamu' ? 'text-purple-600' : 'text-brand-cyan'
                      }`}>Fakultas / Prodi</span>
                      <p className="text-xs font-bold text-slate-600 mt-0.5 uppercase tracking-wide">
                        {scanResult.student.faculty}
                        {scanResult.student.prodi && ` — ${scanResult.student.prodi}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Diagnosis: Error screen */}
              {scanResult && !scanResult.success && (
                <div className="rounded-xl border border-rose-500/25 glass-panel bg-rose-50/50 p-6 space-y-4 animate-slide-up shadow-xs">
                  <div className="flex items-center space-x-3 text-rose-600">
                    <XCircle className="w-6 h-6 animate-pulse" />
                    <span className="font-extrabold text-sm uppercase tracking-widest">
                      PRESENSI DITOLAK
                    </span>
                  </div>

                  <div className="pt-3 border-t border-rose-500/10">
                    <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block">Sebab Penolakan</span>
                    <p className="text-sm font-semibold text-slate-700 leading-normal mt-1">
                      {scanResult.error}
                    </p>
                  </div>

                  <div className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-500/15 uppercase tracking-wide leading-relaxed">
                    Instruksi: Verifikasi validitas QR Code peserta atau daftarkan peserta secara manual jika merupakan walk-in.
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Floating Notifications */}
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

export default ScannerPage;

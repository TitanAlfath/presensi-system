import React, { useState, useRef } from 'react';
import { registerParticipant } from '../firebase/db';
import Toast from '../components/Toast';
import { 
  User, 
  Fingerprint, 
  Landmark, 
  BookOpen, 
  Upload, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft,
  FileImage,
  Award,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';

/**
 * Public Workshop Registration Portal — Simplified without category selection.
 */
const PublicRegistration = () => {
  // Form fields
  const [nim, setNim] = useState('');
  const [name, setName] = useState('');
  const [prodi, setProdi] = useState('');
  const [faculty, setFaculty] = useState('Fakultas Ilmu Komputer');
  const [phone, setPhone] = useState('');
  
  // Drag and drop / file variables
  const [receiptBase64, setReceiptBase64] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  
  // App states
  const [loading, setLoading] = useState(false);
  const [registeredStudent, setRegisteredStudent] = useState(null); 
  const [toast, setToast] = useState(null);
  
  const fileInputRef = useRef(null);

  // Native audio chimes
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(660, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      setTimeout(() => { osc.frequency.setValueAtTime(880, audioCtx.currentTime); }, 70);
      setTimeout(() => { osc.frequency.setValueAtTime(1320, audioCtx.currentTime); }, 140);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn(e);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#3b82f6', '#10b981', '#ffffff']
    });
  };

  // Convert uploaded receipt image to base64 with canvas compression
  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Berkas bukti pembayaran wajib berupa gambar (JPG/PNG).', type: 'error' });
      return;
    }
    
    setReceiptFileName(file.name);
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setReceiptBase64(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processImageFile(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    processImageFile(file);
  };

  const handleRemoveFile = () => {
    setReceiptBase64('');
    setReceiptFileName('');
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    const cleanNim = nim.trim();
    const cleanName = name.trim();
    const cleanProdi = prodi.trim();
    const cleanPhone = phone.trim();

    if (!cleanNim || !cleanName || !cleanProdi || !cleanPhone || !receiptBase64) {
      setToast({ message: 'Semua kolom formulir termasuk bukti pembayaran wajib diisi!', type: 'warning' });
      return;
    }

    setLoading(true);

    try {
      const student = await registerParticipant(
        cleanNim,
        cleanName,
        faculty,
        cleanProdi,
        cleanPhone,
        receiptBase64,
        'Peserta'
      );

      playChime();
      triggerConfetti();
      setRegisteredStudent(student);
      setToast({ message: 'Pendaftaran Berhasil! Data Anda telah terkirim.', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Pendaftaran Gagal.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const facultiesList = [
    'Fakultas Ilmu Komputer',
    'Fakultas Teknik',
    'Fakultas Ekonomi',
    'Fakultas Kedokteran',
    'Fakultas Hukum',
    'Fakultas Keguruan',
    'Fakultas Pertanian'
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-brand-bg-dark px-4 py-8 overflow-hidden">
      {/* Decorative warm accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-85 h-85 rounded-full bg-brand-cyan/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-brand-blue/[0.04] blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(140,29,29,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(140,29,29,0.008)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-xl p-6 sm:p-8 rounded-2xl border border-brand-cyan/10 glass-panel shadow-cyan-glow z-10 animate-slide-up">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-cyan" />

        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">
            <BookOpen className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-wide text-brand-blue">
              WORKSHOP KARYA TULIS ILMIAH
            </h2>
            <p className="text-xs font-extrabold text-brand-cyan tracking-wider mt-1 px-4 leading-normal">
              "Problematika dan Solusi Cerdas KTI Mahasiswa"
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
              Dies Natalis FASTIKOM 25
            </p>
          </div>
        </div>

        {/* SUCCESS STATE */}
        {registeredStudent && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 mb-3">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800">PENDAFTARAN BERHASIL!</h3>
              <p className="text-xs text-brand-cyan font-bold tracking-wide uppercase mt-0.5">
                Data pendaftaran Anda telah tersimpan
              </p>
            </div>

            {/* Success summary block */}
            <div className="relative overflow-hidden rounded-xl border border-brand-cyan/10 glass-panel p-6 text-left space-y-4">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-cyan to-brand-blue" />
              
              <div className="flex items-center space-x-2 text-brand-cyan font-bold text-[10px] uppercase tracking-widest">
                <Award className="w-4 h-4" />
                <span>RINGKASAN PENDAFTARAN ANDA</span>
              </div>
              
              <div className="space-y-3 pt-2 border-t border-brand-cyan/10">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Nama Lengkap</span>
                  <p className="text-base font-extrabold text-slate-800 leading-tight mt-0.5">{registeredStudent.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">NIM Mahasiswa</span>
                    <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{registeredStudent.nim}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">No. WhatsApp</span>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">+{registeredStudent.phoneNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Program Studi</span>
                    <p className="text-xs font-semibold text-slate-650 mt-0.5">{registeredStudent.prodi}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Fakultas</span>
                    <p className="text-[10px] font-semibold text-slate-650 mt-0.5 uppercase tracking-wide">{registeredStudent.faculty}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="p-4 rounded-lg bg-brand-cyan/[0.04] border border-brand-cyan/20 text-xs text-slate-600 font-medium leading-relaxed text-left">
              <strong className="text-brand-cyan">Catatan:</strong><br/>
              Bukti pembayaran Anda sedang diverifikasi panitia. Setelah disetujui, panitia akan menghubungi Anda melalui nomor WhatsApp <strong className="text-slate-800">+{registeredStudent.phoneNumber}</strong>.
            </div>

            {/* Back button */}
            <button
              onClick={() => {
                setRegisteredStudent(null);
                setNim('');
                setName('');
                setProdi('');
                setPhone('');
                handleRemoveFile();
              }}
              className="w-full btn-cyan py-3 text-xs flex items-center justify-center space-x-2 shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Daftarkan Peserta Lain</span>
            </button>
          </div>
        )}

        {/* REGISTRATION FORM */}
        {!registeredStudent && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Event & Speaker Info Card */}
            <div className="rounded-xl border border-brand-cyan/15 bg-brand-cyan/[0.02] p-4 space-y-3.5 shadow-xs text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-cyan/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Narasumber Utama</span>
                    <p className="text-sm font-black text-slate-800 leading-tight">Prof. Dr. Parmin, S.Pd., M.Pd.</p>
                    <p className="text-[10px] text-slate-500 font-semibold">Profesor di Universitas Tidar (UNTIDAR)</p>
                  </div>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg border border-brand-cyan/35 bg-brand-cyan/10 text-brand-cyan font-black text-center text-xs sm:self-center flex-shrink-0">
                  <span className="text-[9px] font-bold block text-slate-500 leading-none">ENTRY FEE</span>
                  <span className="text-sm tracking-wide">IDR 10K</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Informasi Acara</span>
                  <p className="text-[11px] text-slate-700 font-bold">📅 Kamis, 11 Juni 2026</p>
                  <p className="text-[11px] text-slate-600 font-semibold">🕒 Waktu: 13.00 - Selesai</p>
                  <p className="text-[11px] text-slate-600 font-semibold">📍 Tempat: Aula Al'ala Unsiq Kampus 1</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Fasilitas & Benefits</span>
                  <p className="text-[10px] text-slate-600 font-semibold leading-tight">✔️ Materi Bermanfaat & Sertifikat</p>
                  <p className="text-[10px] text-slate-600 font-semibold leading-tight">✔️ Pengembangan Keterampilan</p>
                  <p className="text-[10px] text-slate-600 font-semibold leading-tight">✔️ Konsultasi & Networking</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NIM */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                  NIM MAHASISWA
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Fingerprint className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 2201010001"
                    value={nim}
                    disabled={loading}
                    onChange={(e) => setNim(e.target.value)}
                    className="w-full pl-10 glass-input"
                  />
                </div>
              </div>

              {/* Nama */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                  NAMA LENGKAP
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Zahra Amalia"
                    value={name}
                    disabled={loading}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 glass-input"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Program Studi */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                  PROGRAM STUDI
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Teknik Informatika"
                    value={prodi}
                    disabled={loading}
                    onChange={(e) => setProdi(e.target.value)}
                    className="w-full pl-10 glass-input"
                  />
                </div>
              </div>

              {/* Fakultas */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                  FAKULTAS
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Landmark className="w-4 h-4" />
                  </span>
                  <select
                    value={faculty}
                    disabled={loading}
                    onChange={(e) => setFaculty(e.target.value)}
                    className="w-full pl-10 glass-input appearance-none bg-white cursor-pointer"
                  >
                    {facultiesList.map((fac) => (
                      <option key={fac} value={fac} className="bg-white text-slate-800">
                        {fac}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Nomor WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                NOMOR WHATSAPP (AKTIF)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 081234567890 atau 6281234567890"
                  value={phone}
                  disabled={loading}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 glass-input text-xs"
                />
              </div>
              <p className="text-[9px] text-slate-450 font-semibold block">
                *Wajib berupa nomor WhatsApp aktif untuk konfirmasi dari panitia.
              </p>
            </div>

            {/* Drag-and-Drop Payment Receipt Upload */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                UNGGAH BUKTI PEMBAYARAN
              </label>

              {!receiptBase64 ? (
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-brand-cyan/60 rounded-xl p-6 text-center cursor-pointer transition-colors duration-300 bg-white/50 flex flex-col items-center justify-center space-y-2 group"
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 group-hover:text-brand-cyan transition-colors">
                    <Upload className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Seret & Jatuhkan Berkas Gambar</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">atau klik untuk menelusuri (PNG, JPG maks 5MB)</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-brand-cyan/25 p-4 bg-white flex items-center justify-between gap-4 animate-slide-up shadow-xs">
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-50 p-0.5">
                      <img 
                        src={filePreview} 
                        alt="Receipt Thumbnail" 
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">{receiptFileName}</p>
                      <p className="text-[9px] font-semibold text-brand-cyan tracking-wider flex items-center space-x-1 mt-0.5">
                        <FileImage className="w-3.5 h-3.5 text-brand-cyan" />
                        <span>GAMBAR BERHASIL DIMUAT</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-slate-500 hover:text-rose-600 text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-cyan py-3.5 mt-2 flex items-center justify-center space-x-2 shadow-cyan-glow/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Mengirimkan Pendaftaran...</span>
                </>
              ) : (
                <>
                  <span>Kirim Pendaftaran</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
      
      {/* Toast Alert */}
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

export default PublicRegistration;

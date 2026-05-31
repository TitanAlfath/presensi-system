import React, { useState } from 'react';
import { registerAndMarkAttendance } from '../firebase/db';
import Toast from '../components/Toast';
import { 
  Fingerprint, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  ChevronRight,
  Users,
  Star,
  User,
  RotateCcw,
  GraduationCap
} from 'lucide-react';
import confetti from 'canvas-confetti';

/**
 * Halaman Presensi Mandiri Premium — untuk Peserta Workshop & Tamu Undangan.
 * Menampilkan formulir pendaftaran kehadiran on-the-spot instan.
 */
const PublicAttendance = () => {
  const [formData, setFormData] = useState({
    name: '',
    nim: '',
    prodi: '',
    faculty: 'Fakultas Ilmu Komputer',
    category: 'Peserta' // 'Peserta' | 'Tamu'
  });
  
  const [loading, setLoading] = useState(false);
  const [statusResult, setStatusResult] = useState(null);
  const [toast, setToast] = useState(null);

  // Audio chime
  const playSound = (type = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        osc.start();
        setTimeout(() => { osc.frequency.setValueAtTime(1320, audioCtx.currentTime); }, 80);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.stop(audioCtx.currentTime + 0.25);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
        osc.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('Audio blocked.');
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#8C1D1D', '#1B365D', '#10b981', '#ffffff']
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, nim, prodi, faculty, category } = formData;

    if (!name.trim() || !nim.trim() || !prodi.trim() || !faculty.trim()) {
      setToast({ message: 'Semua kolom formulir wajib diisi!', type: 'warning' });
      return;
    }

    setLoading(true);
    setStatusResult(null);

    try {
      const student = await registerAndMarkAttendance(
        nim.trim(),
        name.trim(),
        faculty.trim(),
        prodi.trim(),
        category
      );

      playSound('success');
      triggerConfetti();

      setStatusResult({ success: true, student, error: null });
      setToast({
        message: `Presensi Berhasil! Selamat datang, ${student.name} 🎉`,
        type: 'success'
      });

      // Auto-reset form after 6 seconds
      setTimeout(() => {
        setStatusResult(null);
        setFormData({
          name: '',
          nim: '',
          prodi: '',
          faculty: 'Fakultas Ilmu Komputer',
          category: 'Peserta'
        });
      }, 8000);

    } catch (err) {
      playSound('error');
      setStatusResult({ success: false, student: null, error: err.message || 'Presensi Gagal.' });
      setToast({ message: err.message || 'Presensi Gagal.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStatusResult(null);
    setFormData({
      name: '',
      nim: '',
      prodi: '',
      faculty: 'Fakultas Ilmu Komputer',
      category: 'Peserta'
    });
  };

  const isTamu = statusResult?.student?.category === 'Tamu';

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-brand-bg-dark px-4 py-8 overflow-hidden">
      {/* Decorative warm accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-cyan/[0.04] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-brand-blue/[0.04] blur-[110px] pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-2xl border border-brand-cyan/10 glass-panel shadow-brand-glow z-10 animate-slide-up">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-cyan" />

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-7">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">
            <BookOpen className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-wide text-brand-blue">
              PRESENSI WORKSHOP KTI
            </h2>
            <p className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest mt-1">
              Dies Natalis FASTIKOM XXV
            </p>
          </div>

          {/* Guide motto */}
          <p className="text-[11px] font-semibold text-slate-500 max-w-xs">
            "Problematika dan Solusi Cerdas KTI Mahasiswa"
          </p>
        </div>

        {/* ──────── SUCCESS STATE ──────── */}
        {statusResult && statusResult.success && (
          <div className="space-y-4 animate-fade-in">
            {/* Icon */}
            <div className="flex flex-col items-center space-y-2">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border ${
                isTamu
                  ? 'bg-purple-500/10 border-purple-500/25 text-purple-600'
                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600'
              }`}>
                <CheckCircle2 className="w-9 h-9 animate-bounce" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800">PRESENSI SUKSES!</h3>
              <p className={`text-xs font-bold ${isTamu ? 'text-purple-600 animate-pulse' : 'text-emerald-600 animate-pulse'}`}>
                Selamat Mengikuti Acara Workshop 🎉
              </p>
            </div>

            {/* Kategori Badge besar */}
            <div className="flex justify-center">
              {isTamu ? (
                <span className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest border border-purple-500/35 bg-purple-50 text-purple-700 shadow-md">
                  <Star className="w-3.5 h-3.5" />
                  <span>Tamu Undangan</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest border border-brand-cyan/35 bg-brand-cyan/10 text-brand-cyan shadow-md">
                  <Users className="w-3.5 h-3.5" />
                  <span>Peserta Workshop</span>
                </span>
              )}
            </div>

            {/* Detail Card */}
            <div className={`rounded-xl border p-5 bg-white/70 space-y-3.5 ${
              isTamu ? 'border-purple-500/20' : 'border-emerald-500/15'
            }`}>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Nama Lengkap</span>
                <p className="text-base font-extrabold text-slate-800 leading-tight mt-0.5">{statusResult.student.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">NIM / ID</span>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{statusResult.student.nim}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Waktu Hadir</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    {new Date(statusResult.student.scannedAt).toLocaleTimeString('id-ID')} WIB
                  </p>
                </div>
              </div>
              {statusResult.student.prodi && (
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Program Studi</span>
                  <p className="text-xs font-semibold text-slate-650 mt-0.5">{statusResult.student.prodi}</p>
                </div>
              )}
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Instansi / Fakultas</span>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">{statusResult.student.faculty}</p>
              </div>
            </div>

            {/* Auto-reset notice + manual button */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-slate-500 font-semibold animate-pulse">
                Form terbuka otomatis dalam beberapa detik...
              </p>
              <button
                onClick={handleReset}
                className="flex items-center space-x-1 text-[10px] text-slate-600 hover:text-brand-cyan font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Presensi Lain</span>
              </button>
            </div>
          </div>
        )}

        {/* ──────── ERROR STATE ──────── */}
        {statusResult && !statusResult.success && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col items-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-600">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">PRESENSI DITOLAK</h3>
            </div>
            <div className="p-4 rounded-xl border border-rose-500/25 bg-rose-50/50 space-y-1">
              <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block">Keterangan</span>
              <p className="text-sm font-semibold text-slate-700 leading-normal">{statusResult.error}</p>
            </div>
            <button
              onClick={handleReset}
              className="w-full btn-glass py-2.5 text-xs flex items-center justify-center space-x-2 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        {/* ──────── FORM STATE ──────── */}
        {!statusResult && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category selection - Premium Tab selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                Kategori Kehadiran
              </label>
              <div className="grid grid-cols-2 gap-3 bg-white/70 p-1.5 rounded-xl border border-brand-cyan/10">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: 'Peserta' }))}
                  className={`py-3.5 rounded-lg text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    formData.category === 'Peserta'
                      ? 'bg-brand-cyan text-white shadow-md'
                      : 'text-slate-500 hover:text-brand-blue'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Peserta Workshop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: 'Tamu' }))}
                  className={`py-3.5 rounded-lg text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    formData.category === 'Tamu'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-500 hover:text-purple-650'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Tamu Undangan</span>
                </button>
              </div>
            </div>

            {/* Nama Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                Nama Lengkap
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="w-4 h-4 text-slate-450" />
                </span>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Masukkan Nama Lengkap Anda..."
                  value={formData.name}
                  disabled={loading}
                  onChange={handleChange}
                  className="w-full pl-10 glass-input text-sm text-slate-800"
                />
              </div>
            </div>

            {/* NIM / ID Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                {formData.category === 'Tamu' ? 'NIM / Kode ID Undangan' : 'NIM Mahasiswa'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Fingerprint className="w-4 h-4 text-slate-450" />
                </span>
                <input
                  type="text"
                  name="nim"
                  required
                  placeholder={formData.category === 'Tamu' ? "Masukkan NIM / Kode Tamu..." : "Masukkan NIM Anda..."}
                  value={formData.nim}
                  disabled={loading}
                  onChange={handleChange}
                  className="w-full pl-10 glass-input text-sm text-slate-800 font-mono tracking-wide"
                />
              </div>
            </div>

            {/* Prodi Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                Program Studi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <GraduationCap className="w-4 h-4 text-slate-450" />
                </span>
                <input
                  type="text"
                  name="prodi"
                  required
                  placeholder="Contoh: Teknik Informatika"
                  value={formData.prodi}
                  disabled={loading}
                  onChange={handleChange}
                  className="w-full pl-10 glass-input text-sm text-slate-800"
                />
              </div>
            </div>

            {/* Faculty Dropdown Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                Fakultas / Instansi
              </label>
              <select
                name="faculty"
                required
                value={formData.faculty}
                disabled={loading}
                onChange={handleChange}
                className="w-full glass-input text-sm text-slate-800 bg-white/90 cursor-pointer"
              >
                <option value="Fakultas Ilmu Komputer">Fakultas Ilmu Komputer</option>
                <option value="Fakultas Teknik">Fakultas Teknik</option>
                <option value="Fakultas Ekonomi">Fakultas Ekonomi</option>
                <option value="Fakultas Keguruan">Fakultas Keguruan</option>
                <option value="Fakultas Kedokteran">Fakultas Kedokteran</option>
                <option value="Fakultas Hukum">Fakultas Hukum</option>
                <option value="Instansi Luar / Umum">Instansi Luar / Umum</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 flex items-center justify-center space-x-2 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-[0.99] cursor-pointer text-sm ${
                formData.category === 'Tamu'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                  : 'bg-brand-cyan hover:bg-brand-cyan/95 shadow-brand-cyan/20'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Memproses Presensi...</span>
                </>
              ) : (
                <>
                  <span>Kirim Presensi Kehadiran</span>
                  <ChevronRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] font-black text-slate-500 mt-8 uppercase tracking-wider">
        © 2026 Badan Eksekutif Mahasiswa FASTIKOM
      </p>

      {/* Toast */}
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

export default PublicAttendance;

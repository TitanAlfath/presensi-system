import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, BookOpen, KeyRound, AlertCircle } from 'lucide-react';
import { seedInitialData } from '../firebase/db';

/**
 * Modern glassmorphic Login Page.
 */
const Login = () => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Preset admin passcode (default: 123456)
  const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || '123456';

  useEffect(() => {
    // If session is already active, redirect
    if (sessionStorage.getItem('admin_session') === 'active') {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Small delay to make the login transition feel premium
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (passcode === ADMIN_PASSCODE) {
      try {
        // Seed mock students automatically on first successful admin entry
        await seedInitialData(false);
        sessionStorage.setItem('admin_session', 'active');
        navigate('/admin/dashboard');
      } catch (err) {
        setError('Koneksi database terganggu. Gagal inisialisasi.');
      }
    } else {
      setError('Kode Akses Administrator tidak valid!');
      setPasscode('');
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-brand-bg-dark px-4 overflow-hidden">
      {/* Decorative backdrop glow orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-cyan/5 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-brand-blue/5 blur-[140px]" />

      {/* Login Card */}
      <div className="relative w-full max-w-md p-8 rounded-2xl border border-brand-cyan/10 glass-panel shadow-lg bg-white/60 z-10 animate-slide-up">
        {/* Banner strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-cyan" />

        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan shadow-md">
            <BookOpen className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-wide text-slate-800">
              SISTEM PRESENSI KTI
            </h2>
            <p className="text-xs font-semibold text-brand-cyan uppercase tracking-widest mt-1">
              Dies Natalis FASTIKOM XXV
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              KODE AKSES ADMINISTRATOR
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="Masukkan Kode Keamanan"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full pl-10 glass-input text-center text-lg tracking-widest text-slate-800"
              />
            </div>
            <p className="text-[10px] text-slate-600 font-medium leading-relaxed mt-1 text-center">
              Kode pengujian bawaan: <span className="font-bold text-brand-cyan">123456</span>
            </p>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-rose-50 border border-rose-250 text-rose-700 animate-pulse">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="text-xs font-semibold">{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-cyan py-3 flex items-center justify-center space-x-2 shadow-md"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Masuk Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <p className="text-center text-[10px] font-semibold text-slate-500 mt-8 leading-normal uppercase tracking-wider">
          © 2026 Badan Eksekutif Mahasiswa FASTIKOM
        </p>
      </div>
    </div>
  );
};

export default Login;

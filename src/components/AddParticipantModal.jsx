import React, { useState } from 'react';
import { X, UserPlus, Fingerprint, Landmark } from 'lucide-react';
import { addCustomParticipant } from '../firebase/db';

/**
 * Modern modal to register a new participant manually.
 */
const AddParticipantModal = ({ isOpen, onClose, onSuccess, onError }) => {
  const [nim, setNim] = useState('');
  const [name, setName] = useState('');
  const [faculty, setFaculty] = useState('Fakultas Ilmu Komputer');
  const [category, setCategory] = useState('Peserta');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const cleanNim = nim.trim();
    const cleanName = name.trim();
    
    if (!cleanNim || !cleanName || !faculty) {
      onError('Semua kolom formulir harus diisi!');
      return;
    }

    setLoading(true);
    try {
      await addCustomParticipant(cleanNim, cleanName, faculty, 'Teknik Informatika', '6281234567890', category);
      onSuccess(`Peserta baru "${cleanName}" berhasil terdaftar!`);
      // Clear inputs
      setNim('');
      setName('');
      setFaculty('Fakultas Ilmu Komputer');
      setCategory('Peserta');
      onClose();
    } catch (err) {
      onError(err.message || 'Gagal mendaftarkan peserta.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg-dark/80 backdrop-blur-sm animate-fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-white/10 glass-panel shadow-cyan-glow bg-[#0c142c]/90">
        {/* Banner Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-cyan to-brand-blue" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center space-x-3 text-white">
            <UserPlus className="w-5 h-5 text-brand-cyan" />
            <h3 className="font-semibold text-base tracking-wide">Registrasi Peserta Baru</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-white/5 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* NIM */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              NIM Peserta
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Fingerprint className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Contoh: 2201010025"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                className="w-full pl-10 glass-input"
              />
            </div>
          </div>

          {/* Nama */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Nama Lengkap
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <UserPlus className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 glass-input"
              />
            </div>
          </div>

          {/* Fakultas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Fakultas / Program Studi
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Landmark className="w-4 h-4" />
              </span>
              <select
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                className="w-full pl-10 glass-input appearance-none bg-[#0a1122] cursor-pointer"
              >
                {facultiesList.map((fac) => (
                  <option key={fac} value={fac} className="bg-brand-bg-card text-white">
                    {fac}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kategori */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Kategori Pendaftaran
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Landmark className="w-4 h-4" />
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 glass-input appearance-none bg-[#0a1122] cursor-pointer text-xs"
              >
                <option value="Peserta" className="bg-brand-bg-card text-white">Peserta Workshop (Mahasiswa)</option>
                <option value="Tamu" className="bg-brand-bg-card text-white">Tamu Undangan (VVIP)</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-glass px-4 py-2 text-sm"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-cyan px-5 py-2 text-sm flex items-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Daftarkan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddParticipantModal;

import React, { useState, useEffect } from 'react';
import { X, Edit3, User, Fingerprint, Landmark, BookOpen, CheckSquare, ShieldCheck, Phone } from 'lucide-react';
import { updateParticipant } from '../firebase/db';

/**
 * Modern glassmorphic modal to edit an existing participant's credentials (with phone number support).
 */
const EditParticipantModal = ({ 
  isOpen, 
  onClose, 
  participant, 
  onSuccess, 
  onError 
}) => {
  const [nim, setNim] = useState('');
  const [name, setName] = useState('');
  const [prodi, setProdi] = useState('');
  const [faculty, setFaculty] = useState('Fakultas Ilmu Komputer');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState('Belum Hadir');
  const [paymentStatus, setPaymentStatus] = useState('Menunggu Verifikasi');
  const [category, setCategory] = useState('Peserta');
  
  const [loading, setLoading] = useState(false);

  // Pre-fill form when participant is loaded/selected
  useEffect(() => {
    if (participant) {
      setNim(participant.nim || '');
      setName(participant.name || '');
      setProdi(participant.prodi || '');
      setFaculty(participant.faculty || 'Fakultas Ilmu Komputer');
      setPhoneNumber(participant.phoneNumber || '');
      setStatus(participant.status || 'Belum Hadir');
      setPaymentStatus(participant.paymentStatus || 'Menunggu Verifikasi');
      setCategory(participant.category || 'Peserta');
    }
  }, [participant]);

  if (!isOpen || !participant) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const cleanNim = nim.trim();
    const cleanName = name.trim();
    const cleanProdi = prodi.trim();
    const cleanPhone = phoneNumber.trim();
    
    if (!cleanNim || !cleanName || !cleanProdi || !cleanPhone || !faculty) {
      onError('Semua kolom formulir harus diisi!');
      return;
    }

    setLoading(true);
    try {
      const updatedData = {
        name: cleanName,
        faculty: faculty,
        prodi: cleanProdi,
        phoneNumber: cleanPhone,
        status: status,
        paymentStatus: paymentStatus,
        category: category,
        scannedAt: status === 'Hadir' 
          ? (participant.scannedAt || new Date().toISOString()) 
          : null
      };

      await updateParticipant(cleanNim, participant.nim, updatedData);
      onSuccess(`Data "${cleanName}" berhasil diperbarui!`);
      onClose();
    } catch (err) {
      onError(err.message || 'Gagal memperbarui data peserta.');
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

      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-white/10 glass-panel shadow-cyan-glow bg-[#0c142c]/95">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-cyan to-brand-blue" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center space-x-3 text-white">
            <Edit3 className="w-5 h-5 text-brand-cyan" />
            <h3 className="font-semibold text-base tracking-wide">Edit Data Peserta</h3>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  className="w-full pl-10 glass-input text-xs"
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
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 glass-input text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Program Studi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Program Studi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <BookOpen className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={prodi}
                  onChange={(e) => setProdi(e.target.value)}
                  className="w-full pl-10 glass-input text-xs"
                />
              </div>
            </div>

            {/* Fakultas */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Fakultas
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Landmark className="w-4 h-4" />
                </span>
                <select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full pl-10 glass-input appearance-none bg-[#090f1d] cursor-pointer text-xs"
                >
                  {facultiesList.map((fac) => (
                    <option key={fac} value={fac} className="bg-brand-bg-card text-white">
                      {fac}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Nomor HP/WA & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Nomor WhatsApp
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 glass-input text-xs font-mono"
                  placeholder="Contoh: 6281234567890"
                />
              </div>
            </div>

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
                  className="w-full pl-10 glass-input appearance-none bg-[#090f1d] cursor-pointer text-xs"
                >
                  <option value="Peserta" className="bg-brand-bg-card text-white">Peserta Workshop</option>
                  <option value="Tamu" className="bg-brand-bg-card text-white">Tamu Undangan (VVIP)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
            {/* Attendance Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Status Kehadiran
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <CheckSquare className="w-4 h-4" />
                </span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full pl-10 glass-input appearance-none bg-[#090f1d] cursor-pointer text-xs"
                >
                  <option value="Belum Hadir" className="bg-brand-bg-card text-white">Belum Hadir</option>
                  <option value="Hadir" className="bg-brand-bg-card text-white">Hadir</option>
                </select>
              </div>
            </div>

            {/* Payment Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Status Pembayaran
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full pl-10 glass-input appearance-none bg-[#090f1d] cursor-pointer text-xs"
                >
                  <option value="Menunggu Verifikasi" className="bg-brand-bg-card text-white">Menunggu Verifikasi</option>
                  <option value="Lunas" className="bg-brand-bg-card text-white">Lunas</option>
                  <option value="Ditolak" className="bg-brand-bg-card text-white">Ditolak</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-6 flex items-center justify-end space-x-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="btn-glass px-4 py-2 text-xs"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-cyan px-5 py-2 text-xs flex items-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditParticipantModal;

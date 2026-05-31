import React, { useState, useEffect } from 'react';
import { listenToParticipants } from '../firebase/db';
import { 
  Users, 
  Star, 
  Clock, 
  Award,
  BookOpen, 
  Activity,
  UserCheck
} from 'lucide-react';

/**
 * Premium Live Presence Projector Screen.
 * Displays checked-in guests and participants side-by-side with real-time updates.
 */
const LivePresence = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time time updater
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Firestore/Local Database listener
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

  // Filter only those marked as present ('Hadir')
  const presentList = participants
    .filter(p => p.status === 'Hadir')
    // Sort by scannedAt DESC (newest arrivals first)
    .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));

  // Partition present lists
  const presentTamu = presentList.filter(p => p.category === 'Tamu');
  const presentPeserta = presentList.filter(p => p.category !== 'Tamu');

  // Count registers
  const totalRegisteredTamu = participants.filter(p => p.category === 'Tamu').length;
  const totalRegisteredPeserta = participants.filter(p => p.category !== 'Tamu' && p.paymentStatus === 'Lunas').length;

  const formatClock = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' WIB';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Helper to determine if checked in within the last 15 seconds (for glowing entry animation)
  const isRecentArrival = (isoString) => {
    if (!isoString) return false;
    const diff = new Date() - new Date(isoString);
    return diff >= 0 && diff < 15000; // 15 seconds
  };

  const getCheckInTimeStr = (isoString) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) + ' WIB';
    } catch {
      return '-';
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg-dark flex flex-col p-6 overflow-hidden relative select-none">
      {/* Decorative glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-cyan/[0.04] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-blue/[0.04] blur-[150px] pointer-events-none" />

      {/* Header Board */}
      <header className="relative z-10 flex flex-col md:flex-row md:items-center justify-between border-b-2 border-brand-cyan/15 pb-5 mb-6 gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-cyan/10 border-2 border-brand-cyan/20 flex items-center justify-center text-brand-cyan shadow-md">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-wide uppercase leading-tight">
              LIVE PRESENSI WORKSHOP KTI
            </h1>
            <p className="text-xs font-black text-brand-cyan uppercase tracking-widest mt-0.5">
              Dies Natalis FASTIKOM XXV — "Problematika dan Solusi Cerdas KTI Mahasiswa"
            </p>
          </div>
        </div>

        {/* Live Clock HUD */}
        <div className="flex items-center space-x-4 bg-white/70 border border-brand-cyan/10 px-5 py-3 rounded-2xl shadow-sm glass-panel">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formatDate(currentTime)}</p>
            <p className="text-lg font-black text-brand-blue tracking-wider font-mono leading-none mt-1">
              {formatClock(currentTime)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-brand-cyan/5 border border-brand-cyan/10">
            <Clock className="w-5 h-5 text-brand-cyan animate-pulse" />
          </div>
        </div>
      </header>

      {/* Statistics Dashboard Banner */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6 relative z-10">
        {/* Card: Total Presence */}
        <div className="rounded-2xl border-2 border-emerald-500/10 bg-emerald-50/40 p-5 shadow-sm flex items-center justify-between overflow-hidden relative">
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-emerald-500/5 blur-lg" />
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Total Kehadiran</span>
            <p className="text-4xl font-black text-slate-800 leading-none">
              {presentList.length} <span className="text-xs font-semibold text-slate-400">orang</span>
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700">
            <UserCheck className="w-6 h-6 animate-bounce" />
          </div>
        </div>

        {/* Card: VIP Presence */}
        <div className="rounded-2xl border-2 border-purple-500/10 bg-purple-50/40 p-5 shadow-sm flex items-center justify-between overflow-hidden relative">
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-purple-500/5 blur-lg" />
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Tamu Undangan (VIP)</span>
            <p className="text-4xl font-black text-slate-800 leading-none">
              {presentTamu.length} <span className="text-xs font-semibold text-slate-400">/ {totalRegisteredTamu} diundang</span>
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700">
            <Star className="w-6 h-6" />
          </div>
        </div>

        {/* Card: Regular Presence */}
        <div className="rounded-2xl border-2 border-brand-cyan/10 bg-brand-cyan/5 p-5 shadow-sm flex items-center justify-between overflow-hidden relative">
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-brand-cyan/5 blur-lg" />
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-cyan">Peserta Workshop</span>
            <p className="text-4xl font-black text-slate-800 leading-none">
              {presentPeserta.length} <span className="text-xs font-semibold text-slate-400">/ {totalRegisteredPeserta} terdaftar</span>
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Main Dual Projector Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 min-h-0">
        {/* TAMU UNDANGAN (VIP) MONITOR PANEL */}
        <div className="flex flex-col h-full rounded-3xl border border-purple-500/15 glass-panel bg-white/50 shadow-md overflow-hidden min-h-0">
          {/* Section Header bar */}
          <div className="flex items-center px-6 py-4.5 border-b border-purple-500/15 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent flex-shrink-0">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-700 mr-3">
              <Star className="w-4.5 h-4.5 fill-purple-600/30" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-purple-800 leading-tight">
                Tamu Undangan & Delegasi VIP
              </h2>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                Kehadiran terhormat pejabat & perwakilan instansi
              </p>
            </div>
            <span className="ml-auto px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500 text-white shadow-sm border border-purple-600/25">
              {presentTamu.length} HADIR
            </span>
          </div>

          {/* Realtime Checked-in Guest List */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[calc(100vh-280px)] custom-scrollbar">
            {presentTamu.length > 0 ? (
              presentTamu.map((p) => {
                const isNewArrival = isRecentArrival(p.scannedAt);
                return (
                  <div
                    key={p.nim}
                    className={`relative rounded-2xl border p-4.5 bg-white shadow-xs transition-all duration-500 flex items-center justify-between ${
                      isNewArrival
                        ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02] bg-emerald-50/30 z-10 animate-pulse'
                        : 'border-purple-500/10 hover:border-purple-500/20'
                    }`}
                  >
                    {isNewArrival && (
                      <div className="absolute top-3 right-3 flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-500 text-white font-extrabold text-[8px] tracking-wider uppercase animate-bounce">
                        <Activity className="w-2.5 h-2.5" />
                        <span>Baru Datang!</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black border ${
                        isNewArrival 
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                          : 'bg-purple-500/10 border-purple-500/20 text-purple-700'
                      }`}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-extrabold text-slate-800 leading-tight">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wide">
                          {p.faculty} {p.prodi ? `— ${p.prodi}` : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 justify-end">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Check In</span>
                      </p>
                      <p className="text-sm font-black text-slate-700 font-mono mt-0.5">
                        {getCheckInTimeStr(p.scannedAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
                  <Star className="w-6 h-6 text-slate-350" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">Belum Ada Tamu VIP</p>
                  <p className="text-xs text-slate-450 mt-1 max-w-xs font-semibold">
                    Monitor ini siap menampilkan data tamu yang check-in secara instan.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PESERTA WORKSHOP MONITOR PANEL */}
        <div className="flex flex-col h-full rounded-3xl border border-brand-cyan/15 glass-panel bg-white/50 shadow-md overflow-hidden min-h-0">
          {/* Section Header bar */}
          <div className="flex items-center px-6 py-4.5 border-b border-brand-cyan/15 bg-gradient-to-r from-brand-cyan/10 via-brand-cyan/5 to-transparent flex-shrink-0">
            <div className="p-2 rounded-xl bg-brand-cyan/15 border border-brand-cyan/20 text-brand-cyan mr-3">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-brand-cyan leading-tight">
                Peserta Workshop KTI
              </h2>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                Daftar mahasiswa reguler yang hadir di venue
              </p>
            </div>
            <span className="ml-auto px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-brand-cyan text-white shadow-sm border border-brand-cyan/25">
              {presentPeserta.length} HADIR
            </span>
          </div>

          {/* Realtime Checked-in Participant List */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[calc(100vh-280px)] custom-scrollbar">
            {presentPeserta.length > 0 ? (
              presentPeserta.map((p) => {
                const isNewArrival = isRecentArrival(p.scannedAt);
                return (
                  <div
                    key={p.nim}
                    className={`relative rounded-2xl border p-4.5 bg-white shadow-xs transition-all duration-500 flex items-center justify-between ${
                      isNewArrival
                        ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02] bg-emerald-50/30 z-10 animate-pulse'
                        : 'border-brand-cyan/10 hover:border-brand-cyan/20'
                    }`}
                  >
                    {isNewArrival && (
                      <div className="absolute top-3 right-3 flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-500 text-white font-extrabold text-[8px] tracking-wider uppercase animate-bounce">
                        <Activity className="w-2.5 h-2.5" />
                        <span>Baru Datang!</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black border ${
                        isNewArrival 
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                          : 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan'
                      }`}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-extrabold text-slate-800 leading-tight">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                          {p.nim} — {p.prodi}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 justify-end">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Check In</span>
                      </p>
                      <p className="text-sm font-black text-slate-700 font-mono mt-0.5">
                        {getCheckInTimeStr(p.scannedAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
                  <Users className="w-6 h-6 text-slate-350" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">Belum Ada Peserta Workshop</p>
                  <p className="text-xs text-slate-450 mt-1 max-w-xs font-semibold">
                    Monitor ini siap menampilkan data peserta reguler yang check-in secara instan.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePresence;
